import 'dotenv/config';
import { Pool, type PoolClient } from 'pg';

type MappingPairRow = {
  taxonomy_group: string;
  taxonomy_subgroup: string | null;
  mapping_count: number;
};

type MappingFkStatsRow = {
  total_mappings: number;
  with_group_node_id: number;
  with_subgroup_node_id: number;
  missing_any_node_fk: number;
};

type NodeStatsRow = {
  total_nodes: number;
  group_nodes: number;
  subgroup_nodes: number;
};

type NodeRow = {
  id: string;
  name: string;
  normalized_key: string;
  parent_id: string | null;
  level: number;
  node_type: 'GROUP' | 'SUBGROUP';
};

type MappingSampleRow = {
  mapping_id: string;
  skill_id: string;
  skill_name: string;
  taxonomy_group: string;
  taxonomy_subgroup: string | null;
  taxonomy_group_node_id: string | null;
  taxonomy_subgroup_node_id: string | null;
  group_node_key: string | null;
  subgroup_node_key: string | null;
};

const isApply = process.argv.includes('--apply');
const isDryRun = !isApply || process.argv.includes('--dry-run');

function normalizeKey(value: string) {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

function normalizeName(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

function getDatabaseUrl() {
  const rawUrl = process.env.DATABASE_URL?.trim();
  if (!rawUrl) throw new Error('DATABASE_URL is missing');

  const url = new URL(rawUrl);
  url.searchParams.delete('schema');
  return url.toString();
}

async function getDistinctPairs(client: PoolClient): Promise<MappingPairRow[]> {
  const result = await client.query<MappingPairRow>(
    `
      SELECT
        taxonomy_group,
        taxonomy_subgroup,
        COUNT(*)::int AS mapping_count
      FROM "SkillTaxonomyMapping"
      GROUP BY taxonomy_group, taxonomy_subgroup
      ORDER BY taxonomy_group ASC, taxonomy_subgroup ASC
    `,
  );
  return result.rows;
}

async function findExistingNode(
  client: PoolClient,
  parentId: string | null,
  normalizedKey: string,
) {
  const result = await client.query<NodeRow>(
    `
      SELECT
        id::text AS id,
        name,
        normalized_key,
        parent_id::text AS parent_id,
        level,
        node_type
      FROM "SkillTaxonomyNode"
      WHERE parent_id IS NOT DISTINCT FROM $1::uuid
        AND normalized_key = $2
      LIMIT 1
    `,
    [parentId, normalizedKey],
  );
  return result.rows[0] ?? null;
}

async function insertNode(
  client: PoolClient,
  data: {
    name: string;
    normalized_key: string;
    parent_id: string | null;
    level: number;
    node_type: 'GROUP' | 'SUBGROUP';
  },
) {
  const result = await client.query<{ id: string }>(
    `
      INSERT INTO "SkillTaxonomyNode" (
        name,
        normalized_key,
        parent_id,
        level,
        node_type,
        sort_order,
        is_active,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3::uuid, $4::int, $5::"SkillTaxonomyNodeType", 0, true, NOW(), NOW())
      RETURNING id::text AS id
    `,
    [
      data.name,
      data.normalized_key,
      data.parent_id,
      data.level,
      data.node_type,
    ],
  );
  return result.rows[0].id;
}

async function updateMappingsForPair(
  client: PoolClient,
  pair: { taxonomy_group: string; taxonomy_subgroup: string | null },
  groupNodeId: string,
  subgroupNodeId: string | null,
) {
  const result = await client.query<{ updated: number }>(
    `
      UPDATE "SkillTaxonomyMapping"
      SET
        taxonomy_group_node_id = $3::uuid,
        taxonomy_subgroup_node_id = $4::uuid,
        updated_at = NOW()
      WHERE taxonomy_group = $1
        AND taxonomy_subgroup IS NOT DISTINCT FROM $2
        AND (
          taxonomy_group_node_id IS DISTINCT FROM $3::uuid
          OR taxonomy_subgroup_node_id IS DISTINCT FROM $4::uuid
        )
      RETURNING 1
    `,
    [pair.taxonomy_group, pair.taxonomy_subgroup, groupNodeId, subgroupNodeId],
  );
  return result.rowCount ?? 0;
}

async function audit(client: PoolClient) {
  // Run sequentially to avoid pg client concurrent query warnings.
  const nodeStats = await client.query<NodeStatsRow>(
    `
      SELECT
        COUNT(*)::int AS total_nodes,
        COUNT(*) FILTER (WHERE node_type = 'GROUP')::int AS group_nodes,
        COUNT(*) FILTER (WHERE node_type = 'SUBGROUP')::int AS subgroup_nodes
      FROM "SkillTaxonomyNode"
    `,
  );

  const mappingFkStats = await client.query<MappingFkStatsRow>(
    `
      SELECT
        COUNT(*)::int AS total_mappings,
        COUNT(*) FILTER (WHERE taxonomy_group_node_id IS NOT NULL)::int AS with_group_node_id,
        COUNT(*) FILTER (WHERE taxonomy_subgroup_node_id IS NOT NULL)::int AS with_subgroup_node_id,
        COUNT(*) FILTER (
          WHERE taxonomy_group_node_id IS NULL
            OR (
              taxonomy_subgroup IS NOT NULL
              AND btrim(taxonomy_subgroup) <> ''
              AND taxonomy_subgroup_node_id IS NULL
            )
        )::int AS missing_any_node_fk
      FROM "SkillTaxonomyMapping"
    `,
  );

  const samples = await client.query<MappingSampleRow>(
    `
      SELECT
        stm.id::text AS mapping_id,
        s.id::text AS skill_id,
        s.name AS skill_name,
        stm.taxonomy_group,
        stm.taxonomy_subgroup,
        stm.taxonomy_group_node_id::text AS taxonomy_group_node_id,
        stm.taxonomy_subgroup_node_id::text AS taxonomy_subgroup_node_id,
        g.normalized_key AS group_node_key,
        sg.normalized_key AS subgroup_node_key
      FROM "SkillTaxonomyMapping" stm
      JOIN "Skill" s ON s.id = stm.skill_id
      LEFT JOIN "SkillTaxonomyNode" g ON g.id = stm.taxonomy_group_node_id
      LEFT JOIN "SkillTaxonomyNode" sg ON sg.id = stm.taxonomy_subgroup_node_id
      ORDER BY stm.updated_at DESC
      LIMIT 15
    `,
  );

  const node = nodeStats.rows[0] ?? {
    total_nodes: 0,
    group_nodes: 0,
    subgroup_nodes: 0,
  };
  const mapping = mappingFkStats.rows[0] ?? {
    total_mappings: 0,
    with_group_node_id: 0,
    with_subgroup_node_id: 0,
    missing_any_node_fk: 0,
  };

  console.log('\n=== AUDIT (READ-ONLY) ===');
  console.log(`total nodes: ${node.total_nodes}`);
  console.log(`group nodes: ${node.group_nodes}`);
  console.log(`subgroup nodes: ${node.subgroup_nodes}`);
  console.log(`total mappings: ${mapping.total_mappings}`);
  console.log(`mappings with group_node_id: ${mapping.with_group_node_id}`);
  console.log(`mappings with subgroup_node_id: ${mapping.with_subgroup_node_id}`);
  console.log(`mappings missing node FK: ${mapping.missing_any_node_fk}`);

  console.log('\n=== SAMPLE (skill -> taxonomy -> node ids) ===');
  for (const row of samples.rows) {
    const tax = `${row.taxonomy_group} / ${row.taxonomy_subgroup ?? '-'}`;
    console.log(
      `${row.skill_name} [${row.skill_id}] | ${tax} | group_node=${row.taxonomy_group_node_id ?? '-'} (${row.group_node_key ?? '-'}) | subgroup_node=${row.taxonomy_subgroup_node_id ?? '-'} (${row.subgroup_node_key ?? '-'})`,
    );
  }
}

async function main() {
  console.log('=== BACKFILL SKILL TAXONOMY NODES ===');
  console.log(`Mode: ${isDryRun ? 'DRY RUN' : 'APPLY'}`);

  const pool = new Pool({ connectionString: getDatabaseUrl() });
  const client = await pool.connect();

  const stats = {
    insert_group: 0,
    insert_subgroup: 0,
    update_mappings: 0,
    skip: 0,
    warning: 0,
  };

  try {
    const pairs = await getDistinctPairs(client);
    console.log(`Distinct taxonomy pairs: ${pairs.length}`);

    if (!isDryRun) {
      await client.query('BEGIN');
    }

    // Cache group nodes by normalized group key
    const groupCache = new Map<string, { id: string; name: string }>();

    for (const pair of pairs) {
      const groupName = normalizeName(pair.taxonomy_group || '');
      const groupKey = normalizeKey(pair.taxonomy_group || '');

      if (!groupKey) {
        stats.warning += 1;
        console.warn(
          `[WARNING] Empty taxonomy_group after normalize. Raw="${pair.taxonomy_group}" (count=${pair.mapping_count})`,
        );
        continue;
      }

      let groupNode = groupCache.get(groupKey);
      if (!groupNode) {
        const existing = await findExistingNode(client, null, groupKey);
        if (existing) {
          groupNode = { id: existing.id, name: existing.name };
          stats.skip += 1;
          console.log(`[SKIP] GROUP exists: "${existing.name}" (${existing.id})`);
        } else {
          stats.insert_group += 1;
          console.log(
            `[${isDryRun ? 'DRY-RUN INSERT' : 'INSERT'}] GROUP: "${groupName}" key="${groupKey}"`,
          );
          const id = isDryRun
            ? 'DRY_RUN_GROUP_ID'
            : await insertNode(client, {
                name: groupName,
                normalized_key: groupKey,
                parent_id: null,
                level: 0,
                node_type: 'GROUP',
              });
          groupNode = { id, name: groupName };
        }
        groupCache.set(groupKey, groupNode);
      }

      const rawSub = pair.taxonomy_subgroup ?? '';
      const subName = normalizeName(rawSub);
      const subKey = normalizeKey(rawSub);

      let subgroupNodeId: string | null = null;
      if (subKey) {
        const existingSub = await findExistingNode(client, isDryRun ? null : groupNode.id, subKey);
        if (existingSub) {
          subgroupNodeId = existingSub.id;
          stats.skip += 1;
          console.log(
            `[SKIP] SUBGROUP exists: "${existingSub.name}" (${existingSub.id}) under "${groupNode.name}"`,
          );
        } else {
          stats.insert_subgroup += 1;
          console.log(
            `[${isDryRun ? 'DRY-RUN INSERT' : 'INSERT'}] SUBGROUP: "${subName}" key="${subKey}" parent_group="${groupNode.name}"`,
          );
          subgroupNodeId = isDryRun
            ? 'DRY_RUN_SUBGROUP_ID'
            : await insertNode(client, {
                name: subName,
                normalized_key: subKey,
                parent_id: groupNode.id,
                level: 1,
                node_type: 'SUBGROUP',
              });
        }
      }

      if (isDryRun) {
        // We don't know real IDs in dry-run; just report intended update.
        console.log(
          `[DRY-RUN UPDATE] mappings where group="${pair.taxonomy_group}" subgroup="${pair.taxonomy_subgroup ?? ''}" -> group_node_id=${groupNode.id}, subgroup_node_id=${subgroupNodeId ?? '-'}`,
        );
        continue;
      }

      const updated = await updateMappingsForPair(
        client,
        { taxonomy_group: pair.taxonomy_group, taxonomy_subgroup: pair.taxonomy_subgroup },
        groupNode.id,
        subgroupNodeId,
      );

      if (updated) {
        stats.update_mappings += updated;
        console.log(
          `[UPDATE] mappings updated=${updated} for ${pair.taxonomy_group} / ${pair.taxonomy_subgroup ?? '-'}`,
        );
      } else {
        stats.skip += 1;
        console.log(
          `[SKIP] mappings already up to date for ${pair.taxonomy_group} / ${pair.taxonomy_subgroup ?? '-'}`,
        );
      }
    }

    if (!isDryRun) {
      await client.query('COMMIT');
    }

    console.log('\n=== BACKFILL SUMMARY ===');
    console.log(`insert_group: ${stats.insert_group}`);
    console.log(`insert_subgroup: ${stats.insert_subgroup}`);
    console.log(`update_mappings (rows): ${stats.update_mappings}`);
    console.log(`skip: ${stats.skip}`);
    console.log(`warning: ${stats.warning}`);

    await audit(client);

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

