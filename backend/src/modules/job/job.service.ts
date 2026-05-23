import { HttpException, HttpStatus, Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { Job } from '@prisma/client';
import { generateCode } from 'src/common/utils/generate-code.util';
import { JOB_STATUS } from 'src/constant';
import { PrismaService } from 'src/prisma.service';
import { AuditLogService, type CandidateAuditActor } from '../audit_log/audit_log.service';
import { CreateJobDto } from './dto/create';
import { JobFilterType } from './dto/filter_type';
import { JobPaginType } from './dto/pagin_type';
import { UpdateJobDto } from './dto/update';

@Injectable()
export class JobService {
  constructor(
    private prisma: PrismaService,
    private auditLogService: AuditLogService,
  ) {}

  private normalizeJobStatus(status?: string | null) {
    const normalized = (status ?? '').trim().toLowerCase();

    if (!normalized) return JOB_STATUS.IN_PROGRESS;

    if (
      [
        'completed',
        'done',
        'closed',
        'inactive',
      ].includes(normalized)
    ) {
      return JOB_STATUS.COMPLETED;
    }

    if (
      [
        'in progress',
        'in_progress',
        'inprogress',
        'pending',
        'active',
      ].includes(normalized)
    ) {
      return JOB_STATUS.IN_PROGRESS;
    }

    return JOB_STATUS.IN_PROGRESS;
  }

  private readonly jobCandidateInclude = {
    candidate: {
      include: {
        statusApplication: {
          include: {
            recruitment_infor: {
              select: {
                id: true,
                post_title: true,
                internal_title: true,
                department: {
                  select: {
                    id: true,
                    full_name: true,
                    acronym_name: true,
                  },
                },
              },
            },
          },
        },
      },
    },
  };

  private async logForCandidates(
    candidateIds: string[],
    action: string,
    message: string,
    metadata?: Record<string, any>,
    actor?: CandidateAuditActor,
  ) {
    const uniqueCandidateIds = [...new Set(candidateIds.filter(Boolean))];
    await Promise.all(
      uniqueCandidateIds.map((candidateId) =>
        this.auditLogService.logCandidateActivity({
          candidateId,
          action,
          message,
          metadata,
          ...actor,
        }),
      ),
    );
  }

  private getActorRoles(actor?: any): string[] {
    if (!actor) return [];
    if (Array.isArray(actor.roles)) {
      return actor.roles;
    }
    if (typeof actor.actorRole === 'string') {
      return [actor.actorRole];
    }
    return [];
  }

  private getScopedCompanyId(actor?: any): string | null {
    const roles = this.getActorRoles(actor).map((r) => r.toLowerCase());
    const isAdmin = roles.includes('admin');
    const isEmployer = roles.includes('employer');

    if (isAdmin) return null;
    if (actor?.company_id) return actor.company_id;

    if (isEmployer) {
      throw new ForbiddenException('No company_id for employer');
    }

    return null;
  }

  private getJobCompanyScopeCondition(companyId: string | null) {
    if (!companyId) {
      return {};
    }
    return {
      company_id: companyId,
    };
  }

  async create(data: CreateJobDto, actor?: CandidateAuditActor) {
    const { candidate_ids, job_code, ...rest } = data;
    const normalizedStatus = this.normalizeJobStatus(rest.status ?? rest.result_job ?? null);

    let finalCode = job_code;

    if (!job_code) {
      const lastRecord = await this.prisma.job.findFirst({
        where: {
          job_code: {
            not: null,
            startsWith: 'JOB_',
          },
        },
        orderBy: { created_at: 'desc' },
        select: { job_code: true },
      });

      let nextNumber = 1;
      const last = lastRecord?.job_code;

      if (last) {
        const match = last.match(/^JOB_(\d+)$/);
        if (match) {
          nextNumber = Number(match[1]) + 1;
        }
      }

      finalCode = generateCode('JOB', nextNumber);
    }

    const created = await this.prisma.job.create({
      data: {
        ...rest,
        status: normalizedStatus,
        job_code: finalCode,
        deadline: rest.deadline ? new Date(rest.deadline) : null,
        
        jobCandidates: candidate_ids
          ? {
              create: candidate_ids.map((id) => ({
                candidate_id: id,
              })),
            }
          : undefined,
      },
      include: {
        employee: true,
        jobCandidates: {
          include: this.jobCandidateInclude,
        },
      },
    });

    const candidateIds = created.jobCandidates.map((x) => x.candidate_id);
    await this.logForCandidates(
      candidateIds,
      'JOB_CREATED_FOR_CANDIDATE',
      'Assigned candidate to a new job',
      {
        job_id: created.id,
        job_name: created.name_job,
        status: created.status,
      },
      actor,
    );

    return created;
  }

  async getAll(params: JobFilterType, actor?: CandidateAuditActor): Promise<JobPaginType> {
    const {
      search,
      pages = 1,
      items_per_pages = 10,
    } = params;

    const skip = (pages - 1) * items_per_pages;
    const companyId = this.getScopedCompanyId(actor);

    const whereCondition: any = {
      is_active: true,
      ...this.getJobCompanyScopeCondition(companyId),
    };

    if (search) {
      whereCondition.OR = [
        {
          job_code: { contains: search, mode: 'insensitive' },
        },
        {
          name_job: { contains: search, mode: 'insensitive' },
        },
        {
          status: { contains: search, mode: 'insensitive' },
        },
      ];
    }

    const [data, total_items] = await Promise.all([
      this.prisma.job.findMany({
        where: whereCondition,
        skip,
        take: items_per_pages,
        orderBy: { created_at: 'desc' },
        include: {
          employee: true,
          jobCandidates: {
            include: this.jobCandidateInclude,
          },
        },
      }),
      this.prisma.job.count({
        where: whereCondition,
      }),
    ]);

    return {
      data,
      current_pages: pages,
      items_per_pages,
      total_items,
    };
  }
  async getById(id: string): Promise<Job | null> {
    return this.prisma.job.findUnique({
      where: { id },
      include: {
        employee: true,
        jobCandidates: {
          include: this.jobCandidateInclude,
        },
      },
    });
  }
 async update(id: string, body: UpdateJobDto, actor?: CandidateAuditActor) {
  const { candidate_ids, ...rest } = body;
  let beforeCandidateIds: string[] = [];
  let beforeJobStatus: string | null = null;
  let beforeJobName: string | null = null;

  const updated = await this.prisma.$transaction(async (tx) => {

    // 🔥 Kiểm tra tồn tại
    const job = await tx.job.findUnique({
      where: { id },
      select: { id: true, is_active: true, status: true, name_job: true },
    });

    if (!job) {
      throw new HttpException(
        'Công việc không tồn tại',
        HttpStatus.BAD_REQUEST,
      );
    }

    beforeJobStatus = job.status;
    beforeJobName = job.name_job;

    const dataUpdate: any = { ...rest };

    const hasStatusField = Object.prototype.hasOwnProperty.call(rest, 'status');
    const hasResultJobField = Object.prototype.hasOwnProperty.call(rest, 'result_job');

    if (hasStatusField || hasResultJobField) {
      dataUpdate.status = this.normalizeJobStatus(rest.status ?? rest.result_job ?? null);
    }

    const beforeLinks = await tx.job_Candidates.findMany({
      where: { job_id: id },
      select: { candidate_id: true },
    });
    beforeCandidateIds = beforeLinks.map((x) => x.candidate_id);

    // 🔥 Update job chính
    await tx.job.update({
      where: { id },
      data: {
        ...dataUpdate,
        deadline: dataUpdate.deadline
          ? new Date(dataUpdate.deadline)
          : undefined,
        updated_at: new Date(),
      },
    });

    // 🔥 Update lại candidate nếu có
    if (candidate_ids) {
      await tx.job_Candidates.deleteMany({
        where: { job_id: id },
      });

      await tx.job_Candidates.createMany({
        data: candidate_ids.map((canId) => ({
          job_id: id,
          candidate_id: canId,
        })),
      });
    }

    const updatedJob = await tx.job.findUnique({
      where: { id },
      include: {
        employee: true,
        jobCandidates: {
          include: this.jobCandidateInclude,
        },
      },
    });

    return updatedJob;
  });

  if (updated) {
    const afterCandidateIds = updated.jobCandidates.map((x) => x.candidate_id);
    const affectedCandidateIds = [...new Set([...beforeCandidateIds, ...afterCandidateIds])];

    await this.logForCandidates(
      affectedCandidateIds,
      'JOB_UPDATED_FOR_CANDIDATE',
      'Updated candidate job',
      {
        job_id: updated.id,
        old_job_name: beforeJobName,
        new_job_name: updated.name_job,
        old_status: beforeJobStatus,
        new_status: updated.status,
      },
      actor,
    );
  }

  return updated;
}

  async delete(id: string, actor?: CandidateAuditActor): Promise<Job> {
    const before = await this.prisma.job.findUnique({
      where: { id },
      include: {
        jobCandidates: {
          select: {
            candidate_id: true,
          },
        },
      },
    });

    const deleted = await this.prisma.job.update({
      where: { id },
      data: {
        is_active: false,
        updated_at: new Date()
      },
    });

    if (before) {
      const candidateIds = before.jobCandidates.map((x) => x.candidate_id);
      await this.logForCandidates(
        candidateIds,
        'JOB_DELETED_FOR_CANDIDATE',
        'Removed candidate job',
        {
          job_id: before.id,
          job_name: before.name_job,
          status: before.status,
        },
        actor,
      );
    }

    return deleted;
  }
}