import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import {
  buildRecruitmentCompanyWhere,
  getDashboardPeriodStart,
  isAcceptedApplicationStatus,
  isDashboardScopeMatch,
  resolveDashboardCompanyId,
  type DashboardReportPeriod,
  type DashboardReportScope,
} from '../../common/utils/dashboard-filters.util';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(
    query: {
      companyId?: string;
      period?: DashboardReportPeriod;
      scope?: DashboardReportScope;
    },
    actor?: any,
  ) {
    const period = query?.period || 'month';
    const scope = query?.scope || 'all';
    const resolvedCompanyId = resolveDashboardCompanyId(actor, query?.companyId);
    const startAt = getDashboardPeriodStart(period);

    const recruitmentWhere = buildRecruitmentCompanyWhere(resolvedCompanyId);

    const recruitments = await this.prisma.recruitment_Infor.findMany({
      where: recruitmentWhere,
      select: {
        id: true,
        is_active: true,
        created_at: true,
        department: {
          select: {
            id: true,
            full_name: true,
            acronym_name: true,
          },
        },
      },
    });

    const scopedRecruitments = recruitments.filter((item) =>
      isDashboardScopeMatch(scope, item.department),
    );

    const activeCampaigns = scopedRecruitments.filter((item) => {
      if (!item.is_active) return false;
      const createdAt = item.created_at ? new Date(item.created_at) : null;
      return createdAt ? createdAt >= startAt : false;
    }).length;

    const recruitmentIds = scopedRecruitments.map((item) => item.id);

    const applications =
      recruitmentIds.length > 0
        ? await this.prisma.application.findMany({
            where: {
              recruitment_infor_id: { in: recruitmentIds },
              created_at: { gte: startAt },
            },
            select: {
              status: true,
            },
          })
        : [];

    const totalApplications = applications.length;
    const acceptedCandidates = applications.filter((item) =>
      isAcceptedApplicationStatus(item.status),
    ).length;

    return {
      period,
      scope,
      companyId: resolvedCompanyId ?? null,
      activeCampaigns,
      totalRecruitments: activeCampaigns,
      totalApplications,
      acceptedCandidates,
      generatedAt: new Date().toISOString(),
    };
  }
}
