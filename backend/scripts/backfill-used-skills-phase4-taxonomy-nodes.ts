import 'dotenv/config';
import { Pool, type PoolClient } from 'pg';

const SOURCE = 'manual_backfill_used_skills_phase4';

type BackfillItem = {
  name: string;
  groupName: string;
  subgroupName: string;
};

type SkillRow = {
  id: string;
  name: string;
};

type NodeRow = {
  id: string;
  name: string;
  parent_id: string | null;
  node_type: 'GROUP' | 'SUBGROUP';
};

type MappingRow = {
  id: string;
  taxonomy_group: string;
  taxonomy_subgroup: string | null;
  taxonomy_group_node_id: string | null;
  taxonomy_subgroup_node_id: string | null;
  source: string | null;
};

const ITEMS: BackfillItem[] = [
  { name: 'Airflow', groupName: 'Data & Databases', subgroupName: 'Data Engineering' },
  { name: 'Apache Spark', groupName: 'Data & Databases', subgroupName: 'Data Engineering' },
  { name: 'Data Modeling', groupName: 'Data & Databases', subgroupName: 'Data Modelling' },
  { name: 'ETL', groupName: 'Data & Databases', subgroupName: 'Data Integration / ETL' },
];

const isApply = process.argv.includes('--apply');
const isDryRun = !isApply || process.argv.includes('--dry-run');

function getDatabaseUrl() {
  const rawUrl = process.env.DATABASE_URL?.trim();
  if (!rawUrl) throw new Error('DATABASE_URL is missing');
  const url = new URL(rawUrl);
  url.searchParams.delete('schema');
  return url.toString();
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

  return { ambiguous: true as const, rows: result.rows };
}

async function findGroupNodeByName(client: PoolClient, name: string) {
  const result = await client.query<NodeRow>(
    `
      SELECT
        id::text AS id,
        name,
        parent_id::text AS parent_id,
        node_type
      FROM "SkillTaxonomyNode"
      WHERE node_type = 'GROUP'
        AND lower(name) = lower($1)
      LIMIT 1
    `,
    [name],
  );
  return result.rows[0] ?? null;
}

async function findSubgroupNodeByName(client: PoolClient, groupId: string, name: string) {
  const result = await client.query<NodeRow>(
    `
      SELECT
        id::text AS id,
        name,
        parent_id::text AS parent_id,
        node_type
      FROM "SkillTaxonomyNode"
      WHERE node_type = 'SUBGROUP'
        AND parent_id = $1::uuid
        AND lower(name) = lower($2)
      LIMIT 1
    `,
    [groupId, name],
  );
  return result.rows[0] ?? null;
}

async function getMappingsForSkill(client: PoolClient, skillId: string) {
  const result = await client.query<MappingRow>(
    `
      SELECT
        id::text AS id,
        taxonomy_group,
        taxonomy_subgroup,
        taxonomy_group_node_id::text AS taxonomy_group_node_id,
        taxonomy_subgroup_node_id::text AS taxonomy_subgroup_node_id,
        source
      FROM "SkillTaxonomyMapping"
      WHERE skill_id = $1::uuid
      ORDER BY created_at ASC, id ASC
    `,
    [skillId],
  );
  return result.rows;
}

function sameDesiredMapping(mapping: MappingRow, groupName: string, subgroupName: string) {
  return (
    mapping.taxonomy_group === groupName &&
    (mapping.taxonomy_subgroup ?? '') === subgroupName
  );
}

async function insertMapping(
  client: PoolClient,
  data: {
    skill_id: string;
    taxonomy_group: string;
    taxonomy_subgroup: string;
    taxonomy_group_node_id: string;
    taxonomy_subgroup_node_id: string;
  },
) {
  await client.query(
    `
      INSERT INTO "SkillTaxonomyMapping" (
        skill_id,
        taxonomy_group,
        taxonomy_subgroup,
        taxonomy_group_node_id,
        taxonomy_subgroup_node_id,
        source,
        created_at,
        updated_at
      )
      VALUES ($1::uuid, $2, $3, $4::uuid, $5::uuid, $6, NOW(), NOW())
      ON CONFLICT (skill_id, taxonomy_group, taxonomy_subgroup)
      DO UPDATE SET
        taxonomy_group_node_id = EXCLUDED.taxonomy_group_node_id,
        taxonomy_subgroup_node_id = EXCLUDED.taxonomy_subgroup_node_id,
        source = EXCLUDED.source,
        updated_at = NOW()
    `,
    [
      data.skill_id,
      data.taxonomy_group,
      data.taxonomy_subgroup,
      data.taxonomy_group_node_id,
      data.taxonomy_subgroup_node_id,
      SOURCE,
    ],
  );
}

