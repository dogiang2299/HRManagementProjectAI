import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { buildRecommendationMatchDetail } from './recommend-match-detail.builder';

const MIN_RECOMMENDATION_SCORE = 0.45;

type ActorLike = {
  actorEmployeeId?: string;
  actorRole?: string;
  roles?: string[];
  company_id?: string | null;
  actorType?: 'Employee' | 'System';
  id?: string;
  sub?: string;
  email?: string;
};

@Injectable()
export class RecommendationService {
  constructor(private readonly prisma: PrismaService) {}
  private async getSkillNameMap(skillIds: string[]) {
    const uniqueIds = [...new Set(skillIds.filter(Boolean).map(String))];

    if (!uniqueIds.length) {
      return new Map<string, string>();
    }

    const quotedIds = uniqueIds.map((id) => `'${id}'`).join(',');

    const rows = await this.prisma.$queryRawUnsafe<any[]>(`
    SELECT id, name
    FROM "Skill"
    WHERE id IN (${quotedIds})
  `);

    return new Map<string, string>(
      rows.map((row) => [String(row.id), String(row.name)]),
    );
  }
  async getStoredRecommendationsForCurrentCandidate(
    actor: ActorLike,
    options: { page?: number; limit?: number; search?: string } = {},
  ) {
    const requestedPage =
      Number.isFinite(options.page) && (options.page ?? 0) > 0
        ? Math.floor(options.page as number)
        : 1;

    const limit =
      Number.isFinite(options.limit) && (options.limit ?? 0) > 0
        ? Math.min(Math.floor(options.limit as number), 50)
        : 9;

    const employeeId = actor?.actorEmployeeId || actor?.id || actor?.sub;

    if (!employeeId) {
      throw new ForbiddenException('Không xác định được người dùng hiện tại');
    }

    if (actor?.actorType && actor.actorType !== 'Employee') {
      throw new ForbiddenException('Không xác định được người dùng hiện tại');
    }

    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!employee) {
      throw new NotFoundException('Không tìm thấy tài khoản đăng nhập');
    }

    const roleNames =
      employee.roles?.map((r) => r.role?.name_role).filter(Boolean) ?? [];

    const isCandidate = roleNames.includes('Candidate');

    if (!isCandidate) {
      throw new ForbiddenException('Tài khoản hiện tại không phải ứng viên');
    }

    const candidate = await this.prisma.candidate.findFirst({
      where: {
        is_active: true,
        OR: [
          employee.email_account
            ? { email: employee.email_account }
            : undefined,
          employee.phone_account
            ? { phone_number: employee.phone_account }
            : undefined,
        ].filter(Boolean) as any,
      },
      select: {
        id: true,
        candidate_code: true,
        candidate_name: true,
        desired_position_id: true,
        preferred_job_type: true,
      },
    });

    // If candidate not found, return empty recommendations instead of throwing error
    if (!candidate) {
      return {
        candidate: {
          id: employeeId,
          candidate_code: null,
          candidate_name: employee.employee_name || employee.email_account || employee.phone_account,
          desired_position_id: null,
          preferred_job_type: null,
        },
        recommendation_status: 'EMPTY',
        total_jobs_scored: 0,
        pagination: {
          totalItems: 0,
          totalPages: 1,
          currentPage: requestedPage,
          limit,
        },
        items: [],
      };
    }

    const result = await this.getStoredRecommendationsForCandidate(
      candidate.id,
      requestedPage,
      limit,
      { search: options.search },
    );

