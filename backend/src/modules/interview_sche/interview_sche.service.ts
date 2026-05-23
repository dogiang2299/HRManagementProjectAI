import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Interview_Schedule } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { CreateInterviewScheduleDto } from './dto/create';
import { UpdateInterviewScheduleDto } from './dto/update';
import { InterviewFilterType } from './dto/filter_type';
import { InterviewPaginType } from './dto/pagin_type';
import { generateCode } from 'src/common/utils/generate-code.util';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class InterviewScheService {
  constructor(
    private prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}
  private readonly PENDING_EXPIRED_HOURS = 48;

  private readonly TEMPORARILY_UNAVAILABLE_MESSAGE =
    'The candidate is temporarily unavailable during this time slot. Please choose another time.';

  private readonly UNAVAILABLE_MESSAGE =
    'The candidate is unavailable during this time slot. Please choose another time.';

  private getEndTime(startTime: Date, durationMinutes: number): Date {
    return new Date(startTime.getTime() + durationMinutes * 60 * 1000);
  }

  private isPendingScheduleStillValid(expiredAt?: Date | null): boolean {
    if (!expiredAt) return true;
    return expiredAt.getTime() > Date.now();
  }
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

  private getScopedCompanyId(actor?: any): string | null {
    const roles = this.getActorRoles(actor).map((r) => r.toLowerCase());
    const isEmployer = roles.includes('employer');

    if (isEmployer) {
      if (actor?.company_id) return actor.company_id;
      throw new ForbiddenException('No company_id for employer');
    }

    return null;
  }

  private getRecruitmentCompanyScopeCondition(companyId: string) {
    return {
      OR: [
        { department_id: companyId },
        { work_location_id: companyId },
        { positionPost: { is: { unit_id: companyId } } },
        { contactPerson: { is: { company_id: companyId } } },
      ],
    };
  }

  private getInterviewCompanyScopeCondition(companyId: string) {
    return {
      company_id: companyId,
    };
  }

  private async assertScheduleInCompanyScope(
    scheduleId: string,
    companyId: string,
  ) {
    const matched = await this.prisma.interview_Schedule.findFirst({
      where: {
        id: scheduleId,
        ...this.getInterviewCompanyScopeCondition(companyId),
      },
      select: { id: true },
    });

    if (!matched) {
      throw new ForbiddenException(
        'You can only manage schedules in your company.',
      );
    }
  }

  private async assertCandidatesInCompanyScope(
    candidateIds: string[] | undefined,
    companyId: string | null,
  ) {
    if (!companyId || !candidateIds?.length) return;

    const uniqueCandidateIds = Array.from(new Set(candidateIds));
    const matchedCount = await this.prisma.candidate.count({
      where: {
        id: { in: uniqueCandidateIds },
        statusApplication: {
          some: {
            recruitment_infor:
              this.getRecruitmentCompanyScopeCondition(companyId),
          },
        },
      },
    });

    if (matchedCount !== uniqueCandidateIds.length) {
      throw new ForbiddenException(
        'You can only schedule candidates in your company.',
      );
    }
  }

  private async getRecruitmentCompanyId(recruitmentInforId?: string | null) {
    if (!recruitmentInforId) return null;

    const recruitment = await this.prisma.recruitment_Infor.findUnique({
      where: { id: recruitmentInforId },
      select: {
        department_id: true,
        work_location_id: true,
        positionPost: {
          select: {
            unit_id: true,
          },
        },
        contactPerson: {
          select: {
            company_id: true,
          },
        },
      },
    });

    if (!recruitment) {
      throw new BadRequestException('Không tìm thấy tin tuyển dụng.');
    }

    return (
      recruitment.department_id ||
      recruitment.work_location_id ||
      recruitment.positionPost?.unit_id ||
      recruitment.contactPerson?.company_id ||
      null
    );
  }

  private async assertCandidatesMatchRecruitment(
    candidateIds: string[] | undefined,
    recruitmentInforId?: string | null,
  ) {
    if (!candidateIds?.length || !recruitmentInforId) return;

    const uniqueCandidateIds = Array.from(new Set(candidateIds));
    const matchedCount = await this.prisma.application.count({
      where: {
        candidate_id: { in: uniqueCandidateIds },
        recruitment_infor_id: recruitmentInforId,
      },
    });

    if (matchedCount !== uniqueCandidateIds.length) {
      throw new ForbiddenException(
        'You can only schedule candidates who applied to the selected job.',
      );
    }
  }

  private async getScheduleNotificationTargets(
    candidateIds: string[] | undefined,
    recruitmentInforId?: string | null,
  ) {
    if (!candidateIds?.length) return [];

    const uniqueCandidateIds = Array.from(new Set(candidateIds));

    if (!recruitmentInforId) {
      return uniqueCandidateIds.map((candidateId) => ({
        candidateId,
        applicationId: null,
        jobTitle: null,
      }));
    }

    const applications = await this.prisma.application.findMany({
      where: {
        candidate_id: { in: uniqueCandidateIds },
        recruitment_infor_id: recruitmentInforId,
      },
      select: {
        id: true,
        candidate_id: true,
        recruitment_infor: {
          select: {
            post_title: true,
            internal_title: true,
            positionPost: {
              select: {
                name_post: true,
              },
            },
          },
        },
      },
    });

    const applicationByCandidateId = new Map(
      applications.map((application) => [
        application.candidate_id,
        application,
      ]),
    );

    return uniqueCandidateIds.map((candidateId) => {
      const application = applicationByCandidateId.get(candidateId);

      return {
        candidateId,
        applicationId: application?.id || null,
        jobTitle:
          application?.recruitment_infor?.post_title ||
          application?.recruitment_infor?.internal_title ||
          application?.recruitment_infor?.positionPost?.name_post ||
          null,
      };
    });
  }

  private async notifyCandidatesInterviewScheduleCreated(params: {
    candidateIds: string[] | undefined;
    recruitmentInforId?: string | null;
    schedule: Interview_Schedule;
    action?: "created" | "updated";
  }) {
    const targets = await this.getScheduleNotificationTargets(
      params.candidateIds,
      params.recruitmentInforId,
    );

    if (!targets.length) return;

    await Promise.all(
      targets.map((target) =>
        this.notificationService.notifyInterviewScheduleCreated({
          candidateId: target.candidateId,
          applicationId: target.applicationId,
          jobTitle: target.jobTitle,
          interviewTime: params.schedule.times,
          interviewLocation: params.schedule.interview_location,
          interviewRoom: params.schedule.interview_room,
          meetingLink: params.schedule.meeting_link,
          action: params.action,
        }),
      ),
    );
  }

  private getCandidateWithApplicationInclude(companyId?: string | null) {
    return {
      candidate: {
        include: {
          statusApplication: {
            where: companyId
              ? {
                  recruitment_infor:
                    this.getRecruitmentCompanyScopeCondition(companyId),
                }
              : undefined,
            include: {
              recruitment_infor: {
                select: {
                  id: true,
                  post_title: true,
                  internal_title: true,
                  positionPost: {
                    select: {
                      id: true,
                      name_post: true,
                    },
                  },
                  department: {
                    select: {
                      id: true,
                      full_name: true,
                      acronym_name: true,
                    },
                  },
                  workLocation: {
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
  }

  async create(data: CreateInterviewScheduleDto, actor?: any) {
    const {
      sche_code,
      candidate_ids,
      recruitment_infor_id,
      company_id,
      ...rest
    } = data;

    const startTime = rest.times ? new Date(rest.times) : null;

    await this.checkCandidateAvailability(
      candidate_ids,
      startTime,
      rest.time_duration,
    );

    let finalCode = sche_code;

    if (!sche_code) {
      const lastRecord = await this.prisma.interview_Schedule.findFirst({
        where: {
          sche_code: {
            not: null,
            startsWith: 'INT_',
          },
        },
        orderBy: {
          created_at: 'desc',
        },
        select: { sche_code: true },
      });

      let nextNumber = 1;
      const last = lastRecord?.sche_code;

      if (last) {
        const match = last.match(/^INT_(\d+)$/);
        if (match) {
          nextNumber = Number(match[1]) + 1;
        }
      }

      finalCode = generateCode('INT', nextNumber);
    }

    const expiredAt = new Date(
      Date.now() + this.PENDING_EXPIRED_HOURS * 60 * 60 * 1000,
    );

    const scopedCompanyId = this.getScopedCompanyId(actor);
    const recruitmentCompanyId =
      await this.getRecruitmentCompanyId(recruitment_infor_id);
    const companyId = scopedCompanyId || company_id || recruitmentCompanyId;

    if (
      scopedCompanyId &&
      recruitmentCompanyId &&
      scopedCompanyId !== recruitmentCompanyId
    ) {
      throw new ForbiddenException(
        'You can only schedule interviews for your company.',
      );
    }

    await this.assertCandidatesMatchRecruitment(candidate_ids, recruitment_infor_id);
    await this.assertCandidatesInCompanyScope(candidate_ids, scopedCompanyId);

    const schedule = await this.prisma.interview_Schedule.create({
      data: (
        {
          ...rest,
          sche_code: finalCode,
          status: 'PENDING',
          expired_at: expiredAt,
          interview_date: rest.interview_date ? new Date(rest.interview_date) : null,
          times: rest.times ? new Date(rest.times) : null,
          company_id: companyId,
          candidates: candidate_ids
            ? {
                create: candidate_ids.map((id) => ({
                  candidate_id: id,
                })),
              }
            : undefined,
        } as any
      ),
      include: {
        InforCompany: {
          select: {
            id: true,
            full_name: true,
            acronym_name: true,
          },
        },
        candidates: {
          include: this.getCandidateWithApplicationInclude(companyId),
        },
      },
    } as any);

    await this.notifyCandidatesInterviewScheduleCreated({
      candidateIds: candidate_ids,
      recruitmentInforId: recruitment_infor_id,
      schedule,
    });

    return schedule;
  }

  async getAll(
    params: InterviewFilterType,
    actor?: any,
  ): Promise<InterviewPaginType> {
    const {
      search,
      recruitment_infor_id,
      pages = 1,
      items_per_pages = 10,
    } = params;

    const skip = (pages - 1) * items_per_pages;

    const whereCondition: any = {
      is_active: true,
    };

    const companyId = this.getScopedCompanyId(actor);

    if (search) {
      whereCondition.OR = [
        {
          sche_code: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          interview_location: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          interview_room: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    if (recruitment_infor_id) {
      whereCondition.candidates = {
        some: {
          candidate: {
            statusApplication: {
              some: {
                recruitment_infor_id,
              },
            },
          },
        },
      };
    }

    if (companyId) {
      whereCondition.AND = [
        ...(Array.isArray(whereCondition.AND) ? whereCondition.AND : []),
        this.getInterviewCompanyScopeCondition(companyId),
      ];
    }

    const [data, total_items] = await Promise.all([
      this.prisma.interview_Schedule.findMany({
        where: whereCondition,
        skip,
        take: items_per_pages,
        orderBy: {
          created_at: 'desc',
        },
        include: {
          candidates: {
            include: this.getCandidateWithApplicationInclude(companyId),
          },
        },
      }),
      this.prisma.interview_Schedule.count({
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

  async getById(id: string, actor?: any): Promise<Interview_Schedule | null> {
    const companyId = this.getScopedCompanyId(actor);
    return this.prisma.interview_Schedule.findFirst({
      where: {
        id,
        ...(companyId
          ? { AND: [this.getInterviewCompanyScopeCondition(companyId)] }
          : {}),
      },
      include: {

        candidates: {
          include: this.getCandidateWithApplicationInclude(companyId),
        },
      },
    });
  }

async update(id: string, body: UpdateInterviewScheduleDto, actor?: any) {
  const {
    interviewer_ids,
    candidate_ids,
    recruitment_infor_id,
    company_id,
    ...rest
  } = body;

  const currentSchedule = await this.prisma.interview_Schedule.findUnique({
    where: { id },
    include: {
      candidates: true,
    },
  });

  if (!currentSchedule) {
    throw new BadRequestException('Không tìm thấy lịch phỏng vấn.');
  }

  // Permission: employer can only update schedules of their company
  const scopedCompanyId = this.getScopedCompanyId(actor);
  const recruitmentCompanyId =
    await this.getRecruitmentCompanyId(recruitment_infor_id);
  const companyId =
    scopedCompanyId || company_id || recruitmentCompanyId || currentSchedule.company_id;

  if (
    scopedCompanyId &&
    currentSchedule.company_id &&
    currentSchedule.company_id !== scopedCompanyId
  ) {
    throw new ForbiddenException('You can only update schedules in your company.');
  }

  if (
    scopedCompanyId &&
    recruitmentCompanyId &&
    scopedCompanyId !== recruitmentCompanyId
  ) {
    throw new ForbiddenException(
      'You can only schedule interviews for your company.',
    );
  }

  await this.assertCandidatesMatchRecruitment(candidate_ids, recruitment_infor_id);
  await this.assertCandidatesInCompanyScope(candidate_ids, scopedCompanyId);

  const finalStartTime = rest.times
    ? new Date(rest.times)
    : currentSchedule.times;

  const finalDuration = rest.time_duration ?? currentSchedule.time_duration;

  const finalCandidateIds =
    candidate_ids ??
    currentSchedule.candidates.map((item) => item.candidate_id);

  await this.checkCandidateAvailability(
    finalCandidateIds,
    finalStartTime,
    finalDuration,
    id,
  );

  const updatedSchedule = await this.prisma.$transaction(async (tx) => {
    await tx.interview_Schedule.update({
      where: { id },
      data: {
        ...rest,
        interview_date: rest.interview_date
          ? new Date(rest.interview_date)
          : undefined,
        times: rest.times ? new Date(rest.times) : undefined,
        company_id: companyId || undefined,
        updated_at: new Date(),
      },
    });

    if (candidate_ids) {
      await tx.schedules_Candidates.deleteMany({
        where: { interview_schedule_id: id },
      });

      await tx.schedules_Candidates.createMany({
        data: candidate_ids.map((canId) => ({
          interview_schedule_id: id,
          candidate_id: canId,
        })),
      });
    }

    return tx.interview_Schedule.findUnique({
      where: { id },
      include: {
        candidates: {
          include: this.getCandidateWithApplicationInclude(companyId),
        },
      },
    });
  });

  if (updatedSchedule) {
    await this.notifyCandidatesInterviewScheduleCreated({
      candidateIds: finalCandidateIds,
      recruitmentInforId: recruitment_infor_id,
      schedule: updatedSchedule,
      action: 'updated',
    });
  }

  return updatedSchedule;
}

  async delete(id: string, actor?: any): Promise<Interview_Schedule> {
    const current = await this.prisma.interview_Schedule.findUnique({ where: { id } });
    if (!current) throw new BadRequestException('Không tìm thấy lịch phỏng vấn.');

    const companyId = this.getScopedCompanyId(actor);
    if (companyId) {
      if (current.company_id !== companyId) {
        throw new ForbiddenException(
          'You can only delete schedules in your company.',
        );
      }
    }

    return this.prisma.interview_Schedule.update({
      where: { id },
      data: {
        is_active: false,
      },
    });
  }

  private async checkCandidateAvailability(
    candidateIds: string[] | undefined,
    startTime?: Date | null,
    durationMinutes?: number | null,
    excludeScheduleId?: string,
  ): Promise<void> {
    if (!candidateIds?.length || !startTime || !durationMinutes) {
      return;
    }

    const newStart = startTime;
    const newEnd = this.getEndTime(newStart, durationMinutes);

    const schedules = await this.prisma.interview_Schedule.findMany({
      where: {
        is_active: true,
        id: excludeScheduleId
          ? {
              not: excludeScheduleId,
            }
          : undefined,
        candidates: {
          some: {
            candidate_id: {
              in: candidateIds,
            },
          },
        },
        status: {
          in: ['PENDING', 'ACCEPTED'],
        },
      },
      select: {
        id: true,
        status: true,
        times: true,
        time_duration: true,
        expired_at: true,
      },
    });

    for (const schedule of schedules) {
      if (!schedule.times || !schedule.time_duration) {
        continue;
      }

      const existingStart = schedule.times;
      const existingEnd = this.getEndTime(
        existingStart,
        schedule.time_duration,
      );

      const isOverlapping =
        newStart.getTime() < existingEnd.getTime() &&
        newEnd.getTime() > existingStart.getTime();

      if (!isOverlapping) {
        continue;
      }

      if (schedule.status === 'ACCEPTED') {
        throw new BadRequestException(this.UNAVAILABLE_MESSAGE);
      }

      if (
        schedule.status === 'PENDING' &&
        this.isPendingScheduleStillValid(schedule.expired_at)
      ) {
        throw new BadRequestException(this.TEMPORARILY_UNAVAILABLE_MESSAGE);
      }
    }
  }
}