async function updateMappingById(
  client: PoolClient,
  mappingId: string,
  data: {
    taxonomy_group: string;
    taxonomy_subgroup: string;
    taxonomy_group_node_id: string;
    taxonomy_subgroup_node_id: string;
  },
) {
  await client.query(
    `
      UPDATE "SkillTaxonomyMapping"
      SET
        taxonomy_group = $2,
        taxonomy_subgroup = $3,
        taxonomy_group_node_id = $4::uuid,
        taxonomy_subgroup_node_id = $5::uuid,
        source = $6,
        updated_at = NOW()
      WHERE id = $1::uuid
    `,
    [
      mappingId,
      data.taxonomy_group,
      data.taxonomy_subgroup,
      data.taxonomy_group_node_id,
      data.taxonomy_subgroup_node_id,
      SOURCE,
    ],
  );
}

async function main() {
  console.log('=== BACKFILL USED SKILLS (PHASE 4) TAXONOMY NODE FKs ===');
  console.log(`Mode: ${isDryRun ? 'DRY RUN' : 'APPLY'}`);
  console.log(`Source: ${SOURCE}`);

  const pool = new Pool({ connectionString: getDatabaseUrl() });
  const client = await pool.connect();

  const stats = { insert: 0, update: 0, skip: 0, warning: 0 };

  try {
    if (!isDryRun) await client.query('BEGIN');

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

      const groupNode = await findGroupNodeByName(client, item.groupName);
      if (!groupNode) {
        stats.warning += 1;
        console.warn(`[WARNING] GROUP node not found: "${item.groupName}"`);
        continue;
      }

      const subgroupNode = await findSubgroupNodeByName(
        client,
        groupNode.id,
        item.subgroupName,
      );
      if (!subgroupNode) {
        stats.warning += 1;
        console.warn(
          `[WARNING] SUBGROUP node not found: "${item.subgroupName}" under GROUP "${groupNode.name}" (${groupNode.id})`,
        );
        continue;
      }

      const desired = {
        skill_id: skill.id,
        taxonomy_group: groupNode.name,
        taxonomy_subgroup: subgroupNode.name,
        taxonomy_group_node_id: groupNode.id,
        taxonomy_subgroup_node_id: subgroupNode.id,
      };

      const mappings = await getMappingsForSkill(client, skill.id);
      const desiredMapping = mappings.find((m) =>
        sameDesiredMapping(m, desired.taxonomy_group, desired.taxonomy_subgroup),
      );

      if (desiredMapping) {
        const alreadyOk =
          desiredMapping.taxonomy_group_node_id === desired.taxonomy_group_node_id &&
          desiredMapping.taxonomy_subgroup_node_id === desired.taxonomy_subgroup_node_id &&
          desiredMapping.source === SOURCE;

        if (alreadyOk) {
          stats.skip += 1;
          console.log(
            `[SKIP] ${skill.name}: already mapped to ${desired.taxonomy_group} / ${desired.taxonomy_subgroup}`,
          );
          continue;
        }

        stats.update += 1;
        console.log(
          `[${isDryRun ? 'DRY-RUN UPDATE' : 'UPDATE'}] ${skill.name}: refresh node FKs + source`,
        );
        if (!isDryRun) {
          await updateMappingById(client, desiredMapping.id, desired);
        }
        continue;
      }

      if (mappings.length === 0) {
        stats.insert += 1;
        console.log(
          `[${isDryRun ? 'DRY-RUN INSERT' : 'INSERT'}] ${skill.name}: ${desired.taxonomy_group} / ${desired.taxonomy_subgroup}`,
        );
        if (!isDryRun) await insertMapping(client, desired);
        continue;
      }

      // Safety: do not clobber skills that already have other taxonomy mappings.
      stats.warning += 1;
      console.warn(
        `[WARNING] ${skill.name}: has ${mappings.length} existing mapping(s) and none matches desired mapping. Skipped to avoid clobbering multi-taxonomy data.`,
      );
    }

    if (!isDryRun) await client.query('COMMIT');

    console.log('\n=== BACKFILL SUMMARY ===');
    console.log(`insert: ${stats.insert}`);
    console.log(`update: ${stats.update}`);
    console.log(`skip: ${stats.skip}`);
    console.log(`warning: ${stats.warning}`);

    if (isDryRun) {
      console.log('\nDry-run only. Re-run with --apply to write changes.');
    }
  } catch (error) {
    if (!isDryRun) await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error('Backfill failed:', error?.message || String(error));
  process.exitCode = 1;
});

