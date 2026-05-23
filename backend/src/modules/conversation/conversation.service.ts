import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { RequestActor } from 'src/common/utils/request-actor.util';
import { NotificationService } from '../notification/notification.service';
import { APPLICATION_STATUS } from 'src/constant';

type ChatSide = 'CANDIDATE' | 'EMPLOYER';

@Injectable()
export class ConversationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  private roles(actor?: RequestActor) {
    return (actor?.roles || [])
      .filter(Boolean)
      .map((role) => String(role).toLowerCase());
  }

  private hasRole(actor: RequestActor | undefined, roleName: string) {
    return this.roles(actor).includes(roleName.toLowerCase());
  }

  private isAdmin(actor?: RequestActor) {
    return this.hasRole(actor, 'Admin');
  }

  private isCandidateSide(actor?: RequestActor) {
    return this.hasRole(actor, 'Candidate');
  }

  private isEmployerSide(actor?: RequestActor) {
    return (
      this.hasRole(actor, 'Employer') ||
      this.hasRole(actor, 'Employee') ||
      this.hasRole(actor, 'Admin')
    );
  }

  private requireEmployeeActor(actor?: RequestActor) {
    if (!actor?.actorEmployeeId) {
      throw new ForbiddenException('Missing or invalid user token');
    }
    return actor.actorEmployeeId;
  }

  private includePayload() {
    return {
      candidate: {
        select: {
          id: true,
          candidate_name: true,
          email: true,
          phone_number: true,
          avatar_file: true,
          employee_id: true,
        },
      },
      employer: {
        select: {
          id: true,
          employee_name: true,
          email_account: true,
          phone_account: true,
          avatar: true,
          company_id: true,
        },
      },
      company: {
        select: {
          id: true,
          full_name: true,
          acronym_name: true,
          image_logo: true,
          address: true,
        },
      },
      recruitment_infor: {
        select: {
          id: true,
          recruitment_code: true,
          internal_title: true,
          post_title: true,
          type_of_job: true,
          salary_from: true,
          salary_to: true,
          salary_currency: true,
          contact_person_id: true,
          department_id: true,
          work_location_id: true,
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
              image_logo: true,
            },
          },
          workLocation: {
            select: {
              id: true,
              full_name: true,
              acronym_name: true,
              image_logo: true,
            },
          },
        },
      },
    };
  }

  private async resolveCandidateByEmployee(employeeId: string) {
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
      throw new ForbiddenException('Employee account not found');
    }

    const candidate = await this.prisma.candidate.findFirst({
      where: {
        OR: [
          { employee_id: employeeId },
          employee.email_account ? { email: employee.email_account } : undefined,
          employee.phone_account ? { phone_number: employee.phone_account } : undefined,
        ].filter(Boolean) as any,
      },
      select: {
        id: true,
        candidate_name: true,
        email: true,
        phone_number: true,
        employee_id: true,
      },
    });

    if (!candidate) {
      throw new ForbiddenException('Candidate profile not found for this account');
    }

    return candidate;
  }

  private getCompanyIdFromRecruitment(recruitment: any) {
    return (
      recruitment?.department_id ||
      recruitment?.work_location_id ||
      recruitment?.contactPerson?.company_id ||
      null
    );
  }

  private async resolveEmployerId(recruitment: any, companyId?: string | null) {
    if (recruitment?.contact_person_id) {
      return recruitment.contact_person_id;
    }

    if (recruitment?.contactPerson?.id) {
      return recruitment.contactPerson.id;
    }

    if (companyId) {
      const employee = await this.prisma.employee.findFirst({
        where: {
          company_id: companyId,
          is_active: true,
        },
        orderBy: { created_at: 'asc' },
        select: { id: true },
      });

      if (employee?.id) {
        return employee.id;
      }
    }

    throw new BadRequestException(
      'This recruitment post does not have an employer/contact person to start chat',
    );
  }

  private async canAccessConversation(conversation: any, actor?: RequestActor) {
    if (this.isAdmin(actor)) return true;

    const employeeId = this.requireEmployeeActor(actor);

    if (this.isCandidateSide(actor)) {
      const candidate = await this.resolveCandidateByEmployee(employeeId);
      return conversation.candidate_id === candidate.id;
    }

    if (this.isEmployerSide(actor)) {
      if (conversation.employer_id === employeeId) return true;

      const employee = await this.prisma.employee.findUnique({
        where: { id: employeeId },
        select: { company_id: true },
      });

      if (employee?.company_id && conversation.company_id === employee.company_id) {
        return true;
      }
    }

    return false;
  }

  private async resolveActorSideForConversation(
    conversation: any,
    actor: RequestActor | undefined,
    employeeId: string,
  ): Promise<ChatSide | null> {
    if (conversation.employer_id === employeeId) {
      return 'EMPLOYER';
    }

    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      select: { company_id: true },
    });

    if (employee?.company_id && conversation.company_id === employee.company_id) {
      return 'EMPLOYER';
    }

    if (this.isCandidateSide(actor)) {
      const candidate = await this.resolveCandidateByEmployee(employeeId).catch(() => null);
      if (candidate && conversation.candidate_id === candidate.id) {
        return 'CANDIDATE';
      }
    }

    return null;
  }

  async ensureConversationForApplication(applicationId: string, actor?: RequestActor) {
    const employeeId = this.requireEmployeeActor(actor);

    if (!this.isCandidateSide(actor) && !this.isAdmin(actor)) {
      throw new ForbiddenException('Only candidate can open this conversation from application');
    }

    const existed = await this.prisma.chatConversation.findUnique({
      where: { application_id: applicationId },
      include: this.includePayload(),
    });

    if (existed) {
      const canAccess = await this.canAccessConversation(existed, actor);
      if (!canAccess) {
        throw new ForbiddenException('You do not have permission to open this conversation');
      }
      return existed;
    }

    const candidate = this.isCandidateSide(actor)
      ? await this.resolveCandidateByEmployee(employeeId)
      : null;

    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        candidate: {
          select: {
            id: true,
            candidate_name: true,
            email: true,
            phone_number: true,
            employee_id: true,
          },
        },
        recruitment_infor: {
          include: {
            contactPerson: {
              select: {
                id: true,
                employee_name: true,
                company_id: true,
              },
            },
            department: {
              select: { id: true },
            },
            workLocation: {
              select: { id: true },
            },
          },
        },
      },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    if (candidate && application.candidate_id !== candidate.id) {
      throw new ForbiddenException('This application does not belong to current candidate');
    }

    const recruitment = application.recruitment_infor;
    if (!recruitment) {
      throw new NotFoundException('Recruitment post not found');
    }

    const companyId = this.getCompanyIdFromRecruitment(recruitment);
    const employerId = await this.resolveEmployerId(recruitment, companyId);
    await this.assertMessagingAllowed(applicationId);
    return this.prisma.chatConversation.create({
      data: {
        application_id: application.id,
        candidate_id: application.candidate_id,
        employer_id: employerId,
        recruitment_infor_id: application.recruitment_infor_id,
        company_id: companyId,
        status: 'ACTIVE',
      },
      include: this.includePayload(),
    });
  }

  async getCandidateConversations(actor?: RequestActor) {
    if (!this.isCandidateSide(actor) && !this.isAdmin(actor)) {
      throw new ForbiddenException('Candidate permission required');
    }

    const employeeId = this.requireEmployeeActor(actor);
    
    try {
      const candidate = await this.resolveCandidateByEmployee(employeeId);

      return this.prisma.chatConversation.findMany({
        where: {
          candidate_id: candidate.id,
          is_active: true,
        },
        include: this.includePayload(),
        orderBy: [{ last_message_at: 'desc' }, { created_at: 'desc' }],
      });
    } catch (error) {
      // If candidate not found, return empty array instead of throwing error
      if (error instanceof ForbiddenException || error instanceof NotFoundException) {
        return [];
      }
      throw error;
    }
  }

  async getEmployerConversations(actor?: RequestActor) {
    if (!this.isEmployerSide(actor)) {
      throw new ForbiddenException('Employer permission required');
    }

    const employeeId = this.requireEmployeeActor(actor);
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      select: { company_id: true },
    });

    return this.prisma.chatConversation.findMany({
      where: {
        is_active: true,
        ...(this.isAdmin(actor)
          ? {}
          : {
              OR: [
                { employer_id: employeeId },
                employee?.company_id ? { company_id: employee.company_id } : undefined,
              ].filter(Boolean) as any,
            }),
      },
      include: this.includePayload(),
      orderBy: [{ last_message_at: 'desc' }, { created_at: 'desc' }],
    });
  }

  async getMessages(conversationId: string, actor?: RequestActor) {
    const conversation = (await this.prisma.chatConversation.findUnique({
      where: { id: conversationId },
      include: this.includePayload(),
    })) as any;

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const canAccess = await this.canAccessConversation(conversation, actor);
    if (!canAccess) {
      throw new ForbiddenException('You do not have permission to view this conversation');
    }

    return this.prisma.chatMessage.findMany({
      where: {
        conversation_id: conversationId,
        is_deleted: false,
      },
      orderBy: { created_at: 'asc' },
    });
  }

  private async assertMessagingAllowed(applicationId: string) {
  const application = await this.prisma.application.findUnique({
    where: { id: applicationId },
    select: {
      id: true,
      connection_accepted: true,
    },
  });

  if (!application) {
    throw new NotFoundException('Application not found');
  }

  if (!application.connection_accepted) {
    throw new ForbiddenException(
      'Messaging is only available after the candidate accepts the connection request.',
    );
  }

  return application;
}
  async sendMessage(conversationId: string, content: string, actor?: RequestActor) {
    const employeeId = this.requireEmployeeActor(actor);
    const cleanContent = String(content || '').trim();

    if (!cleanContent) {
      throw new BadRequestException('Message content is required');
    }

    const conversation = (await this.prisma.chatConversation.findUnique({
      where: { id: conversationId },
      include: this.includePayload(),
    })) as any;

    if (!conversation) {
  throw new NotFoundException('Conversation not found');
}

if (!conversation.application_id) {
  throw new ForbiddenException(
    'Messaging is only available for accepted applications.',
  );
}

await this.assertMessagingAllowed(conversation.application_id);

const canAccess = await this.canAccessConversation(conversation, actor);
  if (!canAccess) {
  throw new ForbiddenException('You do not have permission to send message');
}
    const senderType = await this.resolveActorSideForConversation(conversation, actor, employeeId);
    if (!senderType) {
      throw new ForbiddenException('Cannot determine sender side for this conversation');
    }

    const message = await this.prisma.chatMessage.create({
      data: {
        conversation_id: conversationId,
        sender_type: senderType,
        sender_id: employeeId,
        content: cleanContent,
        message_type: 'TEXT',
      },
    });

    const employerId = conversation.employer_id as string | null;
    const candidateId = conversation.candidate_id as string | null;
    const candidateName = conversation.candidate?.candidate_name as string | null | undefined;
    const employerName = conversation.employer?.employee_name as string | null | undefined;

    if (senderType === 'CANDIDATE' && employerId) {
      await this.notificationService.notifyChatMessage({
        receiverId: employerId,
        receiverRole: 'EMPLOYER',
        conversationId: conversation.id,
        senderName: candidateName,
      });
    }

    if (senderType === 'EMPLOYER' && candidateId) {
      await this.notificationService.notifyChatMessage({
        receiverId: candidateId,
        receiverRole: 'CANDIDATE',
        conversationId: conversation.id,
        senderName: employerName,
      });
    }

    await this.prisma.chatConversation.update({
      where: { id: conversationId },
      data: {
        last_message: cleanContent,
        last_message_at: new Date(),
        candidate_unread_count:
          senderType === 'EMPLOYER' ? { increment: 1 } : undefined,
        employer_unread_count:
          senderType === 'CANDIDATE' ? { increment: 1 } : undefined,
      },
    });

    return message;
  }

  async markAsRead(conversationId: string, actor?: RequestActor) {
    const conversation = await this.prisma.chatConversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const canAccess = await this.canAccessConversation(conversation, actor);
    if (!canAccess) {
      throw new ForbiddenException('You do not have permission to update this conversation');
    }

    const employeeId = this.requireEmployeeActor(actor);
    const side = await this.resolveActorSideForConversation(conversation, actor, employeeId);
    if (!side) {
      throw new ForbiddenException('Cannot determine actor side for this conversation');
    }

    await this.prisma.chatMessage.updateMany({
      where: {
        conversation_id: conversationId,
        sender_type: side === 'CANDIDATE' ? 'EMPLOYER' : 'CANDIDATE',
        is_read: false,
      },
      data: {
        is_read: true,
        read_at: new Date(),
      },
    });

    return this.prisma.chatConversation.update({
      where: { id: conversationId },
      data: {
        candidate_unread_count: side === 'CANDIDATE' ? 0 : undefined,
        employer_unread_count: side === 'EMPLOYER' ? 0 : undefined,
      },
      include: this.includePayload(),
    });
  }
}
