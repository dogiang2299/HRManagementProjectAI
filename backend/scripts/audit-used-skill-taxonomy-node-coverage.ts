import 'dotenv/config';
import { PrismaService } from '../src/prisma.service';

type CoverageRow = {
  total_distinct_used_skills: number;
  used_with_any_mapping: number;
  used_missing_mapping: number;
  used_with_group_node_id: number;
  used_with_subgroup_node_id: number;
  used_missing_group_node_id: number;
  used_missing_subgroup_node_id: number;
};

type MissingNodeRow = {
  skill_id: string;
  skill_name: string;
  taxonomy_group: string | null;
  taxonomy_subgroup: string | null;
  taxonomy_group_node_id: string | null;
  taxonomy_subgroup_node_id: string | null;
};

async function main() {
  const prisma = new PrismaService();
  await prisma.$connect();

  try {
    const coverageRows = await prisma.$queryRaw<CoverageRow[]>`
      WITH used AS (
        SELECT skill_id
        FROM "CandidateSkill"
        UNION
        SELECT skill_id
        FROM "RecruitmentSkill"
        UNION
        SELECT unnest(COALESCE(detected_skill_ids, '{}'::uuid[])) AS skill_id
        FROM "CandidateAIProfile"
        UNION
        SELECT unnest(COALESCE(detected_skill_ids, '{}'::uuid[])) AS skill_id
        FROM "JobAIProfile"
      ),
      used_distinct AS (
        SELECT DISTINCT skill_id
        FROM used
        WHERE skill_id IS NOT NULL
      ),
      mapping_one AS (
        SELECT DISTINCT ON (skill_id)
          skill_id,
          taxonomy_group,
          taxonomy_subgroup,
          taxonomy_group_node_id,
          taxonomy_subgroup_node_id
        FROM "SkillTaxonomyMapping"
        ORDER BY skill_id, updated_at DESC NULLS LAST, created_at DESC NULLS LAST
      )
      SELECT
        (SELECT COUNT(*) FROM used_distinct)::int AS total_distinct_used_skills,
        (SELECT COUNT(*) FROM used_distinct u JOIN mapping_one m ON m.skill_id = u.skill_id)::int AS used_with_any_mapping,
        (SELECT COUNT(*) FROM used_distinct u LEFT JOIN mapping_one m ON m.skill_id = u.skill_id WHERE m.skill_id IS NULL)::int AS used_missing_mapping,
        (SELECT COUNT(*) FROM used_distinct u JOIN mapping_one m ON m.skill_id = u.skill_id WHERE m.taxonomy_group_node_id IS NOT NULL)::int AS used_with_group_node_id,
        (SELECT COUNT(*) FROM used_distinct u JOIN mapping_one m ON m.skill_id = u.skill_id WHERE m.taxonomy_subgroup_node_id IS NOT NULL)::int AS used_with_subgroup_node_id,
        (SELECT COUNT(*) FROM used_distinct u JOIN mapping_one m ON m.skill_id = u.skill_id WHERE m.taxonomy_group_node_id IS NULL)::int AS used_missing_group_node_id,
        (SELECT COUNT(*) FROM used_distinct u JOIN mapping_one m ON m.skill_id = u.skill_id WHERE m.taxonomy_subgroup_node_id IS NULL)::int AS used_missing_subgroup_node_id
      ;
    `;

    const coverage = coverageRows[0];
    if (!coverage) {
      console.log('No data returned from audit query.');
      return;
    }

    console.log('=== USED SKILL TAXONOMY NODE COVERAGE (READ-ONLY) ===');
    console.log(`total distinct used skills: ${coverage.total_distinct_used_skills}`);
    console.log(`used skills with SkillTaxonomyMapping: ${coverage.used_with_any_mapping}`);
    console.log(`used skills missing SkillTaxonomyMapping: ${coverage.used_missing_mapping}`);
    console.log(`used skills with taxonomy_group_node_id: ${coverage.used_with_group_node_id}`);
    console.log(`used skills with taxonomy_subgroup_node_id: ${coverage.used_with_subgroup_node_id}`);
    console.log(`used skills missing taxonomy_group_node_id: ${coverage.used_missing_group_node_id}`);
    console.log(`used skills missing taxonomy_subgroup_node_id: ${coverage.used_missing_subgroup_node_id}`);

    if (coverage.used_missing_mapping > 0 || coverage.used_missing_group_node_id > 0) {
      const missing = await prisma.$queryRaw<MissingNodeRow[]>`
        WITH used AS (
          SELECT skill_id
          FROM "CandidateSkill"
          UNION
          SELECT skill_id
          FROM "RecruitmentSkill"
          UNION
          SELECT unnest(COALESCE(detected_skill_ids, '{}'::uuid[])) AS skill_id
          FROM "CandidateAIProfile"
          UNION
          SELECT unnest(COALESCE(detected_skill_ids, '{}'::uuid[])) AS skill_id
          FROM "JobAIProfile"
        ),
        used_distinct AS (
          SELECT DISTINCT skill_id
          FROM used
          WHERE skill_id IS NOT NULL
        ),
        mapping_one AS (
          SELECT DISTINCT ON (skill_id)
            skill_id,
            taxonomy_group,
            taxonomy_subgroup,
            taxonomy_group_node_id,
            taxonomy_subgroup_node_id
          FROM "SkillTaxonomyMapping"
          ORDER BY skill_id, updated_at DESC NULLS LAST, created_at DESC NULLS LAST
        )
        SELECT
          s.id::text AS skill_id,
          s.name AS skill_name,
          m.taxonomy_group,
          m.taxonomy_subgroup,
          m.taxonomy_group_node_id::text AS taxonomy_group_node_id,
          m.taxonomy_subgroup_node_id::text AS taxonomy_subgroup_node_id
        FROM used_distinct u
        LEFT JOIN mapping_one m
          ON m.skill_id = u.skill_id
        JOIN "Skill" s
          ON s.id = u.skill_id
        WHERE m.skill_id IS NULL OR m.taxonomy_group_node_id IS NULL
        ORDER BY s.name ASC
        LIMIT 200
      `;

      console.log('\n=== SAMPLE SKILLS MISSING MAPPING OR NODE ID (up to 200) ===');
      for (const row of missing) {
        const textPath =
          row.taxonomy_group || row.taxonomy_subgroup
            ? `${row.taxonomy_group ?? ''} / ${row.taxonomy_subgroup ?? ''}`.trim()
            : '(no text taxonomy)';
        console.log(
          `- ${row.skill_name} [${row.skill_id}] | text="${textPath}" | group_node_id=${row.taxonomy_group_node_id ?? '-'} | subgroup_node_id=${row.taxonomy_subgroup_node_id ?? '-'}`,
        );
      }
    } else {
      console.log('\nNo used skills missing mapping or taxonomy_group_node_id.');
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('Audit failed:', error?.message || error);
  process.exitCode = 1;
});

