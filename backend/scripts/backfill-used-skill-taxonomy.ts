import 'dotenv/config';
import { Pool, type PoolClient } from 'pg';

const SOURCE = 'manual_backfill_used_skills';

type BackfillItem = {
  name: string;
  taxonomyGroup: string;
  taxonomySubgroup: string;
};

type SkillRow = {
  id: string;
  name: string;
};

type MappingRow = {
  id: string;
  taxonomy_group: string;
  taxonomy_subgroup: string | null;
  source: string | null;
};

type FinalMappingRow = {
  requested_name: string;
  skill_id: string | null;
  skill_name: string | null;
  taxonomy_group: string | null;
  taxonomy_subgroup: string | null;
  source: string | null;
};

const ITEMS: BackfillItem[] = [
  {
    name: 'Python',
    taxonomyGroup: 'Software Development',
    taxonomySubgroup: 'Backend',
  },
  {
    name: 'React',
    taxonomyGroup: 'Software Development',
    taxonomySubgroup: 'Frontend',
  },
  {
    name: 'ReactJS',
    taxonomyGroup: 'Software Development',
    taxonomySubgroup: 'Frontend',
  },
  {
    name: 'CSS3',
    taxonomyGroup: 'Software Development',
    taxonomySubgroup: 'Frontend',
  },
  {
    name: 'HTML5',
    taxonomyGroup: 'Software Development',
    taxonomySubgroup: 'Frontend',
  },
  {
    name: 'Docker',
    taxonomyGroup: 'Infrastructure & Cloud',
    taxonomySubgroup: 'DevOps',
  },
  {
    name: 'Git',
    taxonomyGroup: 'Software Development',
    taxonomySubgroup: 'Development Tools',
  },
  {
    name: 'NestJS',
    taxonomyGroup: 'Software Development',
    taxonomySubgroup: 'Backend',
  },
  {
    name: 'Node.js',
    taxonomyGroup: 'Software Development',
    taxonomySubgroup: 'Backend',
  },
  {
    name: 'REST API',
    taxonomyGroup: 'Software Development',
    taxonomySubgroup: 'Backend',
  },
  {
    name: 'Technical Documentation',
    taxonomyGroup: 'Other IT',
    taxonomySubgroup: 'Documentation',
  },
  {
    name: 'Unit Testing',
    taxonomyGroup: 'QA & Testing',
    taxonomySubgroup: 'Test Automation',
  },
];

const isApply = process.argv.includes('--apply');
const isDryRun = !isApply || process.argv.includes('--dry-run');

function getDatabaseUrl() {
  const rawUrl = process.env.DATABASE_URL?.trim();

  if (!rawUrl) {
    throw new Error('DATABASE_URL is missing');
  }

  const url = new URL(rawUrl);
  url.searchParams.delete('schema');

  return url.toString();
}

function sameMapping(mapping: MappingRow, item: BackfillItem) {
  return (
    mapping.taxonomy_group === item.taxonomyGroup &&
    (mapping.taxonomy_subgroup ?? '') === item.taxonomySubgroup
  );
}

async function findSkillByName(client: PoolClient, name: string) {
  const result = await client.query<SkillRow>(
    `
      SELECT id::text AS id, name
      FROM "Skill"
      WHERE lower(name) = lower($1)
      ORDER BY CASE WHEN name = $1 THEN 0 ELSE 1 END, name ASC
    `,
    [name],
  );

  if (result.rowCount === 0) return null;

  const exactMatches = result.rows.filter((row) => row.name === name);

  if (exactMatches.length === 1) return exactMatches[0];

  if (result.rowCount === 1) return result.rows[0];

  return {
    ambiguous: true,
    rows: result.rows,
  };
}

async function getMappings(client: PoolClient, skillId: string) {
  const result = await client.query<MappingRow>(
    `
      SELECT id::text AS id, taxonomy_group, taxonomy_subgroup, source
      FROM "SkillTaxonomyMapping"
      WHERE skill_id = $1::uuid
      ORDER BY created_at ASC, id ASC
    `,
    [skillId],
  );

  return result.rows;
}

async function insertMapping(
  client: PoolClient,
  skillId: string,
  item: BackfillItem,
) {
  await client.query(
    `
      INSERT INTO "SkillTaxonomyMapping" (
        skill_id,
        taxonomy_group,
        taxonomy_subgroup,
        source,
        created_at,
        updated_at
      )
      VALUES ($1::uuid, $2, $3, $4, NOW(), NOW())
      ON CONFLICT (skill_id, taxonomy_group, taxonomy_subgroup)
      DO UPDATE SET
        source = EXCLUDED.source,
        updated_at = NOW()
    `,
    [skillId, item.taxonomyGroup, item.taxonomySubgroup, SOURCE],
  );
}

async function updateMapping(
  client: PoolClient,
  mappingId: string,
  item: BackfillItem,
) {
  await client.query(
    `
      UPDATE "SkillTaxonomyMapping"
      SET
        taxonomy_group = $2,
        taxonomy_subgroup = $3,
        source = $4,
        updated_at = NOW()
      WHERE id = $1::uuid
    `,
    [mappingId, item.taxonomyGroup, item.taxonomySubgroup, SOURCE],
  );
}

