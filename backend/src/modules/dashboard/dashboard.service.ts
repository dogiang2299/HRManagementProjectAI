import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  private getActorRoles(actor?: any): string[] {
    if (!actor) return [];
    if (Array.isArray(actor.roles)) {
      return actor.roles.filter((r: unknown) => typeof r === 'string') as string[];
    }
    if (typeof actor.actorRole === 'string') {
      return [actor.actorRole];
    }
    return [];
  }

  private getCompanyIdForDashboard(actor?: any, requestedCompanyId?: string): string | undefined {
    const roles = this.getActorRoles(actor).map((r) => r.toLowerCase());
    const isEmployer = roles.includes('employer');

    if (isEmployer) {
      if (!actor?.company_id) {
        throw new ForbiddenException('No company_id for employer');
      }
      return actor.company_id;
    }

    return requestedCompanyId;
  }

  async getOverview(companyId?: string, actor?: any) {
    const resolvedCompanyId = this.getCompanyIdForDashboard(actor, companyId);

    // Filter recruitment theo công ty
    const recruitmentWhere: any = resolvedCompanyId
      ? {
          OR: [
            { department_id: resolvedCompanyId },
            { work_location_id: resolvedCompanyId },
            { positionPost: { is: { unit_id: resolvedCompanyId } } },
            { contactPerson: { is: { company_id: resolvedCompanyId } } },
          ],
        }
      : {};

    const recruitments = await this.prisma.recruitment_Infor.findMany({
      where: recruitmentWhere,
      include: { recruitmentCosts: true, recruitmentPlans: true, positionPost: true },
    });

    // Lấy danh sách recruitmentId để filter application
    const recruitmentIds = recruitments.map((r) => r.id);

    const applications = await this.prisma.application.findMany({
      where: recruitmentIds.length ? { recruitment_infor_id: { in: recruitmentIds } } : undefined,
    });

    // TODO: Tính toán các số liệu tổng quan ở đây (statCards, applicationStatusData, ...)
    // Demo trả về số lượng
    return {
      totalRecruitments: recruitments.length,
      totalApplications: applications.length,
      // ...thêm các trường khác theo nhu cầu frontend
    };
  }
}
