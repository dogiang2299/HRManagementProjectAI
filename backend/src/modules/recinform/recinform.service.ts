import {
  HttpException,
  HttpStatus,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateRecruitmentInforDto } from './dto/created_recinform';
import { RecruitmentInforFilterType } from './dto/recinform_filter_type';
import { RecruitmentInforPaginType } from './dto/recinform_pagin_type';
import { UpdateRecruitmentInforDto } from './dto/updated_recinform';
import type {
  RecruitmentCostPeriod,
  RecruitmentCostQueryDto,
  RecruitmentCostScope,
} from './dto/cost-query';
import type {
  RecruitmentPlanPeriod,
  RecruitmentPlanQueryDto,
  RecruitmentPlanScope,
} from './dto/plan-query';
import { Prisma, Recruitment_Infor } from '@prisma/client';
@Injectable()
export class RecinformService {
  constructor(
  private readonly prismaService: PrismaService) {}

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

  private applyEmployerCompanyScope(where: any, actor?: any) {
    const companyId = this.getEmployerCompanyId(actor);
    if (!companyId) return;

    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : []),
      {
        OR: [
          { department_id: companyId },
          { work_location_id: companyId },
          { positionPost: { is: { unit_id: companyId } } },
          { contactPerson: { is: { company_id: companyId } } },
        ],
      },
    ];
  }

  private normalizeStatus(status?: string | null) {
    if (!status) return undefined;

    const normalized = status
      .trim()
      .toUpperCase()
      .replace(/\s+/g, '_')
      .replace(/-+/g, '_');
    if (normalized === 'DRAFT') return 'DRAFT';
    if (normalized === 'PUBLIC') return 'PUBLIC';
    if (normalized === 'INTERNAL') return 'INTERNAL';
    if (normalized === 'CLOSED') return 'CLOSED';
    if (normalized === 'STOP_RECEIVING') return 'STOP_RECEIVING';

    return normalized;
  }

  private normalizeRecruitmentSkills(
    skills?: CreateRecruitmentInforDto['skills'],
  ) {
    if (!Array.isArray(skills)) return [];

    const bySkillId = new Map<
      string,
      { skill_id: string; level: number; is_required: boolean }
    >();

    for (const item of skills) {
      const skillId = item?.skill_id?.trim();
      if (!skillId) continue;

      const rawLevel = Number(item.level ?? 1);
      const level = Number.isFinite(rawLevel)
        ? Math.max(1, Math.min(5, Math.round(rawLevel)))
        : 1;

      bySkillId.set(skillId, {
        skill_id: skillId,
        level,
        is_required: item.is_required ?? true,
      });
    }

    return Array.from(bySkillId.values());
  }

  private getCompanyIdForCompanySkillSync(recruitment: any, actor?: any) {
    return (
      actor?.company_id ||
      recruitment?.department_id ||
      recruitment?.contactPerson?.company_id ||
      recruitment?.positionPost?.unit_id ||
      null
    );
  }

  private async upsertCompanySkillsForRecruitment(
    tx: Prisma.TransactionClient,
    companyId: string | null | undefined,
    skillIds: Array<string | null | undefined>,
  ) {
    if (!companyId) return;

    const uniqueSkillIds = Array.from(
      new Set(skillIds.map((skillId) => skillId?.trim()).filter(Boolean)),
    ) as string[];

    if (!uniqueSkillIds.length) return;

    for (const skillId of uniqueSkillIds) {
      await tx.companySkill.upsert({
        where: {
          company_id_skill_id: {
            company_id: companyId,
            skill_id: skillId,
          },
        },
        create: {
          company_id: companyId,
          skill_id: skillId,
          is_active: true,
          source: 'JOB_REQUIREMENT',
        },
        update: {
          is_active: true,
          source: 'JOB_REQUIREMENT',
          updated_at: new Date(),
        },
      });
    }
  }

  private async syncRecruitmentSkills(
    tx: Prisma.TransactionClient,
    recruitmentId: string,
    positionPostId?: string | null,
    skills?: CreateRecruitmentInforDto['skills'],
    companyId?: string | null,
  ) {
    const manualSkills = this.normalizeRecruitmentSkills(skills);

    await tx.recruitmentSkill.deleteMany({
      where: {
        recruitment_id: recruitmentId,
      },
    });

    if (manualSkills.length) {
      await tx.recruitmentSkill.createMany({
        data: manualSkills.map((item) => ({
          recruitment_id: recruitmentId,
          skill_id: item.skill_id,
          level: item.level,
          is_required: item.is_required,
        })),
        skipDuplicates: true,
      });

      await this.upsertCompanySkillsForRecruitment(
        tx,
        companyId,
        manualSkills.map((item) => item.skill_id),
      );
      return;
    }

    if (!positionPostId) return;

    const positionSkills = await tx.positionSkill.findMany({
      where: {
        position_id: positionPostId,
      },
      select: {
        skill_id: true,
        level: true,
        is_required: true,
      },
    });

    if (!positionSkills.length) return;

    await tx.recruitmentSkill.createMany({
      data: positionSkills.map((item) => ({
        recruitment_id: recruitmentId,
        skill_id: item.skill_id,
        level: item.level ?? 1,
        is_required: item.is_required ?? true,
      })),
      skipDuplicates: true,
    });

    await this.upsertCompanySkillsForRecruitment(
      tx,
      companyId,
      positionSkills.map((item) => item.skill_id),
    );
  }

  private getRecruitmentSkillsInclude() {
    return {
      include: {
        skill: {
          select: {
            id: true,
            name: true,
            parent_id: true,
            parent: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    };
  }

  private resolvePeriodStart(period: RecruitmentCostPeriod) {
    const now = new Date();

    if (period === 'month') {
      return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    }

    if (period === 'quarter') {
      const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
      return new Date(now.getFullYear(), quarterStartMonth, 1, 0, 0, 0, 0);
    }

    return new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
  }

  private matchesScope(
    scope: RecruitmentCostScope,
    department?: {
      full_name?: string | null;
      acronym_name?: string | null;
    } | null,
  ) {
    if (scope === 'all') return true;

    const label =
      `${department?.full_name || ''} ${department?.acronym_name || ''}`
        .trim()
        .toLowerCase();

    if (scope === 'tech') {
      return (
        label.includes('tech') ||
        label.includes('it') ||
        label.includes('engineering')
      );
    }

    return (
      label.includes('operation') ||
      label.includes('ops') ||
      label.includes('hr') ||
      label.includes('finance')
    );
  }

  private isAcceptedStatus(status?: string | null) {
    const normalized = (status || '')
      .trim()
      .toLowerCase()
      .replace(/[_-]+/g, ' ');
    return (
      normalized.includes('accepted') ||
      normalized.includes('closed') ||
      normalized.includes('pass')
    );
  }

  private toNumber(value: unknown) {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  private mapRecommendationSkillMatch(row: any, skillNameMap: Map<string, string>) {
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

    const finalScore = this.toNumber(row?.final_score);
    const skillOverlapScore = this.toNumber(row?.skill_overlap_score);
    const groupSimilarityScore = this.toNumber(row?.group_similarity_score);
    const dominantGroupScore = this.toNumber(row?.dominant_group_score);
    const baselineScore = this.toNumber(row?.baseline_score);
    const semanticScore = this.toNumber(row?.semantic_score);
    const hybridScore = this.toNumber(row?.hybrid_score);
    const experienceScore = this.toNumber(row?.experience_score);
    const positionScore = this.toNumber(row?.position_score);
    const rankScore = this.toNumber(row?.rank_score);
    const jobTypeScore = this.toNumber(row?.job_type_score);
    const locationScore = this.toNumber(row?.location_score);

    return {
      final_score: finalScore,
      skill_overlap_score: skillOverlapScore,
      group_similarity_score: groupSimilarityScore,
      dominant_group_score: dominantGroupScore,
      baseline_score: baselineScore,
      semantic_score: semanticScore,
      hybrid_score: hybridScore,
      experience_score: experienceScore,
      position_score: positionScore,
      rank_score: rankScore,
      job_type_score: jobTypeScore,
      location_score: locationScore,
      matched_skill_ids: matchedSkillIds,
      missing_skill_ids: missingSkillIds,
      matched_skills: toSkillNames(matchedSkillIds),
      missing_skills: toSkillNames(missingSkillIds),
      reason_texts: Array.isArray(row?.reason_texts) ? row.reason_texts : [],
      calculated_at: row?.calculated_at ?? null,
      pipeline_version: row?.pipeline_version ?? null,
      model_name: row?.model_name ?? null,
      score_breakdown: {
        final: finalScore,
        skills: skillOverlapScore,
        semantic: semanticScore,
        experience: experienceScore,
        position: positionScore,
        job_type: jobTypeScore,
        location: locationScore,
        rank: rankScore,
        taxonomy_group: groupSimilarityScore,
        dominant_group: dominantGroupScore,
        baseline: baselineScore,
        hybrid: hybridScore,
      },
    };
  }

  private async getCandidateIdForActor(actor?: any) {
    if (!actor?.actorEmployeeId) return null;

    const roles = this.getActorRoles(actor).map((role) => role.toLowerCase());
    if (!roles.includes('candidate')) return null;

    const candidate = await this.prismaService.candidate.findFirst({
      where: {
        employee_id: actor.actorEmployeeId,
        is_active: true,
      },
      select: {
        id: true,
      },
    });

    return candidate?.id ?? null;
  }

  private async getRecommendationSkillMatch(
    recruitmentInforId: string,
    actor?: any,
    source?: string,
  ) {
    if (source !== 'recommendation') return null;

    const candidateId = await this.getCandidateIdForActor(actor);
    if (!candidateId) return null;

    const recommendation =
      await this.prismaService.candidateJobRecommendation.findUnique({
        where: {
          candidate_id_recruitment_infor_id: {
            candidate_id: candidateId,
            recruitment_infor_id: recruitmentInforId,
          },
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
          position_score: true,
          rank_score: true,
          job_type_score: true,
          location_score: true,
          final_score: true,
          matched_skill_ids: true,
          missing_skill_ids: true,
          reason_texts: true,
          calculated_at: true,
          pipeline_version: true,
          model_name: true,
        },
      });

    if (!recommendation) return null;

    const skillIds = Array.from(
      new Set([
        ...(recommendation.matched_skill_ids ?? []),
        ...(recommendation.missing_skill_ids ?? []),
      ]),
    );

    const skillNameMap = new Map<string, string>();
    if (skillIds.length) {
      const skills = await this.prismaService.skill.findMany({
        where: {
          id: {
            in: skillIds,
          },
        },
        select: {
          id: true,
          name: true,
        },
      });

      for (const skill of skills) {
        skillNameMap.set(skill.id, skill.name);
      }
    }

    return this.mapRecommendationSkillMatch(recommendation, skillNameMap);
  }

  async getCostSummary(query: RecruitmentCostQueryDto, actor?: any) {
    const period: RecruitmentCostPeriod = query?.period || 'month';
    const scope: RecruitmentCostScope = query?.scope || 'all';
    const startAt = this.resolvePeriodStart(period);
    const now = new Date();

    const whereCondition: any = {
      created_at: {
        gte: startAt,
      },
    };
    this.applyEmployerCompanyScope(whereCondition, actor);

    const recruitments = await this.prismaService.recruitment_Infor.findMany({
      where: whereCondition,
      include: {
        recruitmentCosts: true,
        department: {
          select: {
            id: true,
            full_name: true,
            acronym_name: true,
          },
        },
        contactPerson: {
          select: {
            id: true,
            employee_name: true,
          },
        },
      },
    });

    const filteredRecruitments = recruitments.filter((item) =>
      this.matchesScope(scope, item.department),
    );

    const recruitmentIds = filteredRecruitments.map((item) => item.id);

    const applications = recruitmentIds.length
      ? await this.prismaService.application.findMany({
          where: {
            recruitment_infor_id: {
              in: recruitmentIds,
            },
            created_at: {
              gte: startAt,
            },
          },
          select: {
            recruitment_infor_id: true,
            created_at: true,
            status: true,
          },
        })
      : [];

    const acceptedByRecruitment = new Map<string, number>();
    for (const item of applications) {
      if (!this.isAcceptedStatus(item.status)) continue;
      acceptedByRecruitment.set(
        item.recruitment_infor_id,
        (acceptedByRecruitment.get(item.recruitment_infor_id) || 0) + 1,
      );
    }

    const monthBucket = new Map<
      string,
      { month: string; cost: number; accepted: number }
    >();
    const monthCursor = new Date(
      startAt.getFullYear(),
      startAt.getMonth(),
      1,
      0,
      0,
      0,
      0,
    );
    while (monthCursor <= now) {
      const key = `${monthCursor.getFullYear()}-${monthCursor.getMonth()}`;
      monthBucket.set(key, {
        month: monthCursor.toLocaleString('en-US', { month: 'short' }),
        cost: 0,
        accepted: 0,
      });
      monthCursor.setMonth(monthCursor.getMonth() + 1);
    }

    const byTypeMap = new Map<string, number>();
    const byDepartmentMap = new Map<
      string,
      {
        department: string;
        amount: number;
        recruitments: number;
        accepted: number;
      }
    >();
    const byRecruiterMap = new Map<
      string,
      {
        recruiter: string;
        amount: number;
        recruitments: number;
        accepted: number;
      }
    >();
    const topRecruitments: Array<{
      code: string;
      title: string;
      department: string;
      amount: number;
      accepted: number;
      costPerAccepted: number;
      status: string;
    }> = [];

    let totalCost = 0;
    let totalAccepted = 0;
    let totalRecruitmentsWithCost = 0;

    for (const recruitment of filteredRecruitments) {
      const costs = Array.isArray(recruitment.recruitmentCosts)
        ? recruitment.recruitmentCosts
        : [];
      const recruitmentCost = costs.reduce(
        (sum, cost) => sum + this.toNumber(cost.amount),
        0,
      );

      if (recruitmentCost <= 0) continue;

      totalRecruitmentsWithCost += 1;
      totalCost += recruitmentCost;

      const accepted = acceptedByRecruitment.get(recruitment.id) || 0;
      totalAccepted += accepted;

      for (const cost of costs) {
        const amount = this.toNumber(cost.amount);
        if (amount <= 0) continue;
        const type = (cost.cost_type || 'Other').trim() || 'Other';
        byTypeMap.set(type, (byTypeMap.get(type) || 0) + amount);
      }

      const departmentName =
        recruitment.department?.full_name ||
        recruitment.department?.acronym_name ||
        'Unknown department';

      if (!byDepartmentMap.has(departmentName)) {
        byDepartmentMap.set(departmentName, {
          department: departmentName,
          amount: 0,
          recruitments: 0,
          accepted: 0,
        });
      }

      const department = byDepartmentMap.get(departmentName)!;
      department.amount += recruitmentCost;
      department.recruitments += 1;
      department.accepted += accepted;

      const recruiterName =
        recruitment.contactPerson?.employee_name || 'Unassigned recruiter';

      if (!byRecruiterMap.has(recruiterName)) {
        byRecruiterMap.set(recruiterName, {
          recruiter: recruiterName,
          amount: 0,
          recruitments: 0,
          accepted: 0,
        });
      }

      const recruiter = byRecruiterMap.get(recruiterName)!;
      recruiter.amount += recruitmentCost;
      recruiter.recruitments += 1;
      recruiter.accepted += accepted;

      const createdAt = recruitment.created_at
        ? new Date(recruitment.created_at)
        : null;
      if (createdAt && !Number.isNaN(createdAt.getTime())) {
        const monthKey = `${createdAt.getFullYear()}-${createdAt.getMonth()}`;
        const monthData = monthBucket.get(monthKey);
        if (monthData) {
          monthData.cost += recruitmentCost;
          monthData.accepted += accepted;
        }
      }

      topRecruitments.push({
        code: recruitment.recruitment_code || '-',
        title:
          recruitment.post_title ||
          recruitment.internal_title ||
          'Untitled recruitment',
        department: departmentName,
        amount: recruitmentCost,
        accepted,
        costPerAccepted:
          accepted > 0 ? recruitmentCost / accepted : recruitmentCost,
        status: recruitment.status || 'UNKNOWN',
      });
    }

    const byType = Array.from(byTypeMap.entries())
      .map(([type, amount]) => ({
        type,
        amount,
        sharePercent:
          totalCost > 0 ? Number(((amount / totalCost) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    const byDepartment = Array.from(byDepartmentMap.values())
      .map((item) => ({
        ...item,
        costPerAccepted:
          item.accepted > 0 ? item.amount / item.accepted : item.amount,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    const byRecruiter = Array.from(byRecruiterMap.values())
      .map((item) => ({
        ...item,
        costPerAccepted:
          item.accepted > 0 ? item.amount / item.accepted : item.amount,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    const trend = Array.from(monthBucket.values()).map((item) => ({
      ...item,
      costPerAccepted:
        item.accepted > 0 ? item.cost / item.accepted : item.cost,
    }));

    const top = topRecruitments
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    return {
      generatedAt: new Date().toISOString(),
      period,
      scope,
      totals: {
        totalCost,
        totalRecruitmentsWithCost,
        totalAccepted,
        costPerAccepted:
          totalAccepted > 0 ? totalCost / totalAccepted : totalCost,
      },
      byType,
      byDepartment,
      byRecruiter,
      trend,
      topRecruitments: top,
    };
  }

  async getPlanSummary(query: RecruitmentPlanQueryDto, actor?: any) {
    const period: RecruitmentPlanPeriod = query?.period || 'month';
    const scope: RecruitmentPlanScope = query?.scope || 'all';
    const startAt = this.resolvePeriodStart(period);
    const now = new Date();

    const whereCondition: any = { created_at: { gte: startAt } };
    this.applyEmployerCompanyScope(whereCondition, actor);

    const recruitments = await this.prismaService.recruitment_Infor.findMany({
      where: whereCondition,
      include: {
        recruitmentPlans: {
          include: {
            recruitmentPlanChildBatches: true,
            recruitmentPlanChildPosteds: true,
          },
        },
        department: {
          select: { id: true, full_name: true, acronym_name: true },
        },
        contactPerson: { select: { id: true, employee_name: true } },
        positionPost: { select: { id: true, name_post: true } },
      },
    });

    const filteredRecruitments = recruitments.filter((r) =>
      this.matchesScope(scope, r.department),
    );

    const recruitmentIds = filteredRecruitments.map((r) => r.id);

    const applications = recruitmentIds.length
      ? await this.prismaService.application.findMany({
          where: { recruitment_infor_id: { in: recruitmentIds } },
          select: {
            recruitment_infor_id: true,
            status: true,
            created_at: true,
          },
        })
      : [];

    const acceptedByRecruitment = new Map<string, number>();
    for (const app of applications) {
      if (!this.isAcceptedStatus(app.status)) continue;
      acceptedByRecruitment.set(
        app.recruitment_infor_id,
        (acceptedByRecruitment.get(app.recruitment_infor_id) || 0) + 1,
      );
    }

    const monthBucket = new Map<
      string,
      { month: string; planned: number; hired: number }
    >();
    const monthCursor = new Date(
      startAt.getFullYear(),
      startAt.getMonth(),
      1,
      0,
      0,
      0,
      0,
    );
    while (monthCursor <= now) {
      const key = `${monthCursor.getFullYear()}-${monthCursor.getMonth()}`;
      monthBucket.set(key, {
        month: monthCursor.toLocaleString('en-US', { month: 'short' }),
        planned: 0,
        hired: 0,
      });
      monthCursor.setMonth(monthCursor.getMonth() + 1);
    }

    const byDepartmentMap = new Map<
      string,
      {
        department: string;
        recruitments: number;
        planned: number;
        hired: number;
      }
    >();
    const byPositionMap = new Map<
      string,
      { position: string; recruitments: number; planned: number; hired: number }
    >();
    const channelMap = new Map<string, number>();
    const activeBatches: Array<{
      title: string;
      recruitmentTitle: string;
      fromDate: string | null;
      toDate: string | null;
      target: number;
      daysLeft: number;
    }> = [];
    const byRecruitmentList: Array<{
      id: string;
      code: string;
      title: string;
      department: string;
      recruiter: string;
      position: string;
      planned: number;
      hired: number;
      remaining: number;
      fillRate: number;
      deadline: string | null;
      status: string;
    }> = [];

    let totalPlanned = 0;
    let totalHired = 0;

    for (const recruitment of filteredRecruitments) {
      const plans = Array.isArray(recruitment.recruitmentPlans)
        ? recruitment.recruitmentPlans
        : [];

      let planned = this.toNumber(recruitment.total_needed);
      if (planned <= 0 && plans.length > 0) {
        planned = plans.reduce((sum, plan) => {
          const batchTotal = (plan.recruitmentPlanChildBatches || []).reduce(
            (s, b) => s + this.toNumber(b.number_recruitment),
            0,
          );
          return (
            sum +
            (batchTotal > 0
              ? batchTotal
              : this.toNumber(plan.total_real_number))
          );
        }, 0);
      }
      if (planned <= 0) planned = 1;

      const hired = acceptedByRecruitment.get(recruitment.id) || 0;
      const remaining = Math.max(0, planned - hired);
      const fillRate = Number(((hired / planned) * 100).toFixed(1));

      totalPlanned += planned;
      totalHired += hired;

      const departmentName =
        recruitment.department?.full_name ||
        recruitment.department?.acronym_name ||
        'Unknown department';
      const positionName =
        recruitment.positionPost?.name_post || 'Unknown position';
      const recruiterName =
        recruitment.contactPerson?.employee_name || 'Unassigned';
      const deadline = recruitment.application_deadline
        ? new Date(recruitment.application_deadline).toISOString().split('T')[0]
        : null;

      byRecruitmentList.push({
        id: recruitment.id,
        code: recruitment.recruitment_code || '-',
        title:
          recruitment.post_title || recruitment.internal_title || 'Untitled',
        department: departmentName,
        recruiter: recruiterName,
        position: positionName,
        planned,
        hired,
        remaining,
        fillRate,
        deadline,
        status: recruitment.status || 'UNKNOWN',
      });

      if (!byDepartmentMap.has(departmentName)) {
        byDepartmentMap.set(departmentName, {
          department: departmentName,
          recruitments: 0,
          planned: 0,
          hired: 0,
        });
      }
      const dept = byDepartmentMap.get(departmentName)!;
      dept.recruitments += 1;
      dept.planned += planned;
      dept.hired += hired;

      if (!byPositionMap.has(positionName)) {
        byPositionMap.set(positionName, {
          position: positionName,
          recruitments: 0,
          planned: 0,
          hired: 0,
        });
      }
      const pos = byPositionMap.get(positionName)!;
      pos.recruitments += 1;
      pos.planned += planned;
      pos.hired += hired;

      for (const plan of plans) {
        for (const batch of plan.recruitmentPlanChildBatches || []) {
          const toDate = batch.to_date ? new Date(batch.to_date) : null;
          if (toDate && toDate >= now) {
            const daysLeft = Math.ceil(
              (toDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
            );
            activeBatches.push({
              title: batch.batches_title || 'Batch',
              recruitmentTitle:
                recruitment.post_title ||
                recruitment.internal_title ||
                'Untitled',
              fromDate: batch.from_date
                ? new Date(batch.from_date).toISOString().split('T')[0]
                : null,
              toDate: toDate.toISOString().split('T')[0],
              target: this.toNumber(batch.number_recruitment),
              daysLeft,
            });
          }
        }

        for (const posted of plan.recruitmentPlanChildPosteds || []) {
          const channel = (posted.job_board || 'Other').trim() || 'Other';
          channelMap.set(channel, (channelMap.get(channel) || 0) + 1);
        }
      }

      const createdAt = recruitment.created_at
        ? new Date(recruitment.created_at)
        : null;
      if (createdAt && !Number.isNaN(createdAt.getTime())) {
        const monthKey = `${createdAt.getFullYear()}-${createdAt.getMonth()}`;
        const monthData = monthBucket.get(monthKey);
        if (monthData) {
          monthData.planned += planned;
          monthData.hired += hired;
        }
      }
    }

    const byDepartment = Array.from(byDepartmentMap.values())
      .map((item) => ({
        ...item,
        fillRate:
          item.planned > 0
            ? Number(((item.hired / item.planned) * 100).toFixed(1))
            : 0,
      }))
      .sort((a, b) => b.planned - a.planned);

    const byPosition = Array.from(byPositionMap.values())
      .map((item) => ({
        ...item,
        fillRate:
          item.planned > 0
            ? Number(((item.hired / item.planned) * 100).toFixed(1))
            : 0,
      }))
      .sort((a, b) => b.planned - a.planned);

    const postingChannels = Array.from(channelMap.entries())
      .map(([channel, postCount]) => ({ channel, postCount }))
      .sort((a, b) => b.postCount - a.postCount);

    const sortedBatches = activeBatches
      .sort((a, b) => a.daysLeft - b.daysLeft)
      .slice(0, 10);

    return {
      generatedAt: new Date().toISOString(),
      period,
      scope,
      totals: {
        totalRecruitments: filteredRecruitments.length,
        totalPlanned,
        totalHired,
        totalRemaining: Math.max(0, totalPlanned - totalHired),
        fillRate:
          totalPlanned > 0
            ? Number(((totalHired / totalPlanned) * 100).toFixed(1))
            : 0,
      },
      byRecruitment: byRecruitmentList.slice(0, 20),
      byDepartment,
      byPosition,
      activeBatches: sortedBatches,
      postingChannels,
      trend: Array.from(monthBucket.values()),
    };
  }

async create(data: CreateRecruitmentInforDto, actor?: any) {
  const { plan, other_costs, skills, recruitment_code, ...rest } = data;

  return this.prismaService.$transaction(async (tx) => {
    const rec = await tx.recruitment_Infor.create({
      data: {
        ...rest,
        status: this.normalizeStatus(rest.status),
        application_deadline: data.application_deadline
          ? new Date(data.application_deadline)
          : undefined,
      },
    });

    if (other_costs?.length) {
      await tx.recruitment_Costs.createMany({
        data: other_costs.map((x) => ({
          recruitment_id: rec.id,
          cost_type: x.cost_type ?? null,
          amount: x.amount ?? null,
          currency: x.currency ?? 'VND',
        })),
      });
    }

    if (plan?.length) {
      for (const p of plan) {
        const {
          batches,
          postes,
          monthly_target,
          expected_deadline,
          ...parent
        } = p;

        const parentCreated = await tx.recruitment_Plan_Parent.create({
          data: {
            ...parent,
            recruitment_id: rec.id,
            monthly_target: monthly_target
              ? new Date(monthly_target)
              : undefined,
            expected_deadline: expected_deadline
              ? new Date(expected_deadline)
              : undefined,
          },
        });

        if (batches?.length) {
          await tx.recruitment_Plan_Child_Batches.createMany({
            data: batches.map((b) => {
              const { from_date, to_date, monthly_target, ...restBatch } = b;
              return {
                ...restBatch,
                recruitment_plan_parent_id: parentCreated.id,
                from_date: from_date ? new Date(from_date) : undefined,
                to_date: to_date ? new Date(to_date) : undefined,
                monthly_target: monthly_target
                  ? new Date(monthly_target)
                  : undefined,
              };
            }),
          });
        }

        if (postes?.length) {
          await tx.recruitment_Plan_Child_Posted.createMany({
            data: postes.map((po) => {
              const { posted_date, expiration_date, ...restPost } = po;
              return {
                ...restPost,
                recruitment_plan_parent_id: parentCreated.id,
                posted_date: posted_date ? new Date(posted_date) : undefined,
                expiration_date: expiration_date
                  ? new Date(expiration_date)
                  : undefined,
              };
            }),
          });
        }
      }
    }

    const companyId = this.getCompanyIdForCompanySkillSync(rec, actor);

    await this.syncRecruitmentSkills(
      tx,
      rec.id,
      rec.position_post_id,
      skills,
      companyId,
    );

    return tx.recruitment_Infor.findUnique({
      where: { id: rec.id },
      include: {
        recruitmentPlans: {
          include: {
            recruitmentPlanChildBatches: true,
            recruitmentPlanChildPosteds: true,
          },
        },
        recruitmentCosts: true,
        positionPost: {
          include: {
            group: true,
          },
        },
        recruitmentSkills: this.getRecruitmentSkillsInclude(),
        workLocation: { select: { id: true, full_name: true, short_address: true } },
      },
    });
  });
}

  async getAllWithRole(
    filter: RecruitmentInforFilterType,
    actor: any,
  ): Promise<RecruitmentInforPaginType> {
    const items_per_pages = Number(filter.items_per_pages) || 10;
    const pages = Number(filter.pages) || 1;
    const search = filter.search ? filter.search.trim() : '';
    const status = this.normalizeStatus(filter.status?.trim());
    const departmentId = filter.department_id?.trim();
    const workLocationId = filter.work_location_id?.trim();
    const positionPostId = filter.position_post_id?.trim();
    const positionGroupId = filter.position_group_id?.trim();
    const excludeId = filter.exclude_id?.trim();
    const skip = pages > 1 ? (pages - 1) * items_per_pages : 0;

    const where: any = {
      is_active: true,
    };

    const andFilters: any[] = [];

    if (search) {
      where.OR = [
        {
          recruitment_code: { contains: search, mode: 'insensitive' as const },
        },
        { internal_title: { contains: search, mode: 'insensitive' as const } },
        { post_title: { contains: search, mode: 'insensitive' as const } },
      ];
    }

    if (status && status.toUpperCase() !== 'ALL') {
      where.status = status;
    }

    if (departmentId && departmentId.toLowerCase() !== 'all') {
      where.department_id = departmentId;
    }

    if (workLocationId && workLocationId.toLowerCase() !== 'all') {
      where.work_location_id = workLocationId;
    }

    if (positionPostId && positionPostId.toLowerCase() !== 'all') {
      where.position_post_id = positionPostId;
    }

    if (positionGroupId && positionGroupId.toLowerCase() !== 'all') {
      andFilters.push({
        positionPost: {
          is: {
            group_id: positionGroupId,
          },
        },
      });
    }

    if (excludeId) {
      where.id = { not: excludeId };
    }

    if (andFilters.length) {
      where.AND = [...(Array.isArray(where.AND) ? where.AND : []), ...andFilters];
    }

    // Employer chỉ xem dữ liệu thuộc công ty của họ.
    this.applyEmployerCompanyScope(where, actor);

    const [recIn, total_items] = await Promise.all([
      this.prismaService.recruitment_Infor.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: items_per_pages,
        include: {
          recruitmentPlans: {
            include: {
              recruitmentPlanChildBatches: true,
              recruitmentPlanChildPosteds: true,
            },
          },
          recruitmentCosts: true, // chi phí khác
          department: {
            select: {
              id: true,
              full_name: true,
              image_logo: true,
              short_address: true,
            },
          },
          rank: { select: { id: true, name_rank: true } },
          workLocation: {
            select: {
              id: true,
              full_name: true,
              address: true,
              short_address: true,
              field_of_activity: true,
            },
          },
          contactPerson: { select: { id: true, employee_name: true } },
          positionPost: {
            include: {
              group: true,
            },
          },
          recruitmentSkills: this.getRecruitmentSkillsInclude(),
        },
      }),
      this.prismaService.recruitment_Infor.count({ where }),
    ]);

    return {
      total_items,
      current_pages: pages,
      data: recIn,
      items_per_pages,
    };
  }

  async getByID(id: string, actor?: any, source?: string): Promise<any | null> {
    const recruitment = await this.prismaService.recruitment_Infor.findFirst({
      where: { id },
      include: {
        recruitmentPlans: {
          include: {
            recruitmentPlanChildBatches: true,
            recruitmentPlanChildPosteds: true,
          },
        },
        recruitmentCosts: true,
        department: {
          select: {
            id: true,
            full_name: true,
            acronym_name: true,
            business_type: true,
            field_of_activity: true,
            description: true,
            employee_quantity: true,
            image_logo: true,
            address: true,
            short_address: true,
            phone_number: true,
            email: true,
            website: true,
            status: true,
          },
        },
        rank: { select: { id: true, name_rank: true } },
        workLocation: {
          select: {
            id: true,
            full_name: true,
            address: true,
            short_address: true,
            field_of_activity: true,
          },
        },
        contactPerson: { select: { id: true, employee_name: true } },
        positionPost: {
          include: {
            group: true,
          },
        },
        recruitmentSkills: this.getRecruitmentSkillsInclude(),
      },
    });

    if (!recruitment) return null;

    const skillMatch = await this.getRecommendationSkillMatch(
      id,
      actor,
      source,
    );

    return {
      ...recruitment,
      skill_match: skillMatch,
    };
  }

async update(id: string, data: UpdateRecruitmentInforDto, actor?: any) {
  const recInf = await this.prismaService.recruitment_Infor.findUnique({
    where: { id },
    select: { id: true, status: true, is_active: true },
  });
  if (!recInf)
    throw new HttpException(
      'This position is not found',
      HttpStatus.BAD_REQUEST,
    );

  const { other_costs, plan, skills, ...info } = data;

  const dataUpdate: any = { ...info };
  dataUpdate.status = this.normalizeStatus(dataUpdate.status);

  dataUpdate.is_active = true;

  try {
    return await this.prismaService.$transaction(async (tx) => {
    await tx.recruitment_Infor.update({
      where: { id },
      data: {
        ...dataUpdate,
        updated_at: new Date(),
        application_deadline: data.application_deadline
          ? new Date(data.application_deadline)
          : undefined,
      },
    });

    if (other_costs) {
      await tx.recruitment_Costs.deleteMany({
        where: { recruitment_id: id },
      });
      if (other_costs.length) {
        await tx.recruitment_Costs.createMany({
          data: other_costs.map((x) => ({
            recruitment_id: id,
            cost_type: x.cost_type ?? null,
            amount: x.amount ?? null,
            currency: x.currency ?? 'VND',
          })),
        });
      }
    }

    if (plan) {
      await tx.recruitment_Plan_Parent.deleteMany({
        where: { recruitment_id: id },
      });

      for (const p of plan) {
        const {
          batches,
          postes,
          monthly_target,
          expected_deadline,
          ...parent
        } = p;

        const parentCreated = await tx.recruitment_Plan_Parent.create({
          data: {
            ...parent,
            recruitment_id: id,
            monthly_target: monthly_target
              ? new Date(monthly_target)
              : undefined,
            expected_deadline: expected_deadline
              ? new Date(expected_deadline)
              : undefined,
          },
        });

        if (batches?.length) {
          await tx.recruitment_Plan_Child_Batches.createMany({
            data: batches.map((b) => {
              const { from_date, to_date, monthly_target, ...restBatch } = b;
              return {
                ...restBatch,
                recruitment_plan_parent_id: parentCreated.id,
                from_date: from_date ? new Date(from_date) : undefined,
                to_date: to_date ? new Date(to_date) : undefined,
                monthly_target: monthly_target
                  ? new Date(monthly_target)
                  : undefined,
              };
            }),
          });
        }

        if (postes?.length) {
          await tx.recruitment_Plan_Child_Posted.createMany({
            data: postes.map((po) => {
              const { posted_date, expiration_date, ...restPost } = po;
              return {
                ...restPost,
                recruitment_plan_parent_id: parentCreated.id,
                posted_date: posted_date ? new Date(posted_date) : undefined,
                expiration_date: expiration_date
                  ? new Date(expiration_date)
                  : undefined,
              };
            }),
          });
        }
      }
    }

    const rec = await tx.recruitment_Infor.findUnique({
      where: { id },
      select: {
        id: true,
        department_id: true,
        position_post_id: true,
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
    });

    const companyId = this.getCompanyIdForCompanySkillSync(rec, actor);

    await this.syncRecruitmentSkills(
      tx,
      id,
      rec?.position_post_id,
      skills,
      companyId,
    );

    return tx.recruitment_Infor.findUnique({
      where: { id },
      include: {
        recruitmentPlans: {
          include: {
            recruitmentPlanChildBatches: true,
            recruitmentPlanChildPosteds: true,
          },
        },
        recruitmentCosts: true,
        workLocation: {
          select: {
            id: true,
            full_name: true,
            address: true,
            short_address: true,
            field_of_activity: true,
          },
        },
        positionPost: {
          include: {
            group: true,
          },
        },
        recruitmentSkills: this.getRecruitmentSkillsInclude(),
      },
    });
  });
  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new HttpException(
          'Duplicate data detected while updating recruitment posting. Please check unique fields (for example batch title) and try again.',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (error.code === 'P2003') {
        throw new HttpException(
          'Related data is invalid or missing (rank, position, department, or contact person).',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    throw new HttpException(
      error?.message || 'Failed to update recruitment posting.',
      HttpStatus.BAD_REQUEST,
    );
  }
}

  async delete(id: string): Promise<Recruitment_Infor> {
    return this.prismaService.recruitment_Infor.update({
      where: { id },
      data: { is_active: false },
    });
  }
}
