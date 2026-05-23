import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "src/prisma.service";

@Injectable()
export class CompanyFollowService {
  constructor(private readonly prisma: PrismaService) {}

  private async resolveCandidateIdFromEmployee(employeeId: string) {
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
      throw new NotFoundException("Employee account not found");
    }

    let candidate = await this.prisma.candidate.findFirst({
      where: {
        OR: [
          { email: employee.email_account || undefined },
          { phone_number: employee.phone_account || undefined },
        ],
      },
      select: { id: true },
    });

    if (!candidate) {
      candidate = await this.prisma.candidate.create({
        data: {
          candidate_name:
            employee.employee_name || employee.email_account || employee.phone_account,
          email: employee.email_account,
          phone_number: employee.phone_account,
          employee_id: employee.id,
          status: "Active",
          is_active: true,
          date_applied: new Date(),
        },
        select: { id: true },
      });
    }

    return candidate.id;
  }

  async followCompanyByEmployee(employeeId: string, companyId: string) {
    const candidateId = await this.resolveCandidateIdFromEmployee(employeeId);

    const company = await this.prisma.inforCompany.findUnique({
      where: { id: companyId },
      select: { id: true, full_name: true },
    });

    if (!company) {
      throw new NotFoundException("Company not found");
    }

    const existed = await this.prisma.companyFollow.findUnique({
      where: {
        candidate_id_company_id: {
          candidate_id: candidateId,
          company_id: companyId,
        },
      },
    });

    if (existed) {
      throw new BadRequestException("You already follow this company");
    }

    await this.prisma.companyFollow.create({
      data: {
        candidate_id: candidateId,
        company_id: companyId,
      },
    });

    const followerCount = await this.prisma.companyFollow.count({
      where: { company_id: companyId },
    });

    return {
      message: "Followed company successfully",
      is_following: true,
      follower_count: followerCount,
      company_id: companyId,
    };
  }

  async unfollowCompanyByEmployee(employeeId: string, companyId: string) {
    const candidateId = await this.resolveCandidateIdFromEmployee(employeeId);

    const existed = await this.prisma.companyFollow.findUnique({
      where: {
        candidate_id_company_id: {
          candidate_id: candidateId,
          company_id: companyId,
        },
      },
    });

    if (!existed) {
      throw new NotFoundException("Follow record not found");
    }

    await this.prisma.companyFollow.delete({
      where: {
        candidate_id_company_id: {
          candidate_id: candidateId,
          company_id: companyId,
        },
      },
    });

    const followerCount = await this.prisma.companyFollow.count({
      where: { company_id: companyId },
    });

    return {
      message: "Unfollowed company successfully",
      is_following: false,
      follower_count: followerCount,
      company_id: companyId,
    };
  }

  async getFollowStatusByEmployee(employeeId: string, companyId: string) {
    const candidateId = await this.resolveCandidateIdFromEmployee(employeeId);

    const follow = await this.prisma.companyFollow.findUnique({
      where: {
        candidate_id_company_id: {
          candidate_id: candidateId,
          company_id: companyId,
        },
      },
    });

    return {
      company_id: companyId,
      is_following: !!follow,
    };
  }

  async getFollowerCount(companyId: string) {
    const company = await this.prisma.inforCompany.findUnique({
      where: { id: companyId },
      select: { id: true },
    });

    if (!company) {
      throw new NotFoundException("Company not found");
    }

    const followerCount = await this.prisma.companyFollow.count({
      where: { company_id: companyId },
    });

    return {
      company_id: companyId,
      follower_count: followerCount,
    };
  }

  async getFollowSummaryByEmployee(employeeId: string, companyId: string) {
    const candidateId = await this.resolveCandidateIdFromEmployee(employeeId);

    const [follow, followerCount] = await Promise.all([
      this.prisma.companyFollow.findUnique({
        where: {
          candidate_id_company_id: {
            candidate_id: candidateId,
            company_id: companyId,
          },
        },
      }),
      this.prisma.companyFollow.count({
        where: { company_id: companyId },
      }),
    ]);

    return {
      company_id: companyId,
      is_following: !!follow,
      follower_count: followerCount,
    };
  }
}