async function printFinalMappings(client: PoolClient) {
  console.log('\n=== CURRENT MAPPINGS FOR REQUESTED SKILLS ===');

  const result = await client.query<FinalMappingRow>(
    `
      WITH requested(name, ord) AS (
        SELECT *
        FROM unnest($1::text[]) WITH ORDINALITY
      ),
      matched_skill AS (
        SELECT DISTINCT ON (r.name)
          r.name AS requested_name,
          s.id::text AS skill_id,
          s.name AS skill_name,
          r.ord
        FROM requested r
        LEFT JOIN "Skill" s
          ON lower(s.name) = lower(r.name)
        ORDER BY r.name, CASE WHEN s.name = r.name THEN 0 ELSE 1 END, s.name ASC
      )
      SELECT
        ms.requested_name,
        ms.skill_id,
        ms.skill_name,
        stm.taxonomy_group,
        stm.taxonomy_subgroup,
        stm.source
      FROM matched_skill ms
      LEFT JOIN "SkillTaxonomyMapping" stm
        ON stm.skill_id = ms.skill_id::uuid
      ORDER BY ms.ord ASC, stm.taxonomy_group ASC, stm.taxonomy_subgroup ASC
    `,
    [ITEMS.map((item) => item.name)],
  );

  for (const row of result.rows) {
    if (!row.skill_id) {
      console.log(`${row.requested_name}: WARNING skill not found`);
      continue;
    }

    const mapping =
      row.taxonomy_group && row.taxonomy_subgroup
        ? `${row.taxonomy_group} / ${row.taxonomy_subgroup}`
        : '(no taxonomy mapping)';

    console.log(
      `${row.skill_name} [${row.skill_id}]: ${mapping} | source=${row.source ?? '-'}`,
    );
  }
}

async function main() {
  console.log('=== BACKFILL USED SKILL TAXONOMY ===');
  console.log(`Mode: ${isDryRun ? 'DRY RUN' : 'APPLY'}`);
  console.log(`Source: ${SOURCE}`);

  const pool = new Pool({
    connectionString: getDatabaseUrl(),
  });

  const client = await pool.connect();

  const stats = {
    insert: 0,
    update: 0,
    skip: 0,
    warning: 0,
  };

  try {
    if (!isDryRun) {
      await client.query('BEGIN');
    }

    for (const item of ITEMS) {
      const skill = await findSkillByName(client, item.name);

      if (!skill) {
        stats.warning += 1;
        console.warn(`[WARNING] Skill not found: ${item.name}`);
        continue;
      }

      if ('ambiguous' in skill) {
        stats.warning += 1;
        console.warn(
          `[WARNING] Ambiguous skill name "${item.name}", skipped. Matches: ${skill.rows
            .map((row) => `${row.name} (${row.id})`)
            .join(', ')}`,
        );
        continue;
      }

      const mappings = await getMappings(client, skill.id);
      const desiredMapping = mappings.find((mapping) => sameMapping(mapping, item));

      if (desiredMapping) {
        if (desiredMapping.source === SOURCE) {
          stats.skip += 1;
          console.log(
            `[SKIP] ${skill.name}: already mapped to ${item.taxonomyGroup} / ${item.taxonomySubgroup}`,
          );
          continue;
        }

        stats.update += 1;
        console.log(
          `[${isDryRun ? 'DRY-RUN UPDATE' : 'UPDATE'}] ${skill.name}: source ${desiredMapping.source ?? '-'} -> ${SOURCE}`,
        );

        if (!isDryRun) {
          await updateMapping(client, desiredMapping.id, item);
        }

        continue;
      }

      if (mappings.length === 0) {
        stats.insert += 1;
        console.log(
          `[${isDryRun ? 'DRY-RUN INSERT' : 'INSERT'}] ${skill.name}: ${item.taxonomyGroup} / ${item.taxonomySubgroup}`,
        );

        if (!isDryRun) {
          await insertMapping(client, skill.id, item);
        }

        continue;
      }

      if (mappings.length === 1) {
        const current = mappings[0];
        stats.update += 1;
        console.log(
          `[${isDryRun ? 'DRY-RUN UPDATE' : 'UPDATE'}] ${skill.name}: ${current.taxonomy_group} / ${current.taxonomy_subgroup ?? '-'} -> ${item.taxonomyGroup} / ${item.taxonomySubgroup}`,
        );

        if (!isDryRun) {
          await updateMapping(client, current.id, item);
        }

        continue;
      }

      stats.warning += 1;
      console.warn(
        `[WARNING] ${skill.name}: has ${mappings.length} existing mappings and none matches requested mapping. Skipped to avoid clobbering multi-taxonomy data.`,
      );
    }

    if (!isDryRun) {
      await client.query('COMMIT');
    }

    console.log('\n=== BACKFILL SUMMARY ===');
    console.log(`insert: ${stats.insert}`);
    console.log(`update: ${stats.update}`);
    console.log(`skip: ${stats.skip}`);
    console.log(`warning: ${stats.warning}`);

    await printFinalMappings(client);

    if (isDryRun) {
      console.log('\nDry-run only. Re-run with --apply to write changes.');
    }
  } catch (error) {
    if (!isDryRun) {
      await client.query('ROLLBACK');
    }

    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error('Backfill failed:', error);
  process.exitCode = 1;
});
