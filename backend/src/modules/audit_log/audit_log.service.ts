import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

export type CandidateAuditActor = {
  actorEmployeeId?: string;
  actorRole?: string;
  roles?: string[];
  company_id?: string | null;
  actorType?: 'Employee' | 'System';
};

export type CandidateAuditInput = CandidateAuditActor & {
  candidateId: string;
  action: string;
  message: string;
  metadata?: Record<string, any>;
};

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  private get delegate() {
    return (this.prisma as any).candidateAuditLog;
  }

  async logCandidateActivity(input: CandidateAuditInput) {
    const actorType = input.actorType || 'System';

    return this.delegate.create({
      data: {
        candidate_id: input.candidateId,
        actor_employee_id: input.actorEmployeeId,
        actor_role: input.actorRole,
        actor_type: actorType,
        action: input.action,
        message: input.message,
        metadata: input.metadata,
      },
    });
  }

  async getCandidateHistory(candidateId: string, page = 1, limit = 20) {
    const safePage = Number.isFinite(page) && page > 0 ? page : 1;
    const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 20;
    const skip = (safePage - 1) * safeLimit;

    const [data, total_items] = await Promise.all([
      this.delegate.findMany({
        where: { candidate_id: candidateId },
        include: {
          actorEmployee: {
            select: {
              id: true,
              employee_name: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: safeLimit,
      }),
      this.delegate.count({ where: { candidate_id: candidateId } }),
    ]);

    return {
      data,
      current_pages: safePage,
      items_per_pages: safeLimit,
      total_items,
    };
  }
}
