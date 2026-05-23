import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

type RecruitmentSkillRow = {
  recruitment_id: string;
  skill_id: string;
  level: number | null;
  is_required: boolean;
};

type RecruitmentInfoRow = {
  id: string;
  recruitment_code: string | null;
  department_id: string | null;
  work_location_id: string | null;
  contactPerson: {
    company_id: string | null;
  } | null;
  positionPost: {
    unit_id: string | null;
  } | null;
};

const url = (process.env.DATABASE_URL || '').trim();

if (!url) {
  throw new Error('DATABASE_URL is missing');
}

const pool = new Pool({
  connectionString: url,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
});

function getCompanyIdForRecruitment(row: RecruitmentInfoRow | undefined): string | null {
  if (!row) return null;

  /**
   * Theo schema hiện tại:
   * - contactPerson.company_id -> InforCompany.id
   * - positionPost.unit_id -> InforCompany.id
   * - department_id -> InforCompany.id qua relation DepartmentCompany
   * - work_location_id -> InforCompany.id qua relation WorkLocationCompany
   *
   * Job cũ của project có vẻ không có contactPerson.company_id,
   * nên cần fallback sang positionPost.unit_id / department_id / work_location_id.
   */
  return (
    row.contactPerson?.company_id ||
    row.positionPost?.unit_id ||
    row.department_id ||
    row.work_location_id ||
    null
  );
}

async function main() {
  console.log('Starting CompanySkill backfill from RecruitmentSkill...');

  const recruitmentSkills = (await prisma.recruitmentSkill.findMany({
    select: {
      recruitment_id: true,
      skill_id: true,
      level: true,
      is_required: true,
    },
  })) as RecruitmentSkillRow[];

  const recruitmentIds = Array.from(
    new Set(
      recruitmentSkills
        .map((item) => item.recruitment_id)
        .filter(Boolean),
    ),
  );

  const recruitments = (await prisma.recruitment_Infor.findMany({
    where: {
      id: {
        in: recruitmentIds,
      },
    },
    select: {
      id: true,
      recruitment_code: true,
      department_id: true,
      work_location_id: true,
      contactPerson: {
        select: {
          company_id: true,
        },
      },
      positionPost: {
        select: {
          unit_id: true,
        },
      },
    },
  })) as RecruitmentInfoRow[];

  const recruitmentMap = new Map<string, RecruitmentInfoRow>();

  for (const recruitment of recruitments) {
    recruitmentMap.set(recruitment.id, recruitment);
  }

  let skipped = 0;
  let upserted = 0;

  const pairs = new Map<string, { company_id: string; skill_id: string }>();

  for (const item of recruitmentSkills) {
    const skillId = item.skill_id?.trim() || null;
    const recruitment = recruitmentMap.get(item.recruitment_id);
    const companyId = getCompanyIdForRecruitment(recruitment);

    if (!skillId || !companyId) {
      skipped += 1;

      console.warn('Skipped RecruitmentSkill due to missing company_id or skill_id', {
        recruitmentId: item.recruitment_id,
        recruitmentCode: recruitment?.recruitment_code ?? null,
        skillId,
        companyId,
        debugCompanySources: recruitment
          ? {
              contactPersonCompanyId: recruitment.contactPerson?.company_id ?? null,
              positionPostUnitId: recruitment.positionPost?.unit_id ?? null,
              departmentId: recruitment.department_id,
              workLocationId: recruitment.work_location_id,
            }
          : null,
      });

      continue;
    }

    pairs.set(`${companyId}:${skillId}`, {
      company_id: companyId,
      skill_id: skillId,
    });
  }

  console.log('Prepared unique company skill pairs', {
    totalRecruitmentSkills: recruitmentSkills.length,
    totalRecruitments: recruitments.length,
    uniquePairs: pairs.size,
    skipped,
  });

  for (const pair of pairs.values()) {
    await prisma.companySkill.upsert({
      where: {
        company_id_skill_id: {
          company_id: pair.company_id,
          skill_id: pair.skill_id,
        },
      },
      update: {
        is_active: true,
        updated_at: new Date(),
      },
      create: {
        company_id: pair.company_id,
        skill_id: pair.skill_id,
        is_active: true,
        source: 'BACKFILL_JOB_REQUIREMENT',
      },
    });

    upserted += 1;
  }

  console.log('CompanySkill backfill completed', {
    totalRecruitmentSkills: recruitmentSkills.length,
    totalRecruitments: recruitments.length,
    uniquePairs: pairs.size,
    skipped,
    upserted,
  });
}

main()
  .catch((error) => {
    console.error('CompanySkill backfill failed');
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });