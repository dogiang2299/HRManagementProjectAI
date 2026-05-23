import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Candidate } from '@prisma/client';
import { generateCode } from 'src/common/utils/generate-code.util';
import { PrismaService } from 'src/prisma.service';
import {
  AuditLogService,
  type CandidateAuditActor,
} from '../audit_log/audit_log.service';
import { CreateCandidateDto } from './dto/create';
import { CandidateFilterType } from './dto/filter_type';
import { CandidatePaginType } from './dto/pagin_type';
import type { CandidateApplicationsSummary } from './dto/pagin_type';
import { PotentialCandidateFilterType } from './dto/potential_filter_type';
import { UpdateCandidateDto } from './dto/update';
import * as path from 'path';
import * as fs from 'fs';
import {
  CANDIDATE_CV_SOURCE_TYPE,
  CANDIDATE_CV_STATUS,
} from 'src/modules/candidate-cv/constants/candidate-cv.constant';
import { UpdateCandidateCareerPreferencesDto } from './dto/update_career_preferences';
import { UpdateCandidateBasicInfoDto } from './dto/update_basic_info';
import { RecommendationEngineService } from '../recommend/recommendation-engine.service';

const RANK_ORDER = [
  'Intern',
  'Fresher',
  'Junior',
  'Junior+',
  'Middle',
  'Mid-Level',
  'Senior',
  'Senior+',
  'Lead',
  'Technical Lead',
  'Staff Engineer',
  'Principal',
  'Architect',
  'Expert',
  'Manager',
];

@Injectable()
export class CandidateService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
    private readonly recommendationEngineService: RecommendationEngineService,
  ) {}

  private getActorRoles(actor?: any): string[] {
    if (!actor) return [];
    if (Array.isArray(actor.roles)) {
      return actor.roles.filter(
        (r: unknown) => typeof r === 'string',
      ) as string[];
    }
    if (typeof actor.actorRole === 'string') {
      return [actor.actorRole];
    }
    return [];
  }

  private getEmployerCompanyId(actor?: any): string | null {
    const roles = this.getActorRoles(actor).map((r) => r.toLowerCase());
    const isEmployer = roles.includes('employer');
    if (!isEmployer) return null;

    if (!actor?.company_id) {
      throw new ForbiddenException('No company_id for employer');
    }

    return actor.company_id;
  }

  private assertCanMutateCandidate(actor?: any) {
    const roles = this.getActorRoles(actor).map((r) => r.toLowerCase());
    const canMutate =
      roles.includes('admin') ||
      roles.includes('employee') ||
      roles.includes('candidate');

    if (!canMutate) {
      throw new ForbiddenException('No permission to modify candidate');
    }
  }

  private readonly ALLOWED_JOB_TYPES = [
    'full-time',
    'part-time',
    'remote',
    'hybrid',
    'internship',
  ];

  private mapSkillMatch(row: any, skillNameMap: Map<string, string>) {
    const matchedSkillIds = Array.isArray(row?.matched_skill_ids)
      ? row.matched_skill_ids
      : [];

    const missingSkillIds = Array.isArray(row?.missing_skill_ids)
      ? row.missing_skill_ids
      : [];

    const toSkillNames = (ids: string[]) =>
      ids
        .map((id) => skillNameMap.get(String(id)) ?? String(id))
        .filter((name, index, array) => array.indexOf(name) === index);

    const toNumber = (value: any) => Number(value ?? 0);

    return {
      final_score: toNumber(row?.final_score),

      skill_overlap_score: toNumber(row?.skill_overlap_score),
      group_similarity_score: toNumber(row?.group_similarity_score),
      dominant_group_score: toNumber(row?.dominant_group_score),
      baseline_score: toNumber(row?.baseline_score),
      semantic_score: toNumber(row?.semantic_score),
      hybrid_score: toNumber(row?.hybrid_score),

      experience_score: toNumber(row?.experience_score),
      position_score: toNumber(row?.position_score),
      rank_score: toNumber(row?.rank_score),
      job_type_score: toNumber(row?.job_type_score),
      location_score: toNumber(row?.location_score),

      matched_skill_ids: matchedSkillIds,
      missing_skill_ids: missingSkillIds,
      matched_skills: toSkillNames(matchedSkillIds),
      missing_skills: toSkillNames(missingSkillIds),

      reason_texts: row?.reason_texts ?? [],
      calculated_at: row?.calculated_at ?? null,
      pipeline_version: row?.pipeline_version ?? null,
      model_name: row?.model_name ?? null,

      score_breakdown: {
        final: toNumber(row?.final_score),
        skills: toNumber(row?.skill_overlap_score),
        position: toNumber(row?.position_score),
        experience: toNumber(row?.experience_score),
        semantic: toNumber(row?.semantic_score),
        job_type: toNumber(row?.job_type_score),
        location: toNumber(row?.location_score),
        rank: toNumber(row?.rank_score),
        taxonomy_group: toNumber(row?.group_similarity_score),
        dominant_group: toNumber(row?.dominant_group_score),
        baseline: toNumber(row?.baseline_score),
        hybrid: toNumber(row?.hybrid_score),
      },
    };
  }
  async updateCareerPreferencesByEmployee(
    employeeId: string,
    dto?: UpdateCandidateCareerPreferencesDto,
  ) {
    const payload = dto ?? {};
    const candidate = await this.getMyProfileByEmployee(employeeId);

    const data: any = {
      updated_at: new Date(),
    };

    if (Object.prototype.hasOwnProperty.call(payload, 'desired_position_id')) {
      data.desired_position_id = payload.desired_position_id || null;
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'desired_rank_id')) {
      data.desired_rank_id = payload.desired_rank_id || null;
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'preferred_job_type')) {
      data.preferred_job_type = payload.preferred_job_type
        ? String(payload.preferred_job_type).trim().toLowerCase()
        : null;
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'provice')) {
      data.provice = payload.provice ? String(payload.provice).trim() : null;
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'district')) {
      data.district = payload.district
        ? String(payload.district).trim()
        : null;
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'address')) {
      data.address = payload.address ? String(payload.address).trim() : null;
    }

    const updated = await this.prisma.candidate.update({
      where: { id: candidate.id },
      data,
      select: {
        id: true,
        candidate_name: true,
        address: true,
        provice: true,
        district: true,
        desired_position_id: true,
        desired_rank_id: true,
        preferred_job_type: true,
        desiredRank: {
          select: {
            id: true,
            name_rank: true,
          },
        },
      },
    });

    let recommendationResult: any = null;
    let recommendationError: string | null = null;

    try {
      recommendationResult =
        await this.recommendationEngineService.rebuildCandidateRecommendation(
          candidate.id,
        );
    } catch (error: any) {
      recommendationError = error?.message || String(error);
      console.error(
        '[RecommendationEngine] Failed to rebuild candidate recommendation after preference update:',
        recommendationError,
      );
    }

    return {
      ...updated,
      recommendation_result: recommendationResult,
      recommendation_error: recommendationError,
    };
  }

  private normalizeRankName(name: string): string {
    return name.trim().toLowerCase().replace(/\s+/g, ' ');
  }

  private getRankSortIndex(name: string): number {
    const normalized = this.normalizeRankName(name);
    const index = RANK_ORDER.findIndex(
      (item) => this.normalizeRankName(item) === normalized,
    );

    return index === -1 ? 999 : index;
  }

  private dedupeRanksByName(
    ranks: Array<{ id: string; name_rank: string | null }>,
  ) {
    const seen = new Set<string>();

    return ranks
      .filter((rank): rank is { id: string; name_rank: string } =>
        Boolean(rank.name_rank?.trim()),
      )
      .sort((a, b) => {
        const orderDiff =
          this.getRankSortIndex(a.name_rank) -
          this.getRankSortIndex(b.name_rank);

        if (orderDiff !== 0) {
          return orderDiff;
        }

        return a.name_rank.trim().localeCompare(b.name_rank.trim(), 'en', {
          sensitivity: 'base',
        });
      })
      .filter((rank) => {
        const key = this.normalizeRankName(rank.name_rank);
        if (seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      })
      .map((rank) => {
        return {
          id: rank.id,
          name: rank.name_rank.trim(),
        };
      });
  }

  async getCareerOptions() {
    const positions = await this.prisma.setting_Position_Posts.findMany({
      where: { is_active: true },
      select: { id: true, name_post: true },
      orderBy: { name_post: 'asc' },
    });

    const ranks = await this.prisma.rank.findMany({
      where: { is_active: true },
      select: { id: true, name_rank: true },
      orderBy: { name_rank: 'asc' },
    });

    return {
      positions: positions.map((p) => ({ id: p.id, name: p.name_post })),
      ranks: this.dedupeRanksByName(ranks),
      jobTypes: this.ALLOWED_JOB_TYPES,
    };
  }

  private getCandidateCompanyScopeCondition(companyId: string) {
    return {
      statusApplication: {
        some: {
          recruitment_infor: {
            OR: [
              { department_id: companyId },
              { work_location_id: companyId },
              { positionPost: { is: { unit_id: companyId } } },
              { contactPerson: { is: { company_id: companyId } } },
            ],
          },
        },
      },
    };
  }

  private addEmployerScope(where: any, actor?: any) {
    const companyId = this.getEmployerCompanyId(actor);
    if (!companyId) return;

    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : []),
      this.getCandidateCompanyScopeCondition(companyId),
    ];
  }

  private normalizeSummaryKey(value: unknown) {
    if (value === null || value === undefined) return '';
    return String(value).trim().toLowerCase();
  }

  private async buildApplicationsSummaryMap(
    candidateIds: string[],
    actor?: any,
  ) {
    const summaryMap = new Map<string, CandidateApplicationsSummary>();

    if (!candidateIds.length) {
      return summaryMap;
    }

    const where: any = {
      candidate_id: {
        in: candidateIds,
      },
    };

    // For application-level queries we must filter by recruitment_infor
    // (Application has recruitment_infor relation). Do not use the
    // candidate-scoped helper here because that returns
    // `statusApplication: { some: { recruitment_infor: ... } }` which
    // is invalid for Application.where.
    const companyId = this.getEmployerCompanyId(actor);
    if (companyId) {
      where.AND = [
        ...(Array.isArray(where.AND) ? where.AND : []),
        {
          recruitment_infor: {
            OR: [
              { department_id: companyId },
              { work_location_id: companyId },
              { positionPost: { is: { unit_id: companyId } } },
              { contactPerson: { is: { company_id: companyId } } },
            ],
          },
        },
      ];
    }

    const applicationRows = await this.prisma.application.findMany({
      where,
      select: {
        candidate_id: true,
        recruitment_infor_id: true,
        recruitment_infor: {
          select: {
            id: true,
            post_title: true,
            internal_title: true,
            recruitment_code: true,
            position_post_id: true,
            positionPost: {
              select: {
                id: true,
                name_post: true,
                unit_id: true,
              },
            },
            department_id: true,
            work_location_id: true,
            contactPerson: {
              select: {
                company_id: true,
              },
            },
          },
        },
      },
    });

    const aggregateMap = new Map<
      string,
      {
        total_applications: number;
        distinct_positions: Set<string>;
        distinct_job_posts: Set<string>;
        distinct_companies: Set<string>;
      }
    >();

    for (const row of applicationRows) {
      const candidateId = row.candidate_id;
      if (!candidateId) continue;

      const current = aggregateMap.get(candidateId) ?? {
        total_applications: 0,
        distinct_positions: new Set<string>(),
        distinct_job_posts: new Set<string>(),
        distinct_companies: new Set<string>(),
      };

      current.total_applications += 1;

      const ri = row.recruitment_infor;
      if (ri) {
        const positionKey =
          ri.positionPost?.name_post ??
          ri.positionPost?.id ??
          ri.position_post_id ??
          null;
        if (positionKey) {
          current.distinct_positions.add(this.normalizeSummaryKey(positionKey));
        }

        const jobPostKey =
          ri.id ??
          ri.post_title ??
          ri.internal_title ??
          ri.recruitment_code ??
          row.recruitment_infor_id ??
          null;
        if (jobPostKey) {
          current.distinct_job_posts.add(this.normalizeSummaryKey(jobPostKey));
        }

        const companyKey =
          ri.department_id ??
          ri.work_location_id ??
          ri.positionPost?.unit_id ??
          ri.contactPerson?.company_id ??
          null;
        if (companyKey) {
          current.distinct_companies.add(this.normalizeSummaryKey(companyKey));
        }
      }

      aggregateMap.set(candidateId, current);
    }

    for (const [candidateId, aggregate] of aggregateMap.entries()) {
      summaryMap.set(candidateId, {
        total_applications: aggregate.total_applications,
        distinct_positions: aggregate.distinct_positions.size,
        distinct_job_posts: aggregate.distinct_job_posts.size,
        distinct_companies: aggregate.distinct_companies.size,
      });
    }

    return summaryMap;
  }

  private async validatePotentialType(potentialTypeId: string) {
    const potentialType = await this.prisma.setting_Potential_Type.findFirst({
      where: {
        id: potentialTypeId,
        is_active: true,
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (!potentialType) {
      throw new BadRequestException('Potential type is invalid or inactive');
    }

    return potentialType;
  }

  private async getNextCandidateCode() {
    // Fetch all candidates with non-null candidate_code
    const allCandidates = await this.prisma.candidate.findMany({
      where: { candidate_code: { not: null } },
      select: { candidate_code: true },
    });

    // Parse all numeric suffixes and find max
    let maxNumber = 0;
    for (const row of allCandidates) {
      if (!row.candidate_code) continue;
      const match = row.candidate_code.match(/(\d+)$/);
      if (match) {
        maxNumber = Math.max(maxNumber, Number(match[1]));
      }
    }

    // Generate new code with increment
    let nextNumber = maxNumber + 1;

    // Retry loop to handle race conditions (max 3 attempts)
    for (let attempt = 0; attempt < 3; attempt++) {
      const code = `CA_${String(nextNumber).padStart(4, '0')}`;

      // Check if code already exists
      const existed = await this.prisma.candidate.findUnique({
        where: { candidate_code: code },
        select: { id: true },
      });

      if (!existed) {
        return code;
      }

      // Code exists, try next number
      nextNumber += 1;
    }

    // Fallback: use timestamp-based code if retries exhausted
    const timestamp = Date.now();
    return `CA_${timestamp}`;
  }

  async getMyProfileByEmployee(employeeId: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      select: {
        id: true,
        employee_name: true,
        email_account: true,
        phone_account: true,
      },
    });

    if (!employee) {
      throw new NotFoundException('Employee account not found');
    }

    let candidate = await this.prisma.candidate.findFirst({
      where: {
        OR: [
          { employee_id: employee.id },
          { email: employee.email_account || undefined },
          { phone_number: employee.phone_account || undefined },
        ],
      },
      select: {
        id: true,
        employee_id: true,
        candidate_code: true,
        candidate_name: true,
        email: true,
        phone_number: true,
        address: true,
        provice: true,
        district: true,
        cv_file: true,
        cv_uploaded_at: true,
        avatar_file: true,
        status: true,
        is_active: true,
        desired_position_id: true,
        desired_rank_id: true,
        preferred_job_type: true,
        desiredRank: {
          select: {
            id: true,
            name_rank: true,
          },
        },
        created_at: true,
        updated_at: true,
      },
    });

    if (candidate && !candidate.employee_id) {
      candidate = await this.prisma.candidate.update({
        where: { id: candidate.id },
        data: { employee_id: employee.id, updated_at: new Date() },
        select: {
          id: true,
          employee_id: true,
          candidate_code: true,
          candidate_name: true,
          email: true,
          phone_number: true,
          address: true,
          provice: true,
          district: true,
          cv_file: true,
          cv_uploaded_at: true,
          avatar_file: true,
          status: true,
          is_active: true,
          desired_position_id: true,
          desired_rank_id: true,
          preferred_job_type: true,
          desiredRank: {
            select: {
              id: true,
              name_rank: true,
            },
          },
          created_at: true,
          updated_at: true,
        },
      });
    }

    if (!candidate) {
      // Retry up to 3 times if P2002 unique constraint error occurs
      let lastError: any;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const candidateCode = await this.getNextCandidateCode();
          candidate = await this.prisma.candidate.create({
            data: {
              candidate_code: candidateCode,
              candidate_name:
                employee.employee_name ||
                employee.email_account ||
                employee.phone_account,
              email: employee.email_account,
              phone_number: employee.phone_account,
              employee_id: employee.id,
              status: 'Active',
              is_active: true,
              date_applied: new Date(),
            },
            select: {
              id: true,
              employee_id: true,
              candidate_code: true,
              candidate_name: true,
              email: true,
              phone_number: true,
              address: true,
              provice: true,
              district: true,
              cv_file: true,
              cv_uploaded_at: true,
              avatar_file: true,
              status: true,
              is_active: true,
              desired_position_id: true,
              desired_rank_id: true,
              preferred_job_type: true,
              desiredRank: {
                select: {
                  id: true,
                  name_rank: true,
                },
              },
              created_at: true,
              updated_at: true,
            },
          });
          break; // Success, exit retry loop
        } catch (error: any) {
          lastError = error;
          // Only retry on P2002 (unique constraint) error for candidate_code
          if (
            error?.code === 'P2002' &&
            error?.meta?.target?.includes('candidate_code')
          ) {
            if (attempt < 2) {
              // Sleep briefly before retry to reduce contention
              await new Promise((resolve) =>
                setTimeout(resolve, 50 * (attempt + 1)),
              );
              continue;
            }
          }
          // For other errors or after max retries, rethrow
          throw error;
        }
      }

      if (!candidate) {
        throw (
          lastError || new Error('Failed to create candidate after retries')
        );
      }
    }

    return {
      ...candidate,
      employee: {
        id: employee.id,
        employee_name: employee.employee_name,
        email_account: employee.email_account,
        phone_account: employee.phone_account,
      },
    };
  }

  async updateBasicInfoByEmployee(
    employeeId: string,
    data: UpdateCandidateBasicInfoDto,
    actor?: CandidateAuditActor,
  ) {
    this.assertCanMutateCandidate(actor);

    const currentProfile = await this.getMyProfileByEmployee(employeeId);
    const candidateData: Record<string, unknown> = {
      updated_at: new Date(),
    };
    const employeeData: Record<string, unknown> = {
      updated_at: new Date(),
    };

    if (Object.prototype.hasOwnProperty.call(data, 'candidate_name')) {
      const nextName = data.candidate_name?.trim() || null;
      candidateData.candidate_name = nextName;
      employeeData.employee_name = nextName;
    }

    if (Object.prototype.hasOwnProperty.call(data, 'phone_number')) {
      const nextPhone = data.phone_number?.trim() || null;
      candidateData.phone_number = nextPhone;
      if (nextPhone) {
        employeeData.phone_account = nextPhone;
      }
    }

    let updated: any;

    try {
      updated = await this.prisma.$transaction(async (tx) => {
        const updatedCandidate = await tx.candidate.update({
          where: { id: currentProfile.id },
          data: candidateData,
          select: {
            id: true,
            employee_id: true,
            candidate_code: true,
            candidate_name: true,
            email: true,
            phone_number: true,
            address: true,
            provice: true,
            district: true,
            cv_file: true,
            cv_uploaded_at: true,
            avatar_file: true,
            status: true,
            is_active: true,
            desired_position_id: true,
            desired_rank_id: true,
            preferred_job_type: true,
            desiredRank: {
              select: {
                id: true,
                name_rank: true,
              },
            },
            created_at: true,
            updated_at: true,
          },
        });

        if (Object.keys(employeeData).length > 1) {
          await tx.employee.update({
            where: { id: employeeId },
            data: employeeData,
          });
        }

        return updatedCandidate;
      });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new BadRequestException('Phone number already exists');
      }
      throw error;
    }

    await this.auditLogService.logCandidateActivity({
      candidateId: currentProfile.id,
      action: 'CANDIDATE_BASIC_INFO_UPDATED',
      message: 'Updated candidate basic profile information',
      metadata: {
        updated_fields: Object.keys(candidateData).filter(
          (key) => key !== 'updated_at',
        ),
        synced_employee_fields: Object.keys(employeeData).filter(
          (key) => key !== 'updated_at',
        ),
      },
      ...actor,
    });

    return {
      ...updated,
      employee: {
        ...currentProfile.employee,
        employee_name: updated.candidate_name,
        phone_account: updated.phone_number,
      },
    };
  }

  async create(
    data: CreateCandidateDto,
    actor?: CandidateAuditActor,
  ): Promise<Candidate> {
    this.assertCanMutateCandidate(actor);

    const { candidate_code, candidateExperiences, ...rest } = data;

    let potentialTypeName: string | null = null;
    const normalizedPotentialTypeId = data.potential_type_id || undefined;
    const normalizedIsPotential =
      normalizedPotentialTypeId && data.is_potential !== false
        ? true
        : data.is_potential;

    if (normalizedIsPotential === true && !normalizedPotentialTypeId) {
      throw new BadRequestException(
        'potential_type_id is required when is_potential is true',
      );
    }

    if (normalizedIsPotential === false && normalizedPotentialTypeId) {
      throw new BadRequestException(
        'Cannot set potential_type_id when is_potential is false',
      );
    }

    if (normalizedPotentialTypeId) {
      const potentialType = await this.validatePotentialType(
        normalizedPotentialTypeId,
      );
      potentialTypeName = potentialType.name;
    }

    const lastCandidate = await this.prisma.candidate.findFirst({
      where: {
        candidate_code: { not: null, startsWith: 'CA_' },
      },
      orderBy: { candidate_code: 'desc' },
      select: { candidate_code: true },
    });

    let nextNumber = 1;
    const last = lastCandidate?.candidate_code;
    if (last) {
      const match = last.match(/^CA_(\d+)$/);
      if (match) nextNumber = Number(match[1]) + 1;
    }

    const code = candidate_code || generateCode('CA', nextNumber);

    const created = await this.prisma.candidate.create({
      data: {
        ...rest,
        is_potential: normalizedIsPotential ?? false,
        potential_type_id: normalizedIsPotential
          ? normalizedPotentialTypeId
          : undefined,
        candidate_code: code,
        date_of_birth: data.date_of_birth
          ? new Date(data.date_of_birth)
          : undefined,
        date_applied: data.date_applied
          ? new Date(data.date_applied)
          : undefined,
        candidateExperiences: candidateExperiences
          ? {
              create: candidateExperiences.map((exp) => ({
                ...exp,
                from_month: exp.from_month
                  ? new Date(exp.from_month)
                  : undefined,
                to_month: exp.to_month ? new Date(exp.to_month) : undefined,
              })),
            }
          : undefined,
      },
      include: { candidateExperiences: true, statusApplication: true },
    });

    await this.auditLogService.logCandidateActivity({
      candidateId: created.id,
      action: 'CANDIDATE_CREATED',
      message: 'Created candidate profile',
      metadata: {
        candidate_code: created.candidate_code,
        candidate_name: created.candidate_name,
        is_potential: created.is_potential,
        potential_type_id: created.potential_type_id,
        potential_type_name: potentialTypeName,
      },
      ...actor,
    });

    return created;
  }

  async getAll(
    filter: CandidateFilterType,
    actor?: any,
  ): Promise<CandidatePaginType> {
    const items_per_pages = Number(filter.items_per_pages) || 10;
    const pages = Number(filter.pages) || 1;
    const search = filter.search?.trim() || '';
    const status = filter.status?.trim() || '';
    const skip = pages > 1 ? (pages - 1) * items_per_pages : 0;

    let candidateIdsWithLatestStatus: string[] | null = null;

    if (status) {
      const latestStatusCandidates = await this.prisma.$queryRaw<
        Array<{ candidate_id: string }>
      >`
        SELECT candidate_id
        FROM (
          SELECT DISTINCT ON (candidate_id)
            candidate_id,
            status,
            updated_at
          FROM "Application"
          ORDER BY candidate_id, updated_at DESC
        ) latest_application
        WHERE LOWER(status) = LOWER(${status})
      `;

      candidateIdsWithLatestStatus = latestStatusCandidates.map(
        (item) => item.candidate_id,
      );

      if (!candidateIdsWithLatestStatus.length) {
        return {
          data: [],
          current_pages: pages,
          items_per_pages,
          total_items: 0,
        };
      }
    }

    const companyId = this.getEmployerCompanyId(actor);

    const whereCondition: any = {
      is_active: true,
      ...(candidateIdsWithLatestStatus
        ? {
            id: {
              in: candidateIdsWithLatestStatus,
            },
          }
        : {}),
      OR: [
        { candidate_name: { contains: search, mode: 'insensitive' as const } },
        { candidate_code: { contains: search, mode: 'insensitive' as const } },
        { email: { contains: search, mode: 'insensitive' as const } },
        { phone_number: { contains: search, mode: 'insensitive' as const } },
      ],
    };

    if (companyId) {
      whereCondition.AND = [
        ...(Array.isArray(whereCondition.AND) ? whereCondition.AND : []),
        this.getCandidateCompanyScopeCondition(companyId),
      ];
    }

    const [candidates, total_items] = await Promise.all([
      this.prisma.candidate.findMany({
        take: items_per_pages,
        skip,
        where: whereCondition,
        orderBy: { created_at: 'desc' },
        include: {
          candidateExperiences: {
            where: {
              is_active: true,
            },
          },
          statusApplication: {
            orderBy: { updated_at: 'desc' },
            take: 1,
            select: {
              id: true,
              status: true,
              note: true,
              created_at: true,
              updated_at: true,
              recruitment_infor_id: true,
              recruitment_infor: {
                select: {
                  id: true,
                  recruitment_code: true,
                  post_title: true,
                  internal_title: true,
                  positionPost: {
                    select: {
                      id: true,
                      name_post: true,
                    },
                  },
                },
              },
            },
          },
          jobCandidates: {
            select: {
              id: true,
            },
          },
          reviewCandidate: {
            where: { is_active: true },
            select: {
              id: true,
              rating: true,
              is_active: true,
            },
          },
          potential: {
            select: {
              id: true,
              name: true,
              is_active: true,
            },
          },
        },
      }),
      this.prisma.candidate.count({ where: whereCondition }),
    ]);

    const candidateIds = candidates
      .map((candidate) => candidate.id)
      .filter(Boolean);
    const applicationsSummaryMap = await this.buildApplicationsSummaryMap(
      candidateIds,
      actor,
    );

    const candidatesWithSummary = candidates.map((candidate) => ({
      ...candidate,
      applications_summary: applicationsSummaryMap.get(candidate.id) ?? {
        total_applications: 0,
        distinct_positions: 0,
        distinct_job_posts: 0,
        distinct_companies: 0,
      },
    }));

    return {
      data: candidatesWithSummary,
      current_pages: pages,
      items_per_pages,
      total_items,
    };
  }

  async getPotentialCandidates(
    filter: PotentialCandidateFilterType,
    actor?: any,
  ): Promise<CandidatePaginType> {
    const items_per_pages = Number(filter.items_per_pages) || 10;
    const pages = Number(filter.pages) || 1;
    const search = filter.search?.trim() || '';
    const skip = pages > 1 ? (pages - 1) * items_per_pages : 0;

    const companyId = this.getEmployerCompanyId(actor);

    const whereCondition: any = {
      is_active: true,
      is_potential: true,
      ...(filter.potential_type_id
        ? {
            potential_type_id: filter.potential_type_id,
          }
        : {}),
      OR: [
        { candidate_name: { contains: search, mode: 'insensitive' as const } },
        { candidate_code: { contains: search, mode: 'insensitive' as const } },
        { email: { contains: search, mode: 'insensitive' as const } },
        { phone_number: { contains: search, mode: 'insensitive' as const } },
      ],
    };

    if (companyId) {
      whereCondition.AND = [
        ...(Array.isArray(whereCondition.AND) ? whereCondition.AND : []),
        this.getCandidateCompanyScopeCondition(companyId),
      ];
    }

    const [candidates, total_items] = await Promise.all([
      this.prisma.candidate.findMany({
        take: items_per_pages,
        skip,
        where: whereCondition,
        orderBy: { created_at: 'desc' },
        include: {
          candidateExperiences: {
            where: {
              is_active: true,
            },
          },
          statusApplication: {
            orderBy: { updated_at: 'desc' },
            take: 1,
            select: {
              id: true,
              status: true,
              note: true,
              created_at: true,
              updated_at: true,
              recruitment_infor_id: true,
              recruitment_infor: {
                select: {
                  id: true,
                  recruitment_code: true,
                  post_title: true,
                  internal_title: true,
                  positionPost: {
                    select: {
                      id: true,
                      name_post: true,
                    },
                  },
                },
              },
            },
          },
          reviewCandidate: {
            where: { is_active: true },
            select: {
              id: true,
              rating: true,
              is_active: true,
            },
          },
          potential: {
            select: {
              id: true,
              name: true,
              description: true,
              is_active: true,
            },
          },
        },
      }),
      this.prisma.candidate.count({ where: whereCondition }),
    ]);

    return {
      data: candidates,
      current_pages: pages,
      items_per_pages,
      total_items,
    };
  }

  async getByID(id: string, actor?: any): Promise<Candidate> {
    const companyId = this.getEmployerCompanyId(actor);
    const candidate = await this.prisma.candidate.findFirst({
      where: {
        id,
        ...(companyId ? this.getCandidateCompanyScopeCondition(companyId) : {}),
      },
      include: {
        candidateExperiences: {
          where: {
            is_active: true,
          },
        },
        candidateSkill: {
          include: {
            skill: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        jobCandidates: {
          include: {
            job: {
              include: {
                employee: {
                  select: {
                    id: true,
                    employee_name: true,
                  },
                },
              },
            },
          },
        },
        statusApplication: {
          orderBy: { updated_at: 'desc' },
          select: {
            id: true,
            status: true,
            note: true,
            cover_letter: true,
            applied_at: true,
            reapply_count: true,
            recruitment_infor_id: true,
            recruitment_infor: {
              select: {
                id: true,
                post_title: true,
                internal_title: true,
                positionPost: {
                  select: { id: true, name_post: true },
                },
              },
            },
          },
        },
        potential: {
          select: {
            id: true,
            name: true,
            is_active: true,
          },
        },
      },
    });
    if (!candidate) throw new NotFoundException('Candidate not found');

    const applications = candidate.statusApplication ?? [];
    const recruitmentInforIds = applications
      .map((application) => application.recruitment_infor_id)
      .filter((id): id is string => Boolean(id));

    const recommendationRows = recruitmentInforIds.length
      ? await this.prisma.candidateJobRecommendation.findMany({
          where: {
            candidate_id: candidate.id,
            recruitment_infor_id: { in: recruitmentInforIds },
          },
          select: {
            recruitment_infor_id: true,

            skill_overlap_score: true,
            group_similarity_score: true,
            dominant_group_score: true,
            baseline_score: true,
            semantic_score: true,
            hybrid_score: true,

            experience_score: true,
            job_type_score: true,
            location_score: true,
            position_score: true,
            rank_score: true,

            final_score: true,

            matched_skill_ids: true,
            missing_skill_ids: true,
            reason_texts: true,

            calculated_at: true,
            pipeline_version: true,
            model_name: true,
          },
        })
      : [];

    const skillIds = Array.from(
      new Set(
        recommendationRows.flatMap((row) => [
          ...(row.matched_skill_ids ?? []),
          ...(row.missing_skill_ids ?? []),
        ]),
      ),
    );

    const skillNameMap = new Map<string, string>();
    if (skillIds.length > 0) {
      const skills = await this.prisma.skill.findMany({
        where: { id: { in: skillIds } },
        select: { id: true, name: true },
      });

      skills.forEach((skill) => {
        skillNameMap.set(skill.id, skill.name);
      });
    }

    const recommendationMap = new Map(
      recommendationRows.map((row) => [row.recruitment_infor_id, row]),
    );

    const candidateSkills = (candidate.candidateSkill ?? []).map((item) => ({
      skill_id: item.skill_id,
      skill_name: item.skill?.name ?? '',
      level: item.level ?? null,
    }));

    const applicationsWithSkillMatch = applications.map((application) => {
      const recommendation = recommendationMap.get(
        application.recruitment_infor_id,
      );

      return {
        ...application,
        skill_match: recommendation
          ? this.mapSkillMatch(recommendation, skillNameMap)
          : null,
      };
    });

    const { candidateSkill, statusApplication, ...rest } = candidate as any;

    return {
      ...rest,
      candidate_skills: candidateSkills,
      statusApplication: applicationsWithSkillMatch,
    };
  }

  async update(
    id: string,
    data: UpdateCandidateDto,
    actor?: CandidateAuditActor,
  ): Promise<Candidate> {
    const companyId = this.getEmployerCompanyId(actor);
    const isEmployer = Boolean(companyId);
    const actorRoles = this.getActorRoles(actor).map((role) =>
      role.toLowerCase(),
    );
    const isCandidateActor =
      !isEmployer &&
      actorRoles.includes('candidate') &&
      !actorRoles.includes('admin') &&
      !actorRoles.includes('employee');

    if (isEmployer) {
      const allowedFields = new Set(['is_potential', 'potential_type_id']);
      const candidateExperiences = data.candidateExperiences ?? [];
      const updateKeys = [
        ...Object.keys(data).filter((key) => key !== 'candidateExperiences'),
        ...(candidateExperiences.length ? ['candidateExperiences'] : []),
      ];

      if (updateKeys.some((key) => !allowedFields.has(key))) {
        throw new ForbiddenException('No permission to modify candidate');
      }
    } else {
      this.assertCanMutateCandidate(actor);

      if (isCandidateActor) {
        const allowedFields = new Set(['candidate_name', 'phone_number']);
        const updateKeys = Object.keys(data).filter(
          (key) => key !== 'candidateExperiences',
        );

        if (
          updateKeys.some((key) => !allowedFields.has(key)) ||
          (data.candidateExperiences?.length ?? 0) > 0
        ) {
          throw new ForbiddenException(
            'Candidates can only update basic profile information',
          );
        }
      }
    }

    const candidate = isEmployer
      ? await this.prisma.candidate.findFirst({
          where: {
            id,
            ...this.getCandidateCompanyScopeCondition(companyId!),
          },
          select: {
            id: true,
            is_potential: true,
            potential_type_id: true,
            potential: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        })
      : await this.prisma.candidate.findUnique({
          where: { id },
          select: {
            id: true,
            is_potential: true,
            potential_type_id: true,
            potential: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });
    if (!candidate) throw new NotFoundException('Candidate not found');

    if (isCandidateActor) {
      if (!actor?.actorEmployeeId) {
        throw new ForbiddenException('No candidate account context');
      }

      const myProfile = await this.getMyProfileByEmployee(
        actor.actorEmployeeId,
      );
      if (myProfile.id !== id) {
        throw new ForbiddenException('No permission to modify this candidate');
      }
    }

    const { candidateExperiences, ...rest } = data;

    const hasPotentialTypeField = Object.prototype.hasOwnProperty.call(
      data,
      'potential_type_id',
    );
    const hasIsPotentialField = Object.prototype.hasOwnProperty.call(
      data,
      'is_potential',
    );
    let nextPotentialTypeId = hasPotentialTypeField
      ? (data.potential_type_id ?? null)
      : candidate.potential_type_id;
    let nextIsPotential = hasIsPotentialField
      ? data.is_potential
      : candidate.is_potential;
    let potentialTypeName: string | null = candidate.potential?.name ?? null;

    if (nextPotentialTypeId && nextIsPotential !== false) {
      nextIsPotential = true;
    }

    if (nextIsPotential === false) {
      nextPotentialTypeId = null;
      potentialTypeName = null;
    }

    if (nextIsPotential === true && !nextPotentialTypeId) {
      throw new BadRequestException(
        'potential_type_id is required when is_potential is true',
      );
    }

    if (nextPotentialTypeId) {
      const potentialType =
        await this.validatePotentialType(nextPotentialTypeId);
      potentialTypeName = potentialType.name;
    }

    const createExp = candidateExperiences?.filter((e) => !e.id) ?? [];
    const updateExp =
      candidateExperiences?.filter((e) => e.id && e.is_active !== false) ?? [];
    const deleteExp =
      candidateExperiences?.filter((e) => e.id && e.is_active === false) ?? [];

    const nestedExp: any = {};

    if (createExp.length) {
      nestedExp.create = createExp.map((exp) => ({
        company_name: exp.company_name,
        position: exp.position,
        from_month: exp.from_month ? new Date(exp.from_month) : undefined,
        to_month: exp.to_month ? new Date(exp.to_month) : undefined,
        job_description: exp.job_description,
        is_active: true,
      }));
    }

    if (updateExp.length) {
      nestedExp.update = updateExp.map((exp) => ({
        where: { id: exp.id! },
        data: {
          company_name: exp.company_name,
          position: exp.position,
          from_month: exp.from_month ? new Date(exp.from_month) : undefined,
          to_month: exp.to_month ? new Date(exp.to_month) : undefined,
          job_description: exp.job_description,
        },
      }));
    }

    if (deleteExp.length) {
      nestedExp.update = [
        ...(nestedExp.update ?? []),
        ...deleteExp.map((exp) => ({
          where: { id: exp.id! },
          data: { is_active: false },
        })),
      ];
    }

    const updated = await this.prisma.candidate.update({
      where: { id },
      data: {
        ...rest,
        is_potential: nextIsPotential,
        potential_type_id: nextPotentialTypeId,
        date_of_birth: rest.date_of_birth
          ? new Date(rest.date_of_birth)
          : undefined,
        date_applied: rest.date_applied
          ? new Date(rest.date_applied)
          : undefined,
        updated_at: new Date(),
        ...(candidateExperiences ? { candidateExperiences: nestedExp } : {}),
      },
      include: {
        candidateExperiences: { where: { is_active: true } },
        potential: {
          select: {
            id: true,
            name: true,
            is_active: true,
          },
        },
        statusApplication: true,
      },
    });

    await this.auditLogService.logCandidateActivity({
      candidateId: id,
      action:
        !candidate.is_potential && updated.is_potential
          ? 'CANDIDATE_MOVED_TO_TALENT_POOL'
          : candidate.is_potential && !updated.is_potential
            ? 'CANDIDATE_REMOVED_FROM_TALENT_POOL'
            : 'CANDIDATE_UPDATED',
      message:
        !candidate.is_potential && updated.is_potential
          ? 'Moved candidate to talent pool'
          : candidate.is_potential && !updated.is_potential
            ? 'Removed candidate from talent pool'
            : 'Updated candidate profile',
      metadata: {
        updated_fields: Object.keys(rest),
        is_potential_before: candidate.is_potential,
        is_potential_after: updated.is_potential,
        potential_type_id_before: candidate.potential_type_id,
        potential_type_id_after: updated.potential_type_id,
        potential_type_name_after: potentialTypeName,
        experience_changes: {
          created: createExp.length,
          updated: updateExp.length,
          deleted: deleteExp.length,
        },
      },
      ...actor,
    });

    return updated;
  }

  async delete(id: string, actor?: CandidateAuditActor): Promise<Candidate> {
    this.assertCanMutateCandidate(actor);

    const candidate = await this.prisma.candidate.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!candidate) throw new NotFoundException('Candidate not found');

    const deleted = await this.prisma.candidate.update({
      where: { id },
      data: { is_active: false, updated_at: new Date() },
    });

    await this.auditLogService.logCandidateActivity({
      candidateId: id,
      action: 'CANDIDATE_DEACTIVATED',
      message: 'Deactivated candidate profile',
      ...actor,
    });

    return deleted;
  }

  async replaceCv(
    candidate_id: string,
    newFileName: string,
    actor?: CandidateAuditActor,
  ) {
    const roles = this.getActorRoles(actor).map((r) => r.toLowerCase());
    const isPrivileged = roles.includes('admin') || roles.includes('employee');
    const isSelfCandidate = roles.includes('candidate');

    if (!isPrivileged && !isSelfCandidate) {
      throw new ForbiddenException('No permission to modify candidate');
    }

    const candidate = await this.prisma.candidate.findUnique({
      where: { id: candidate_id },
      select: { id: true, email: true, phone_number: true },
    });

    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }

    const now = new Date();
    const cvFileUrl = `/uploads/cv/${newFileName}`;
    const uploadedTitle = `CV upload - ${new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(now)}`;

    const updated = await this.prisma.$transaction(async (tx) => {
      const candidateUpdated = await tx.candidate.update({
        where: { id: candidate_id },
        data: {
          cv_file: newFileName,
          cv_uploaded_at: now,
          updated_at: now,
        },
        select: {
          id: true,
          cv_file: true,
          cv_uploaded_at: true,
        },
      });

      // Set all old CVs to not primary
      await tx.candidateCV.updateMany({
        where: {
          candidate_id,
          is_primary: true,
        },
        data: {
          is_primary: false,
        },
      });

      // Always create a NEW CV record - never update/replace existing ones
      await tx.candidateCV.create({
        data: {
          candidate_id,
          title: uploadedTitle,
          source_type: CANDIDATE_CV_SOURCE_TYPE.UPLOADED_FILE,
          status: CANDIDATE_CV_STATUS.COMPLETED,
          is_primary: true,
          file_url: cvFileUrl,
          file_name: newFileName,
        },
      });

      return candidateUpdated;
    });

    let recommendationResult: any = null;
    let recommendationError: string | null = null;

    try {
      recommendationResult =
        await this.recommendationEngineService.rebuildCandidateRecommendation(
          candidate_id,
        );
    } catch (error: any) {
      recommendationError = error?.message || String(error);
      console.error(
        '[RecommendationEngine] Failed to rebuild candidate recommendation:',
        recommendationError,
      );
    }

    await this.auditLogService.logCandidateActivity({
      candidateId: candidate_id,
      action: 'CANDIDATE_CV_UPLOADED',
      message: recommendationError
        ? 'Uploaded new candidate CV file, but recommendation rebuild failed'
        : 'Uploaded new candidate CV file and rebuilt recommendation via FastAPI',
      metadata: {
        cv_file: newFileName,
        recommendation_status: recommendationError ? 'FAILED' : 'SUCCESS',
        recommendation_error: recommendationError,
        sync_result: recommendationResult?.sync ?? null,
        ranking_result: recommendationResult?.recommendation
          ? {
              candidate_id: recommendationResult.recommendation.candidate_id,
              n_ranked_jobs: recommendationResult.recommendation.n_ranked_jobs,
            }
          : null,
      },
      ...actor,
    });

    return {
      ...updated,
      recommendation_result: recommendationResult,
      recommendation_error: recommendationError,
    };
  }

  async replaceAvatarByEmployee(
    employeeId: string,
    newFileName: string,
    actor?: CandidateAuditActor,
  ) {
    const currentProfile = await this.getMyProfileByEmployee(employeeId);
    const updated = await this.replaceAvatar(
      currentProfile.id,
      newFileName,
      actor,
    );

    await this.prisma.employee.update({
      where: { id: employeeId },
      data: {
        avatar: `/uploads/avatar/${newFileName}`,
        updated_at: new Date(),
      },
    });

    return updated;
  }

  async replaceAvatar(
    candidate_id: string,
    newFileName: string,
    actor?: CandidateAuditActor,
  ) {
    this.assertCanMutateCandidate(actor);

    const candidate = await this.prisma.candidate.findUnique({
      where: { id: candidate_id },
      select: { id: true, avatar_file: true },
    });

    if (!candidate) throw new NotFoundException('Candidate not found');

    if (candidate.avatar_file) {
      const oldPath = path.join(
        process.cwd(),
        'uploads',
        'avatar',
        candidate.avatar_file,
      );
      fs.promises.unlink(oldPath).catch(() => {});
    }

    const updated = await this.prisma.candidate.update({
      where: { id: candidate_id },
      data: {
        avatar_file: newFileName,
        avatar_uploaded_at: new Date(),
      },
      select: {
        id: true,
        avatar_file: true,
        avatar_uploaded_at: true,
      },
    });

    await this.auditLogService.logCandidateActivity({
      candidateId: candidate_id,
      action: 'CANDIDATE_AVATAR_REPLACED',
      message: 'Uploaded/Replaced candidate avatar file',
      metadata: { avatar_file: newFileName },
      ...actor,
    });

    return updated;
  }
}
