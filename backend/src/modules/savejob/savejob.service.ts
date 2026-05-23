import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class SavejobService {
  constructor(private readonly prisma: PrismaService) {}

  private async getNextCandidateCode() {
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

    return `CA_${String(nextNumber).padStart(4, '0')}`;
  }

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
      throw new NotFoundException('Employee account not found');
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
      const candidateCode = await this.getNextCandidateCode();
      candidate = await this.prisma.candidate.create({
        data: {
          candidate_code: candidateCode,
          candidate_name: employee.employee_name || employee.email_account || employee.phone_account,
          email: employee.email_account,
          phone_number: employee.phone_account,
          employee_id: employee.id,
          status: 'Active',
          is_active: true,
          date_applied: new Date(),
        },
        select: { id: true },
      });
    }

    return candidate.id;
  }

  async toggleSaveJobByEmployee(employeeId: string, recruitmentInforId: string) {
    const candidateId = await this.resolveCandidateIdFromEmployee(employeeId);
    return this.toggleSaveJob(candidateId, recruitmentInforId);
  }

  async getMySavedJobsByEmployee(employeeId: string) {
    const candidateId = await this.resolveCandidateIdFromEmployee(employeeId);
    return this.getMySavedJobs(candidateId);
  }

  async checkSavedByEmployee(employeeId: string, recruitmentInforId: string) {
    const candidateId = await this.resolveCandidateIdFromEmployee(employeeId);
    return this.checkSaved(candidateId, recruitmentInforId);
  }

  async toggleSaveJob(candidateId: string, recruitmentInforId: string) {
    const recruitment = await this.prisma.recruitment_Infor.findUnique({
      where: { id: recruitmentInforId },
      select: { id: true, is_active: true, post_title: true },
    });

    if (!recruitment) {
      throw new NotFoundException('Tin tuyển dụng không tồn tại');
    }

    const existing = await this.prisma.savedJRecruitment.findUnique({
      where: {
        candidate_id_recruitment_infor_id: {
          candidate_id: candidateId,
          recruitment_infor_id: recruitmentInforId,
        },
      },
    });

    if (existing) {
      await this.prisma.savedJRecruitment.delete({
        where: { id: existing.id },
      });

      return {
        saved: false,
        message: 'Đã bỏ lưu tin tuyển dụng',
      };
    }

    await this.prisma.savedJRecruitment.create({
      data: {
        candidate_id: candidateId,
        recruitment_infor_id: recruitmentInforId,
      },
    });

    return {
      saved: true,
      message: 'Đã lưu tin tuyển dụng',
    };
  }

  async getMySavedJobs(candidateId: string) {
    const items = await this.prisma.savedJRecruitment.findMany({
      where: { candidate_id: candidateId },
      orderBy: { created_at: 'desc' },
      include: {
        recruitment_infor: {
          include: {
            savedJRecruitments: true, // sửa theo relation thực tế của 
            rank: {
              select: {
                name_rank: true,
              },
            },
            department: {
              select: {
                id: true,
                full_name: true,
                acronym_name: true,
                image_logo: true,
                short_address: true,
              },
            },
            workLocation: {
              select: {
                id: true,
                full_name: true,
                acronym_name: true,
                address: true,
                short_address: true,
              },
            },
          },
        },
      },
    });

    return items;
  }

  async checkSaved(candidateId: string, recruitmentInforId: string) {
    const existing = await this.prisma.savedJRecruitment.findUnique({
      where: {
        candidate_id_recruitment_infor_id: {
          candidate_id: candidateId,
          recruitment_infor_id: recruitmentInforId,
        },
      },
      select: { id: true },
    });

    return {
      saved: !!existing,
    };
  }
}