    return {
      candidate: {
        id: candidate.id,
        candidate_code: candidate.candidate_code,
        candidate_name: candidate.candidate_name,
        desired_position_id: candidate.desired_position_id,
        preferred_job_type: candidate.preferred_job_type,
      },
      ...result,
    };
  }
  async getStoredRecommendationsForCandidate(
    candidateId: string,
    page = 1,
    limit = 9,
    options: { search?: string } = {},
  ) {
    const safePage = Math.max(Number(page) || 1, 1);
    const safeLimit = Math.max(Number(limit) || 9, 1);
    const offset = (safePage - 1) * safeLimit;
    const search = options.search?.trim().slice(0, 100) || '';
    const queryParams: unknown[] = [candidateId];
    const searchClause = search
      ? `
      AND (
        r.post_title ILIKE $2
        OR r.internal_title ILIKE $2
        OR p.name_post ILIKE $2
        OR g.name_group ILIKE $2
        OR d.full_name ILIKE $2
      )`
      : '';

    if (search) {
      queryParams.push(`%${search}%`);
    }

    const relevantRecommendationClause = `
      AND COALESCE(rec.final_score, 0) >= ${MIN_RECOMMENDATION_SCORE}
      AND (
        COALESCE(array_length(rec.matched_skill_ids, 1), 0) > 0
        OR COALESCE(rec.position_score, 0) > 0
        OR COALESCE(rec.skill_overlap_score, 0) >= 0.15
      )
    `;

    const items = await this.prisma.$queryRawUnsafe<any[]>(`
    SELECT
      rec.id,
      rec.candidate_id,
      rec.recruitment_infor_id,
      rec.skill_overlap_score,
      rec.group_similarity_score,
      rec.dominant_group_score,
      rec.baseline_score,
      rec.semantic_score,
      rec.hybrid_score,
      rec.final_score,
      rec.matched_skill_ids,
      rec.missing_skill_ids,
      rec.reason_texts,
      rec.pipeline_version,
      rec.model_name,
      rec.calculated_at,
      rec.experience_score,
      rec.position_score,
      rec.rank_score,
      rec.job_type_score,
      rec.location_score,
      r.id AS job_id,
      r.post_title,
      r.internal_title,
      r.position_post_id,
      r.rank_id,
      r.type_of_job,
      r.application_deadline,
      r.salary_from,
      r.salary_to,
      r.salary_currency,
      r.is_salary_negotiable,
      r.department_id,
      r.work_location_id,
      r.experience_type,
      r.experience_min,
      r.experience_max,
      r.experience_label,
      r.status,
      r.is_active,

      p.name_post,
      p.description_post,
      p.requirements_post,
      p.benefits_post,
      g.name_group,
      rk.name_rank,
      d.full_name AS company_name,
      d.image_logo AS company_logo,
      d.address AS company_address,
      d.short_address AS company_short_address,
      wl.full_name AS work_location_name,
      wl.address AS work_location_address,
      wl.short_address AS work_location_short_address,
      wl.map_link AS work_location_map_link

    FROM "CandidateJobRecommendation" rec
    JOIN "Recruitment_Infor" r
      ON r.id = rec.recruitment_infor_id
    LEFT JOIN "Setting_Position_Posts" p
      ON p.id = r.position_post_id
    LEFT JOIN "Position_Group" g
      ON g.id = p.group_id
    LEFT JOIN "Rank" rk
      ON rk.id = r.rank_id
    LEFT JOIN "InforCompany" d
      ON d.id = r.department_id
    LEFT JOIN "InforCompany" wl
      ON wl.id = r.work_location_id
    WHERE rec.candidate_id = $1
      AND r.is_active = true
      AND r.status = 'PUBLIC'
      ${relevantRecommendationClause}
      ${searchClause}
    ORDER BY rec.final_score DESC
    LIMIT ${safeLimit}
    OFFSET ${offset}
  `, ...queryParams);

    const countResult = await this.prisma.$queryRawUnsafe<any[]>(`
    SELECT COUNT(*)::int AS total
    FROM "CandidateJobRecommendation" rec
    JOIN "Recruitment_Infor" r
      ON r.id = rec.recruitment_infor_id
    LEFT JOIN "Setting_Position_Posts" p
      ON p.id = r.position_post_id
    LEFT JOIN "Position_Group" g
      ON g.id = p.group_id
    LEFT JOIN "InforCompany" d
      ON d.id = r.department_id
    WHERE rec.candidate_id = $1
      AND r.is_active = true
      AND r.status = 'PUBLIC'
      ${relevantRecommendationClause}
      ${searchClause}
  `, ...queryParams);
    const allSkillIds = items.flatMap((row) => [
      ...(row.matched_skill_ids ?? []),
      ...(row.missing_skill_ids ?? []),
    ]);

    const skillNameMap = await this.getSkillNameMap(allSkillIds);
    const total = countResult[0]?.total ?? 0;

    return {
      recommendation_status: total > 0 ? 'READY' : 'EMPTY',
      total_jobs_scored: total,
      pagination: {
        totalItems: total,
        totalPages: total > 0 ? Math.ceil(total / safeLimit) : 1,
        currentPage: safePage,
        limit: safeLimit,
      },
      items: items.map((row) => {
        const finalScore = Number(row.final_score ?? 0);
        const skillOverlapScore = Number(row.skill_overlap_score ?? 0);
        const matchDetail = buildRecommendationMatchDetail(row, skillNameMap);

        return {
          recruitment_id: row.recruitment_infor_id,
          recruitment_code: null,
          internal_title: row.internal_title,
          post_title: row.post_title,

          company_name: row.company_name,
          company_logo: row.company_logo,
          company_address: row.company_address,
          company_short_address: row.company_short_address,

          work_location: row.work_location_id
            ? {
                id: row.work_location_id,
                name: row.work_location_name,
                full_name: row.work_location_name,
                address: row.work_location_address,
                short_address: row.work_location_short_address,
                map_link: row.work_location_map_link,
              }
            : null,

          position_name: row.name_post,
          group_name: row.name_group,
          rank_name: row.name_rank,

          type_of_job: row.type_of_job,
          application_deadline: row.application_deadline,
          salary_from: row.salary_from,
          salary_to: row.salary_to,
          salary_currency: row.salary_currency,
          is_salary_negotiable: row.is_salary_negotiable,
          experience_type: row.experience_type,
          experience_min: row.experience_min,
          experience_max: row.experience_max,
          experience_label: row.experience_label,

          score_breakdown: {
            skillOverlapScore,
            groupSimilarityScore: Number(row.group_similarity_score ?? 0),
            dominantGroupScore: Number(row.dominant_group_score ?? 0),
            baselineScore: Number(row.baseline_score ?? 0),
            semanticScore: Number(row.semantic_score ?? 0),
            hybridScore: Number(row.hybrid_score ?? 0),
            experienceScore: Number(row.experience_score ?? 0),
            positionScore: Number(row.position_score ?? 0),
            rankScore: Number(row.rank_score ?? 0),
            jobTypeScore: Number(row.job_type_score ?? 0),
            locationScore: Number(row.location_score ?? 0),
            finalScore,
          },

          match_detail: matchDetail,

          matched_skill_ids: row.matched_skill_ids ?? [],
          missing_skill_ids: row.missing_skill_ids ?? [],

          matched_skills: matchDetail.skillAnalysis.matchedSkills,
          missing_skills: matchDetail.skillAnalysis.missingSkills,

          reason_texts: row.reason_texts ?? [],

          pipeline_version: row.pipeline_version,
          model_name: row.model_name,
          calculated_at: row.calculated_at,

          description: row.description_post,
          requirements: row.requirements_post,
          benefits: row.benefits_post,
        };
      }),
    };
  }
}
