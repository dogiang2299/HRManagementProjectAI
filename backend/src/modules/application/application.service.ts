import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  APPLICATION_STATUS,
  APPLICATION_STATUS_ORDER,
  APPLICATION_STATUS_VALUES,
  type ApplicationStatusType,
} from 'src/constant';
import { resolveDashboardCompanyId } from 'src/common/utils/dashboard-filters.util';
import { PrismaService } from 'src/prisma.service';
import {
  CANDIDATE_CV_SOURCE_TYPE,
  CANDIDATE_CV_STATUS,
} from '../candidate-cv/constants/candidate-cv.constant';
import {
  AuditLogService,
  type CandidateAuditActor,
} from '../audit_log/audit_log.service';
import { CreateApplicationDto } from './dto/create';
import { CandidateApplyDto } from './dto/candidate-apply';
import type {
  ApplicationPerformancePeriod,
  ApplicationPerformanceQueryDto,
  ApplicationPerformanceScope,
} from './dto/performance-query';
import type {
  ApplicationRejectedPeriod,
  ApplicationRejectedQueryDto,
  ApplicationRejectedScope,
} from './dto/rejected-query';
import { UpdateApplicationStatusDto } from './dto/update';
import { CandidateApplicationStateQueryDto } from './dto/candidate-state-query';
import { NotificationService } from '../notification/notification.service';
@Injectable()
export class ApplicationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
    private readonly notificationService: NotificationService,
  ) {}

  // Lấy role của người đang gọi API.
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

  // Lấy company_id nếu user là employer.
  private getEmployerCompanyId(actor?: any): string | null {
    const roles = this.getActorRoles(actor).map((r) => r.toLowerCase());
    const isEmployer = roles.includes('employer');
    if (!isEmployer) return null;

    if (!actor?.company_id) {
      throw new ForbiddenException('No company_id for employer');
    }

    return actor.company_id;
  }

  // Tìm employer sẽ nhận thông báo ứng tuyển.
  private async findEmployerReceiver(recruitment: {
    id?: string;
    contact_person_id?: string | null;
    contactPerson?: { id?: string | null; company_id?: string | null } | null;
    department_id?: string | null;
    work_location_id?: string | null;
  }) {
    const companyId =
      recruitment.department_id ||
      recruitment.work_location_id ||
      recruitment.contactPerson?.company_id ||
      null;
    if (!companyId) {
      console.warn(
        `Cannot find company_id for recruitment_infor_id = ${recruitment.id || 'unknown'}`,
      );
      return null;
    }

    const employerRoleFilter = {
      roles: {
        some: {
          role: {
            name_role: 'Employer',
          },
        },
      },
    } as const;

    if (recruitment.contact_person_id) {
      const contactEmployer = await this.prisma.employee.findFirst({
        where: {
          id: recruitment.contact_person_id,
          company_id: companyId,
          is_active: true,
          ...employerRoleFilter,
        },
        select: { id: true },
      });

      if (contactEmployer) {
        return contactEmployer.id;
      }
    }

    const fallbackReceiver = await this.prisma.employee.findFirst({
      where: {
        company_id: companyId,
        is_active: true,
        ...employerRoleFilter,
      },
      orderBy: { created_at: 'desc' },
      select: { id: true },
    });

    if (!fallbackReceiver) {
      console.warn(
        `Cannot find employer receiver for recruitment_infor_id = ${recruitment.id || 'unknown'} and company_id = ${companyId}`,
      );
    }

    return fallbackReceiver?.id || null;
  }

  // Kiểm tra employer có quyền với application này không.
  private async checkEmployerOwnsApplication(
    applicationId: string,
    actor?: CandidateAuditActor,
  ) {
    const companyId = this.getEmployerCompanyId(actor);
    if (!companyId) return;

    const matched = await this.prisma.application.findFirst({
      where: {
        id: applicationId,
        recruitment_infor: {
          OR: [
            { department_id: companyId },
            { work_location_id: companyId },
            { positionPost: { is: { unit_id: companyId } } },
            { contactPerson: { is: { company_id: companyId } } },
          ],
        },
      },
      select: { id: true },
    });

    if (!matched) {
      throw new ForbiddenException(
        'You can only update applications in your company scope',
      );
    }
  }

  // Thêm điều kiện lọc theo công ty của employer.
  private addEmployerScope(where: any, actor?: CandidateAuditActor) {
    const companyId = this.getEmployerCompanyId(actor);
    if (!companyId) return;
    this.addApplicationRecruitmentCompanyScope(where, companyId);
  }

  private addApplicationRecruitmentCompanyScope(where: any, companyId: string) {
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

  private addReportCompanyScope(
    where: any,
    actor?: CandidateAuditActor,
    requestedCompanyId?: string,
  ) {
    this.addEmployerScope(where, actor);

    if (this.getEmployerCompanyId(actor)) return;

    const reportCompanyId = resolveDashboardCompanyId(actor, requestedCompanyId);
    if (reportCompanyId) {
      this.addApplicationRecruitmentCompanyScope(where, reportCompanyId);
    }
  }

  // Chuẩn hóa status về giá trị chuẩn trong APPLICATION_STATUS.
  private normalizeStatusValue(status?: string | null): ApplicationStatusType {
    const normalized = (status || '')
      .trim()
      .toLowerCase()
      .replace(/[_-]+/g, ' ');

    const exactStatus = APPLICATION_STATUS_VALUES.find(
      (item) => item.toLowerCase() === normalized,
    );
    if (exactStatus) return exactStatus;

    if (normalized.includes('in contact') || normalized.includes('contacted'))
      return APPLICATION_STATUS.CONTACTED;
    if (normalized.includes('interview'))
      return APPLICATION_STATUS.INTERVIEWING;
    if (normalized.includes('waiting response'))
      return APPLICATION_STATUS.WAITING_RESPONSE;
    if (normalized.includes('closed')) return APPLICATION_STATUS.CLOSED;
    if (normalized.includes('accept') || normalized.includes('pass'))
      return APPLICATION_STATUS.ACCEPTED;
    if (
      normalized.includes('not suitable') ||
      normalized.includes('reject') ||
      normalized.includes('fail')
    )
      return APPLICATION_STATUS.REJECTED;

    return APPLICATION_STATUS.APPLIED;
  }

  // Lấy ngày bắt đầu của kỳ báo cáo.
  private getPeriodStart(period: ApplicationPerformancePeriod) {
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

  // Kiểm tra phòng ban có thuộc scope báo cáo không.
  private isInScope(
    scope: ApplicationPerformanceScope,
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

  // Tính phần trăm, tránh chia cho 0.
  private toPercent(numerator: number, denominator: number) {
    if (!denominator) return 0;
    return Number(((numerator / denominator) * 100).toFixed(1));
  }

  // Các status vẫn cho phép cập nhật hồ sơ.
  private readonly inProgressStatuses = new Set<string>([
    APPLICATION_STATUS.APPLIED,
    APPLICATION_STATUS.CONTACTED,
    APPLICATION_STATUS.INTERVIEWING,
    APPLICATION_STATUS.WAITING_RESPONSE,
  ]);

  // Ghép note ứng tuyển với địa điểm mong muốn.
  private composeApplyNote(data: CandidateApplyDto) {
    return [
      data.note,
      data.preferred_location
        ? `Preferred location: ${data.preferred_location}`
        : null,
    ]
      .filter(Boolean)
      .join('\n');
  }

  // xác định cv này gắn với ứng viên nào 
  private async resolveApplicationCandidateCvId(
    candidateId: string,
    candidateCvId?: string | null,
    file?: Express.Multer.File,
  ) {
    if (candidateCvId) {
      const cv = await this.prisma.candidateCV.findUnique({
        where: { id: candidateCvId },
        select: {
          id: true,
          candidate_id: true,
          status: true,
        },
      });

      if (!cv) {
        throw new BadRequestException('Invalid candidate_cv_id');
      }

      if (cv.candidate_id !== candidateId) {
        throw new BadRequestException('Invalid candidate_cv_id');
      }

      if (cv.status === CANDIDATE_CV_STATUS.ARCHIVED) {
        throw new BadRequestException(
          'Archived CV cannot be used for application',
        );
      }

      if (cv.status !== CANDIDATE_CV_STATUS.COMPLETED) {
        throw new BadRequestException(
          'Only COMPLETED CV can be used for application',
        );
      }

      return cv.id;
    }

    if (file?.filename) {
      const createdCv = await this.prisma.candidateCV.create({
        data: {
          candidate_id: candidateId,
          title: file.originalname || `CV upload - ${file.filename}`,
          source_type: CANDIDATE_CV_SOURCE_TYPE.UPLOADED_FILE,
          status: CANDIDATE_CV_STATUS.COMPLETED,
          is_primary: false,
          file_url: `/uploads/cv/${file.filename}`,
          file_name: file.filename,
        },
        select: { id: true },
      });

      return createdCv.id;
    }

    const primaryCv = await this.prisma.candidateCV.findFirst({
      where: {
        candidate_id: candidateId,
        is_primary: true,
        status: CANDIDATE_CV_STATUS.COMPLETED,
      },
      orderBy: [{ updated_at: 'desc' }, { created_at: 'desc' }],
      select: { id: true },
    });

    return primaryCv?.id || null;
  }

  // Kiểm tra status input có hợp lệ không.
  private getValidStatus(status?: string) {
    const raw = (status || '').trim();
    if (!raw) {
      throw new BadRequestException('status is required');
    }

    const normalizedKey = raw.toUpperCase().replace(/[\s-]+/g, '_');
    const fromKey = (APPLICATION_STATUS as Record<string, string>)[
      normalizedKey
    ];
    if (fromKey) return fromKey;

    const fromValue = APPLICATION_STATUS_VALUES.find(
      (item) => item.toLowerCase() === raw.toLowerCase(),
    );
    if (fromValue) return fromValue;

    throw new BadRequestException('Invalid application status');
  }

  // Chuẩn hóa status để so sánh.
  private statusForCompare(status?: string | null) {
    return (status || '')
      .trim()
      .toLowerCase()
      .replace(/[\s_-]+/g, ' ');
  }

  // Lấy label status chuẩn.
  private getStatusLabel(status?: string | null) {
    return this.normalizeStatusValue(status);
  }

  // Lấy candidate theo employee, chưa có thì tạo mới.
  private async getOrCreateCandidate(
    employeeId: string,
    file?: Express.Multer.File,
  ) {
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
      select: { id: true, candidate_code: true },
    });

    if (!candidate) {
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
          cv_file: file?.filename,
          cv_uploaded_at: file ? new Date() : undefined,
        },
        select: { id: true, candidate_code: true },
      });
    } else if (file?.filename) {
      await this.prisma.candidate.update({
        where: { id: candidate.id },
        data: {
          cv_file: file.filename,
          cv_uploaded_at: new Date(),
        },
      });
    }

    return { employee, candidate };
  }

  // Tạo mã candidate tiếp theo dạng CA_0001.
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

  // Candidate tự ứng tuyển job.
  async applyForJob(
    data: CandidateApplyDto,
    file: Express.Multer.File | undefined,
    actor?: CandidateAuditActor,
  ) {
    const tokenEmployeeId = (actor as any)?.actorEmployeeId || undefined;
    const employeeId = data.employee_id || tokenEmployeeId;

    if (!employeeId) {
      throw new BadRequestException('employee_id is required');
    }

    const jobPost = await this.prisma.recruitment_Infor.findUnique({
      where: { id: data.recruitment_infor_id },
      select: {
        id: true,
        post_title: true,
        internal_title: true,
        is_active: true,
        contact_person_id: true,
        department_id: true,
        work_location_id: true,
        contactPerson: {
          select: {
            id: true,
            company_id: true,
          },
        },
      },
    });

    if (!jobPost || jobPost.is_active === false) {
      throw new NotFoundException('Recruitment post not found or inactive');
    }

    const { candidate } = await this.getOrCreateCandidate(employeeId, file);
    const candidateCvId = await this.resolveApplicationCandidateCvId(
      candidate.id,
      data.candidate_cv_id,
      file,
    );

    const existingApplication = await this.prisma.application.findUnique({
      where: {
        candidate_id_recruitment_infor_id: {
          candidate_id: candidate.id,
          recruitment_infor_id: data.recruitment_infor_id,
        },
      },
      select: {
        id: true,
        status: true,
      },
    });

    const note = this.composeApplyNote(data);
    const applicationInclude = {
      candidate: {
        select: {
          id: true,
          candidate_code: true,
          candidate_name: true,
          phone_number: true,
          email: true,
          cv_file: true,
          cv_uploaded_at: true,
        },
      },
      recruitment_infor: {
        select: {
          id: true,
          recruitment_code: true,
          internal_title: true,
          post_title: true,
          status: true,
        },
      },
      candidate_cv: {
        select: {
          id: true,
          title: true,
          source_type: true,
          status: true,
          is_primary: true,
          file_url: true,
          file_name: true,
          raw_text: true,
          summary: true,
          created_at: true,
          updated_at: true,
        },
      },
    } as const;

    let mode: 'created' | 'updated_profile' | 'reapplied' = 'created';
    let application: any;

    if (!existingApplication) {
      application = await this.prisma.application.create({
        data: {
          candidate_id: candidate.id,
          recruitment_infor_id: data.recruitment_infor_id,
          candidate_cv_id: candidateCvId || undefined,
          status: APPLICATION_STATUS.APPLIED,
          note: note || undefined,
          cover_letter: data.cover_letter || undefined,
          applied_at: new Date(),
          reapply_count: 0,
        } as any,
        include: applicationInclude,
      });
    } else if (this.inProgressStatuses.has(existingApplication.status || '')) {
      mode = 'updated_profile';
      application = await this.prisma.application.update({
        where: { id: existingApplication.id },
        data: {
          note: note || undefined,
          cover_letter: data.cover_letter || undefined,
          candidate_cv_id: candidateCvId || undefined,
        } as any,
        include: applicationInclude,
      });
    } else if (existingApplication.status === APPLICATION_STATUS.REJECTED) {
      mode = 'reapplied';
      application = await this.prisma.application.update({
        where: { id: existingApplication.id },
        data: {
          status: APPLICATION_STATUS.APPLIED,
          note: note || undefined,
          cover_letter: data.cover_letter || undefined,
          applied_at: new Date(),
          reapply_count: { increment: 1 },
          candidate_cv_id: candidateCvId || undefined,
        } as any,
        include: applicationInclude,
      });

      if (!application) {
        throw new NotFoundException('Application không tồn tại');
      }
    } else if (
      existingApplication.status === APPLICATION_STATUS.ACCEPTED ||
      existingApplication.status === APPLICATION_STATUS.CLOSED
    ) {
      throw new BadRequestException('Bạn không thể ứng tuyển lại cho tin này.');
    } else {
      throw new BadRequestException(
        'Trạng thái hồ sơ hiện tại không hỗ trợ thao tác này.',
      );
    }

    await this.auditLogService.logCandidateActivity({
      candidateId: candidate.id,
      action: 'APPLICATION_CREATED',
      message: 'Candidate applied from candidate portal',
      metadata: {
        application_id: application.id,
        recruitment_infor_id: application.recruitment_infor_id,
        recruitment_post_title: jobPost.post_title,
        recruitment_internal_title: jobPost.internal_title,
        mode,
      },
      ...actor,
    });

    const employerId = await this.findEmployerReceiver(jobPost);
    if (employerId && (mode === 'created' || mode === 'reapplied')) {
      try {
        await this.notificationService.notifyNewApplication({
          employerId,
          candidateName: application?.candidate?.candidate_name,
          jobTitle: jobPost.post_title || jobPost.internal_title,
          recruitmentId: application.recruitment_infor_id,
        });
      } catch {
        // Do not block application submission when notification fails.
      }
    }

    return {
      ...application,
      mode,
    };
  }

  // Kiểm tra candidate có thể apply/update/reapply không.
  async getCandidateApplicationState(
    query: CandidateApplicationStateQueryDto,
    actor?: CandidateAuditActor,
  ) {
    const tokenEmployeeId = (actor as any)?.actorEmployeeId || undefined;
    const employeeId = query.employee_id || tokenEmployeeId;

    if (!employeeId) {
      throw new BadRequestException('employee_id is required');
    }

    const jobPost = await this.prisma.recruitment_Infor.findUnique({
      where: { id: query.recruitment_infor_id },
      select: { id: true, is_active: true },
    });

    if (!jobPost || jobPost.is_active === false) {
      throw new NotFoundException('Recruitment post not found or inactive');
    }

    const { candidate } = await this.getOrCreateCandidate(employeeId);

    const existingApplication = await this.prisma.application.findUnique({
      where: {
        candidate_id_recruitment_infor_id: {
          candidate_id: candidate.id,
          recruitment_infor_id: query.recruitment_infor_id,
        },
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!existingApplication) {
      return {
        hasApplication: false,
        action: 'APPLY',
        buttonLabel: 'Apply for this job',
        canSubmit: true,
        application: null,
      };
    }

    if (this.inProgressStatuses.has(existingApplication.status || '')) {
      return {
        hasApplication: true,
        action: 'UPDATE_PROFILE',
        buttonLabel: 'Cập nhật hồ sơ',
        canSubmit: true,
        application: existingApplication,
      };
    }

    if (existingApplication.status === APPLICATION_STATUS.REJECTED) {
      return {
        hasApplication: true,
        action: 'REAPPLY',
        buttonLabel: 'Ứng tuyển lại',
        canSubmit: true,
        application: existingApplication,
      };
    }

    return {
      hasApplication: true,
      action: 'NONE',
      buttonLabel: 'Không thể ứng tuyển',
      canSubmit: false,
      application: existingApplication,
    };
  }

  // Lấy danh sách job candidate đã ứng tuyển.
  async getMyApplicationsByEmployee(employeeId?: string, status?: string) {
    if (!employeeId) {
      throw new BadRequestException('employee_id is required');
    }

    const { candidate } = await this.getOrCreateCandidate(employeeId);

    return this.prisma.application.findMany({
      where: {
        candidate_id: candidate.id,
        status: status || undefined,
      },
      orderBy: {
        created_at: 'desc',
      },
      select: {
        id: true,
        status: true,
        connection_accepted: true,
        note: true,
        cover_letter: true,
        applied_at: true,
        created_at: true,
        updated_at: true,
        recruitment_infor: {
          select: {
            id: true,
            recruitment_code: true,
            internal_title: true,
            post_title: true,
            salary_from: true,
            salary_to: true,
            salary_currency: true,
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
                address: true,
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
  }

  // Lấy danh sách applications cho một candidate theo candidate.id
  async getApplicationsByCandidateId(candidateId: string, actor?: any) {
    if (!candidateId) {
      throw new BadRequestException('candidate_id is required');
    }

    const roles = this.getActorRoles(actor).map((r) => r.toLowerCase());
    const isEmployer = roles.includes('employer');

    // Nếu là employer nhưng không có company_id -> trả về rỗng theo yêu cầu
    if (isEmployer && !actor?.company_id) {
      return {
        candidate_id: candidateId,
        total: 0,
        company_count: 0,
        applications: [],
      };
    }

    const where: any = { candidate_id: candidateId };
    this.addEmployerScope(where, actor);

    const rows = await this.prisma.application.findMany({
      where,
      orderBy: [{ applied_at: 'desc' }, { created_at: 'desc' }],
      select: {
        id: true,
        status: true,
        note: true,
        cover_letter: true,
        applied_at: true,
        created_at: true,
        updated_at: true,
        reapply_count: true,
        connection_accepted: true,
        recruitment_infor: {
          select: {
            id: true,
            post_title: true,
            internal_title: true,
            department: { select: { id: true, full_name: true } },
            workLocation: { select: { id: true, full_name: true } },
            positionPost: {
              select: { id: true, name_post: true, unit_id: true },
            },
            contactPerson: { select: { id: true, company_id: true } },
            rank: { select: { id: true, name_rank: true } },
          },
        },
        candidate_cv: {
          select: {
            id: true,
            title: true,
            source_type: true,
            status: true,
            is_primary: true,
            file_url: true,
            file_name: true,
            raw_text: true,
            structured_data: true,
            summary: true,
            desired_position: true,
            years_experience: true,
            created_at: true,
            updated_at: true,
          },
        },
      },
    });

    const companyIdSet = new Set<string>();

    const applications = rows.map((app) => {
      const ri = (app as any).recruitment_infor || ({} as any);

      const title =
        ri.post_title ||
        ri.internal_title ||
        (ri as any).title ||
        'Untitled job';

      const companyId =
        ri.department?.id ||
        ri.workLocation?.id ||
        ri.positionPost?.unit_id ||
        ri.contactPerson?.company_id ||
        null;

      if (companyId) companyIdSet.add(companyId);

      const companyName =
        ri.department?.full_name || ri.workLocation?.full_name || null;

      return {
        id: app.id,
        status: app.status,
        note: app.note,
        cover_letter: app.cover_letter,
        applied_at: app.applied_at,
        created_at: app.created_at,
        updated_at: app.updated_at,
        reapply_count: app.reapply_count,
        connection_accepted: app.connection_accepted,
        recruitment_infor_id: ri.id,
        recruitment_infor: {
          id: ri.id,
          title,
          post_title: ri.post_title,
          internal_title: ri.internal_title,
          company: companyId ? { id: companyId, name: companyName } : null,
          location: ri.workLocation?.full_name || null,
          rank: ri.rank ? { id: ri.rank.id, name: ri.rank.name_rank } : null,
        },
        candidate_cv: app.candidate_cv,
      };
    });

    return {
      candidate_id: candidateId,
      total: applications.length,
      company_count: companyIdSet.size,
      applications,
    };
  }


  // Admin/employer gán candidate vào job.
  async create(data: CreateApplicationDto, actor?: CandidateAuditActor) {
    const { candidate_id, recruitment_infor_id, note, cover_letter } = data;

    const [candidate, recruitment_infor, existingApplication] =
      await Promise.all([
        this.prisma.candidate.findUnique({
          where: { id: candidate_id },
          select: {
            id: true,
            candidate_code: true,
            candidate_name: true,
          },
        }),
        this.prisma.recruitment_Infor.findUnique({
          where: { id: recruitment_infor_id },
          select: {
            id: true,
            recruitment_code: true,
            post_title: true,
            internal_title: true,
            is_active: true,
            contact_person_id: true,
            department_id: true,
            work_location_id: true,
            contactPerson: {
              select: {
                id: true,
                company_id: true,
              },
            },
          },
        }),
        this.prisma.application.findUnique({
          where: {
            candidate_id_recruitment_infor_id: {
              candidate_id,
              recruitment_infor_id,
            },
          },
        }),
      ]);

    if (!candidate) {
      throw new NotFoundException('Candidate does not exist');
    }

    if (!recruitment_infor) {
      throw new NotFoundException('The job posting does not exist');
    }

    if (existingApplication) {
      throw new BadRequestException(
        'The candidate has already been assigned to this job posting', //  'Ứng viên đã được gán vào tin tuyển dụng này rồi',
      );
    }

    const candidateCvId = await this.resolveApplicationCandidateCvId(
      candidate_id,
      data.candidate_cv_id,
    );

    const created = await this.prisma.application.create({
      data: {
        candidate_id,
        recruitment_infor_id,
        candidate_cv_id: candidateCvId || undefined,
        status: APPLICATION_STATUS.APPLIED,
        note,
        cover_letter,
        applied_at: new Date(),
        reapply_count: 0,
      } as any,
      include: {
        candidate: {
          select: {
            id: true,
            candidate_code: true,
            candidate_name: true,
            phone_number: true,
            email: true,
          },
        },
        recruitment_infor: {
          select: {
            id: true,
            recruitment_code: true,
            internal_title: true,
            post_title: true,
            status: true,
            positionPost: {
              select: {
                id: true,
                name_post: true,
              },
            },
          },
        },
        candidate_cv: {
          select: {
            id: true,
            title: true,
            source_type: true,
            status: true,
            is_primary: true,
            file_url: true,
            file_name: true,
            raw_text: true,
            summary: true,
            created_at: true,
            updated_at: true,
          },
        },
      },
    });

    await this.auditLogService.logCandidateActivity({
      candidateId: candidate_id,
      action: 'APPLICATION_CREATED',
      message: 'Assigned candidate to recruitment application',
      metadata: {
        application_id: created.id,
        recruitment_infor_id,
        recruitment_post_title: recruitment_infor.post_title,
        recruitment_internal_title: recruitment_infor.internal_title,
      },
      ...actor,
    });
    const employerId = await this.findEmployerReceiver(recruitment_infor);
    if (employerId) {
      await this.notificationService.notifyNewApplication({
        employerId,
        candidateName: candidate.candidate_name,
        jobTitle:
          recruitment_infor.post_title || recruitment_infor.internal_title,
        recruitmentId: recruitment_infor.id,
      });
    }
    return created;
  }

  // Lấy danh sách application.
  async findAll(query?: {
    search?: string;
    candidate_id?: string;
    recruitment_infor_id?: string;
    status?: string;
  }, actor?: CandidateAuditActor) {
    const keyword = query?.search?.trim();
    const where: any = {
      candidate_id: query?.candidate_id || undefined,
      recruitment_infor_id: query?.recruitment_infor_id || undefined,
      status: query?.status || undefined,
      candidate: keyword
        ? {
            OR: [
              {
                candidate_name: {
                  contains: keyword,
                  mode: 'insensitive',
                },
              },
              {
                candidate_code: {
                  contains: keyword,
                  mode: 'insensitive',
                },
              },
              {
                email: {
                  contains: keyword,
                  mode: 'insensitive',
                },
              },
              {
                phone_number: {
                  contains: keyword,
                  mode: 'insensitive',
                },
              },
            ],
          }
        : undefined,
    };

    this.addEmployerScope(where, actor);

    return this.prisma.application.findMany({
      where,
      orderBy: {
        created_at: 'desc',
      },
      include: {
        candidate: {
          select: {
            id: true,
            candidate_code: true,
            candidate_name: true,
            phone_number: true,
            email: true,
          },
        },
        recruitment_infor: {
          select: {
            id: true,
            recruitment_code: true,
            internal_title: true,
            post_title: true,
            department_id: true,
            work_location_id: true,
            contact_person_id: true,
            positionPost: {
              select: {
                id: true,
                name_post: true,
                unit_id: true,
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
            contactPerson: {
              select: {
                id: true,
                company_id: true,
              },
            },
          },
        },
      },
    });
  }

  // Lấy candidate theo job và status.
  async findCandidatesByRecruitmentAndStatus(
    jobPostId: string,
    status: string,
  ) {
    const validStatus = this.getValidStatus(status);

    const applications = await this.prisma.application.findMany({
      where: {
        recruitment_infor_id: jobPostId,
      },
      orderBy: [{ applied_at: 'desc' }, { created_at: 'desc' }],
      include: {
        candidate: {
          select: {
            id: true,
            candidate_code: true,
            candidate_name: true,
            phone_number: true,
            email: true,
            avatar_file: true,
            cv_file: true,
          },
        },
      },
    });

    const target = this.statusForCompare(validStatus);

    return applications.filter((application) => {
      const cleanRaw = this.statusForCompare(application.status);
      if (cleanRaw === target) return true;

      const cleanLabel = this.statusForCompare(
        this.getStatusLabel(application.status),
      );

      return cleanLabel === target;
    });
  }

  // Lấy chi tiết một application.
  async findOne(id: string) {
    const item = await this.prisma.application.findUnique({
      where: { id },
      include: {
        candidate: {
          select: {
            id: true,
            candidate_code: true,
            candidate_name: true,
            phone_number: true,
            email: true,
          },
        },
        recruitment_infor: {
          select: {
            id: true,
            recruitment_code: true,
            internal_title: true,
            post_title: true,
            status: true,
            positionPost: {
              select: {
                id: true,
                name_post: true,
              },
            },
          },
        },
      },
    });

    if (!item) {
      throw new NotFoundException('Application không tồn tại');
    }

    return item;
  }

  // Cập nhật status application.
  async updateStatus(
    id: string,
    data: UpdateApplicationStatusDto,
    actor?: CandidateAuditActor,
  ) {
    await this.checkEmployerOwnsApplication(id, actor);

    const validStatus = this.getValidStatus(data.status);

    const existingApplication = await this.prisma.application.findUnique({
      where: { id },
      select: {
        id: true,
        candidate_id: true,
        status: true,
        note: true,
        recruitment_infor: {
          select: {
            id: true,
            recruitment_code: true,
            post_title: true,
            internal_title: true,
          },
        },
      },
    });

    if (!existingApplication) {
      throw new NotFoundException('Application không tồn tại');
    }

    const updatedApplication = await this.prisma.application.update({
      where: { id },
      data: {
        status: validStatus,
        note: data.note ?? existingApplication.note,
      },
      include: {
        candidate: {
          select: {
            id: true,
            candidate_code: true,
            candidate_name: true,
            employee_id: true,
          },
        },
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
    });

    await this.auditLogService.logCandidateActivity({
      candidateId: existingApplication.candidate_id,
      action: 'APPLICATION_STATUS_UPDATED',
      message: 'Updated application status',
      metadata: {
        application_id: id,
        from_status: existingApplication.status,
        to_status: validStatus,
        recruitment_post_title:
          updatedApplication.recruitment_infor?.post_title,
        recruitment_internal_title:
          updatedApplication.recruitment_infor?.internal_title,
      },
      ...actor,
    });
    const actorEmployeeId = (actor as any)?.actorEmployeeId;
    const isSelfStatusChange =
      Boolean(actorEmployeeId) &&
      Boolean(updatedApplication.candidate?.employee_id) &&
      actorEmployeeId === updatedApplication.candidate.employee_id;

    if (!isSelfStatusChange) {
      await this.notificationService.notifyApplicationStatusChanged({
        candidateId: updatedApplication.candidate.id,
        jobTitle:
          updatedApplication.recruitment_infor?.post_title ||
          updatedApplication.recruitment_infor?.internal_title,
        applicationId: updatedApplication.id,
        newStatus: updatedApplication.status,
      });
    }

    return updatedApplication;
  }

  // Candidate đồng ý khi employer liên hệ.
  async acceptContactRequest(id: string, actor?: CandidateAuditActor) {
    const employeeId = (actor as any)?.actorEmployeeId;

    if (!employeeId) {
      throw new ForbiddenException('Missing or invalid user token');
    }

    const candidate = await this.prisma.candidate.findFirst({
      where: { employee_id: employeeId },
      select: { id: true },
    });

    if (!candidate) {
      throw new ForbiddenException(
        'Candidate profile not found for this account',
      );
    }

    const application = await this.prisma.application.findFirst({
      where: {
        id,
        candidate_id: candidate.id,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    if (application.status !== APPLICATION_STATUS.CONTACTED) {
      throw new BadRequestException(
        'Only contacted applications can be accepted',
      );
    }

    return this.prisma.application.update({
      where: { id },
      data: {
        connection_accepted: true,
      },
    });
  }

  // Candidate từ chối khi employer liên hệ.
  async declineContactRequest(id: string, actor?: CandidateAuditActor) {
    const employeeId = (actor as any)?.actorEmployeeId;

    if (!employeeId) {
      throw new ForbiddenException('Missing or invalid user token');
    }

    const candidate = await this.prisma.candidate.findFirst({
      where: { employee_id: employeeId },
      select: { id: true },
    });

    if (!candidate) {
      throw new ForbiddenException(
        'Candidate profile not found for this account',
      );
    }

    const application = await this.prisma.application.findFirst({
      where: {
        id,
        candidate_id: candidate.id,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    if (application.status !== APPLICATION_STATUS.CONTACTED) {
      throw new BadRequestException(
        'Only contacted applications can be declined',
      );
    }

    return this.prisma.application.update({
      where: { id },
      data: {
        connection_accepted: false,
      },
    });
  }

  // Xóa application khỏi job.
  async remove(id: string, actor?: CandidateAuditActor) {
    await this.checkEmployerOwnsApplication(id, actor);

    const existingApplication = await this.prisma.application.findUnique({
      where: { id },
      select: {
        id: true,
        candidate_id: true,
        recruitment_infor: {
          select: {
            id: true,
            post_title: true,
            internal_title: true,
          },
        },
      },
    });

    if (!existingApplication) {
      throw new NotFoundException('Application không tồn tại');
    }

    const deletedApplication = await this.prisma.application.delete({
      where: { id },
    });

    await this.auditLogService.logCandidateActivity({
      candidateId: existingApplication.candidate_id,
      action: 'APPLICATION_DELETED',
      message: 'Removed candidate from recruitment application',
      metadata: {
        application_id: id,
        recruitment_infor_id: existingApplication.recruitment_infor?.id,
        recruitment_post_title:
          existingApplication.recruitment_infor?.post_title,
        recruitment_internal_title:
          existingApplication.recruitment_infor?.internal_title,
      },
      ...actor,
    });

    return deletedApplication;
  }
  //#region REPORT
  // Báo cáo hiệu suất tuyển dụng.
  async getPerformanceSummary(
    query: ApplicationPerformanceQueryDto,
    actor?: CandidateAuditActor,
  ) {
    const period: ApplicationPerformancePeriod = query?.period || 'month';
    const scope: ApplicationPerformanceScope = query?.scope || 'all';
    const startAt = this.getPeriodStart(period);
    const now = new Date();

    const where: any = {
      created_at: { gte: startAt },
    };
    this.addReportCompanyScope(where, actor, query?.companyId);

    const applications = await this.prisma.application.findMany({
      where,
      orderBy: { created_at: 'asc' },
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
            contactPerson: {
              select: {
                id: true,
                employee_name: true,
              },
            },
            positionPost: {
              select: {
                id: true,
                name_post: true,
              },
            },
          },
        },
      },
    });

    const filtered = applications.filter((item) =>
      this.isInScope(scope, item.recruitment_infor?.department),
    );

    const statusCounts = Object.fromEntries(
      APPLICATION_STATUS_ORDER.map((status) => [status, 0]),
    ) as Record<ApplicationStatusType, number>;

    const recruiterMap = new Map<
      string,
      {
        id: string;
        name: string;
        total: number;
        inProgress: number;
        accepted: number;
        rejected: number;
      }
    >();

    const positionMap = new Map<
      string,
      {
        name: string;
        total: number;
        accepted: number;
        rejected: number;
      }
    >();

    const months = new Map<
      string,
      { month: string; total: number; accepted: number; rejected: number }
    >();

    const monthDate = new Date(
      startAt.getFullYear(),
      startAt.getMonth(),
      1,
      0,
      0,
      0,
      0,
    );
    while (monthDate <= now) {
      const key = `${monthDate.getFullYear()}-${monthDate.getMonth()}`;
      const monthLabel = monthDate.toLocaleString('en-US', {
        month: 'short',
      });

      months.set(key, {
        month: monthLabel,
        total: 0,
        accepted: 0,
        rejected: 0,
      });

      monthDate.setMonth(monthDate.getMonth() + 1);
    }

    for (const app of filtered) {
      const statusValue = this.normalizeStatusValue(app.status);
      statusCounts[statusValue] += 1;

      const isInProgress =
        statusValue === APPLICATION_STATUS.CONTACTED ||
        statusValue === APPLICATION_STATUS.INTERVIEWING ||
        statusValue === APPLICATION_STATUS.WAITING_RESPONSE;

      const isAccepted = statusValue === APPLICATION_STATUS.ACCEPTED;
      const isRejected = statusValue === APPLICATION_STATUS.REJECTED;

      const recruiterId =
        app.recruitment_infor?.contactPerson?.id || 'unassigned';
      const recruiterName =
        app.recruitment_infor?.contactPerson?.employee_name ||
        'Unassigned recruiter';

      if (!recruiterMap.has(recruiterId)) {
        recruiterMap.set(recruiterId, {
          id: recruiterId,
          name: recruiterName,
          total: 0,
          inProgress: 0,
          accepted: 0,
          rejected: 0,
        });
      }

      const recruiter = recruiterMap.get(recruiterId)!;
      recruiter.total += 1;
      if (isInProgress) recruiter.inProgress += 1;
      if (isAccepted) recruiter.accepted += 1;
      if (isRejected) recruiter.rejected += 1;

      const positionName =
        app.recruitment_infor?.positionPost?.name_post ||
        app.recruitment_infor?.post_title ||
        app.recruitment_infor?.internal_title ||
        'Unassigned position';

      if (!positionMap.has(positionName)) {
        positionMap.set(positionName, {
          name: positionName,
          total: 0,
          accepted: 0,
          rejected: 0,
        });
      }

      const position = positionMap.get(positionName)!;
      position.total += 1;
      if (isAccepted) position.accepted += 1;
      if (isRejected) position.rejected += 1;

      const createdAt = new Date(app.created_at);
      const monthKey = `${createdAt.getFullYear()}-${createdAt.getMonth()}`;
      const trend = months.get(monthKey);
      if (trend) {
        trend.total += 1;
        if (isAccepted) trend.accepted += 1;
        if (isRejected) trend.rejected += 1;
      }
    }

    const totalApplications = filtered.length;
    const inProgress =
      statusCounts[APPLICATION_STATUS.CONTACTED] +
      statusCounts[APPLICATION_STATUS.INTERVIEWING] +
      statusCounts[APPLICATION_STATUS.WAITING_RESPONSE];
    const accepted = statusCounts[APPLICATION_STATUS.ACCEPTED];
    const rejected = statusCounts[APPLICATION_STATUS.REJECTED];

    const pipeline = APPLICATION_STATUS_ORDER.map((statusValue, index) => {
      const count = statusCounts[statusValue];
      const previousCount =
        index > 0 ? statusCounts[APPLICATION_STATUS_ORDER[index - 1]] : 0;

      return {
        key: statusValue,
        label: statusValue,
        count,
        conversionFromPrevious:
          index === 0 ? null : this.toPercent(count, previousCount),
      };
    });

    const byRecruiter = Array.from(recruiterMap.values())
      .map((item) => ({
        ...item,
        acceptRate: this.toPercent(item.accepted, item.total),
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    const byPosition = Array.from(positionMap.values())
      .map((item) => ({
        ...item,
        acceptRate: this.toPercent(item.accepted, item.total),
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    const trend = Array.from(months.values());

    return {
      generatedAt: new Date().toISOString(),
      period,
      scope,
      totals: {
        totalApplications,
        inProgress,
        accepted,
        rejected,
        acceptRate: this.toPercent(accepted, totalApplications),
      },
      pipeline,
      byRecruiter,
      byPosition,
      trend,
    };
  }

  // Báo cáo hồ sơ bị reject.
  async getRejectedSummary(
    query: ApplicationRejectedQueryDto,
    actor?: CandidateAuditActor,
  ) {
    const period: ApplicationRejectedPeriod = query?.period || 'month';
    const scope: ApplicationRejectedScope = query?.scope || 'all';
    const startAt = this.getPeriodStart(period);
    const now = new Date();

    const where: any = { created_at: { gte: startAt } };
    this.addReportCompanyScope(where, actor, query?.companyId);

    const applications = await this.prisma.application.findMany({
      where,
      orderBy: { updated_at: 'desc' },
      include: {
        candidate: {
          select: {
            id: true,
            candidate_code: true,
            candidate_name: true,
            email: true,
            phone_number: true,
          },
        },
        recruitment_infor: {
          select: {
            id: true,
            post_title: true,
            internal_title: true,
            department: {
              select: { id: true, full_name: true, acronym_name: true },
            },
            contactPerson: {
              select: { id: true, employee_name: true },
            },
            positionPost: {
              select: { id: true, name_post: true },
            },
          },
        },
      },
    });

    const filtered = applications.filter((app) =>
      this.isInScope(scope, app.recruitment_infor?.department),
    );

    const total = filtered.length;
    const rejectedItems = filtered.filter(
      (app) =>
        this.normalizeStatusValue(app.status) === APPLICATION_STATUS.REJECTED,
    );
    const rejectedCount = rejectedItems.length;
    const rejectedRate = this.toPercent(rejectedCount, total);

    const recruiterMap = new Map<
      string,
      { id: string; name: string; total: number; rejected: number }
    >();
    const positionMap = new Map<
      string,
      { position: string; total: number; rejected: number }
    >();
    const departmentMap = new Map<
      string,
      { department: string; total: number; rejected: number }
    >();

    const months = new Map<
      string,
      { month: string; total: number; rejected: number }
    >();
    const monthDate = new Date(
      startAt.getFullYear(),
      startAt.getMonth(),
      1,
      0,
      0,
      0,
      0,
    );
    while (monthDate <= now) {
      const key = `${monthDate.getFullYear()}-${monthDate.getMonth()}`;
      months.set(key, {
        month: monthDate.toLocaleString('en-US', { month: 'short' }),
        total: 0,
        rejected: 0,
      });
      monthDate.setMonth(monthDate.getMonth() + 1);
    }

    for (const app of filtered) {
      const isRejected =
        this.normalizeStatusValue(app.status) === APPLICATION_STATUS.REJECTED;

      const recruiterId =
        app.recruitment_infor?.contactPerson?.id || 'unassigned';
      const recruiterName =
        app.recruitment_infor?.contactPerson?.employee_name || 'Unassigned';
      if (!recruiterMap.has(recruiterId)) {
        recruiterMap.set(recruiterId, {
          id: recruiterId,
          name: recruiterName,
          total: 0,
          rejected: 0,
        });
      }
      const recruiter = recruiterMap.get(recruiterId)!;
      recruiter.total += 1;
      if (isRejected) recruiter.rejected += 1;

      const positionName =
        app.recruitment_infor?.positionPost?.name_post ||
        app.recruitment_infor?.post_title ||
        app.recruitment_infor?.internal_title ||
        'Unknown position';
      if (!positionMap.has(positionName)) {
        positionMap.set(positionName, {
          position: positionName,
          total: 0,
          rejected: 0,
        });
      }
      const position = positionMap.get(positionName)!;
      position.total += 1;
      if (isRejected) position.rejected += 1;

      const departmentName =
        app.recruitment_infor?.department?.full_name ||
        app.recruitment_infor?.department?.acronym_name ||
        'Unknown department';
      if (!departmentMap.has(departmentName)) {
        departmentMap.set(departmentName, {
          department: departmentName,
          total: 0,
          rejected: 0,
        });
      }
      const department = departmentMap.get(departmentName)!;
      department.total += 1;
      if (isRejected) department.rejected += 1;

      const statusDate = new Date(app.updated_at);
      const monthKey = `${statusDate.getFullYear()}-${statusDate.getMonth()}`;
      const bucket = months.get(monthKey);
      if (bucket) {
        bucket.total += 1;
        if (isRejected) bucket.rejected += 1;
      }
    }

    const byRecruiter = Array.from(recruiterMap.values())
      .map((item) => ({
        ...item,
        rejectedRate: this.toPercent(item.rejected, item.total),
      }))
      .sort((a, b) => b.rejected - a.rejected)
      .slice(0, 10);

    const byPosition = Array.from(positionMap.values())
      .map((item) => ({
        ...item,
        rejectedRate: this.toPercent(item.rejected, item.total),
      }))
      .sort((a, b) => b.rejected - a.rejected)
      .slice(0, 10);

    const byDepartment = Array.from(departmentMap.values())
      .map((item) => ({
        ...item,
        rejectedRate: this.toPercent(item.rejected, item.total),
      }))
      .sort((a, b) => b.rejected - a.rejected);

    const recentRejected = rejectedItems.slice(0, 20).map((app) => ({
      candidateId: app.candidate.id,
      candidateCode: app.candidate.candidate_code || '-',
      candidateName: app.candidate.candidate_name || 'Unknown',
      email: app.candidate.email || '-',
      phone: app.candidate.phone_number || '-',
      position:
        app.recruitment_infor?.positionPost?.name_post ||
        app.recruitment_infor?.post_title ||
        app.recruitment_infor?.internal_title ||
        '-',
      department:
        app.recruitment_infor?.department?.full_name ||
        app.recruitment_infor?.department?.acronym_name ||
        '-',
      recruiter: app.recruitment_infor?.contactPerson?.employee_name || '-',
      note: app.note || null,
      rejectedAt: app.updated_at.toISOString(),
    }));

    return {
      generatedAt: new Date().toISOString(),
      period,
      scope,
      totals: {
        total,
        rejectedCount,
        rejectedRate,
      },
      byRecruiter,
      byPosition,
      byDepartment,
      trend: Array.from(months.values()),
      recentRejected,
    };
  }

}
