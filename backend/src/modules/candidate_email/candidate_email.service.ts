import { ForbiddenException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { MailService } from 'src/modules/mail/mail.service';
import { SendEmailToCandidateDto } from '../candidate_email/dto/send-email-to-candidate.dto';

@Injectable()
export class CandidateEmailService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

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

  private getEmployerCompanyId(actor?: any): string | null {
    const roles = this.getActorRoles(actor).map((r) => r.toLowerCase());
    const isEmployer = roles.includes('employer');
    if (!isEmployer) return null;

    if (!actor?.company_id) {
      throw new ForbiddenException('No company_id for employer');
    }

    return actor.company_id;
  }

  private hasHtmlTag(value: string) {
    return /<\/?[a-z][\s\S]*>/i.test(value);
  }

  private escapeHtml(value: string) {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private htmlToPlainText(value: string) {
    return value
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<\/li>/gi, '\n')
      .replace(/<li[^>]*>/gi, '- ')
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  private plainTextToHtml(value: string) {
    return value
      .split(/\n{2,}/)
      .map((paragraph) => {
        const html = paragraph
          .split('\n')
          .map((line) => this.escapeHtml(line))
          .join('<br />');

        return `<p>${html}</p>`;
      })
      .join('');
  }

  private buildMailBody(value: string) {
    if (this.hasHtmlTag(value)) {
      return {
        html: value,
        text: this.htmlToPlainText(value),
      };
    }

    return {
      html: this.plainTextToHtml(value),
      text: value,
    };
  }

  private async assertCandidateAccessible(candidateId: string, actor?: any) {
    const companyId = this.getEmployerCompanyId(actor);
    if (!companyId) return;

    const matched = await this.prisma.candidate.findFirst({
      where: {
        id: candidateId,
        statusApplication: {
          some: {
            recruitment_infor: {
              OR: [
                { department_id: companyId },
                { work_location_id: companyId },
                { positionPost: { is: { unit_id: companyId } } },
                { contactPerson: { is: { company_id: companyId } } },
              ],
            },
          },
        },
      },
      select: { id: true },
    });

    if (!matched) {
      throw new ForbiddenException('You can only access candidates in your company scope');
    }
  }

  async sendToCandidate(dto: SendEmailToCandidateDto, actor?: any) {
    await this.assertCandidateAccessible(dto.candidate_id, actor);

    const candidate = await this.prisma.candidate.findUnique({
      where: { id: dto.candidate_id },
      select: {
        id: true,
        candidate_name: true,
        email: true,
      },
    });

    if (!candidate) {
      throw new HttpException('Candidate not found', HttpStatus.NOT_FOUND);
    }

    if (!candidate.email) {
      throw new HttpException('Candidate email does not exist', HttpStatus.BAD_REQUEST);
    }

    const candidateEmail = candidate.email.trim();

    let template: any = null;

    if (dto.template_id) {
      template = await this.prisma.settingEmail.findFirst({
        where: {
          id: dto.template_id,
          is_active: true,
        },
        select: {
          id: true,
          name: true,
          subject: true,
          body: true,
          template_type: true,
        },
      });

      if (!template) {
        throw new HttpException('Email template not found', HttpStatus.NOT_FOUND);
      }
    }

    const finalSubject = (dto.subject ?? template?.subject ?? '').trim();
    const finalBody = (dto.body ?? template?.body ?? '').trim();

    if (!finalSubject) {
      throw new HttpException('Email subject is required', HttpStatus.BAD_REQUEST);
    }

    if (!finalBody) {
      throw new HttpException('Email body is required', HttpStatus.BAD_REQUEST);
    }

    try {
      const mailBody = this.buildMailBody(finalBody);

      await this.mailService.sendMail({
        to: candidateEmail,
        subject: finalSubject,
        html: mailBody.html,
        text: mailBody.text,
      });

      // Log successful email
      await this.prisma.emailLog.create({
        data: {
          template_id: template?.id ?? null,
          to_email: candidateEmail,
          subject: finalSubject,
          body: finalBody,
          status: 'sent',
          sent_by: actor?.actorEmployeeId ?? null,
        },
      });

      return {
        message: 'Email sent to candidate successfully',
        data: {
          candidate_id: candidate.id,
          candidate_name: candidate.candidate_name,
          candidate_email: candidateEmail,
          template_id: template?.id ?? null,
          subject: finalSubject,
        },
      };
    } catch (error: any) {
      // Log failed email
      await this.prisma.emailLog.create({
        data: {
          template_id: template?.id ?? null,
          to_email: candidateEmail,
          subject: finalSubject,
          body: finalBody,
          status: 'failed',
          error_message: error?.message || 'Unknown error',
          sent_by: actor?.actorEmployeeId ?? null,
        },
      });

      throw new HttpException(
        error?.message || 'Failed to send email',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getEmailLogsByCandidate(
    candidateId: string,
    page = 1,
    limit = 10,
    actor?: any,
  ) {
    await this.assertCandidateAccessible(candidateId, actor);

    const candidate = await this.prisma.candidate.findUnique({
      where: { id: candidateId },
      select: { email: true },
    });

    if (!candidate || !candidate.email) {
      throw new HttpException('Candidate not found or has no email', HttpStatus.NOT_FOUND);
    }

    const candidateEmail = candidate.email.trim();

    const safePage = Number.isFinite(page) && page > 0 ? page : 1;
    const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 10;
    const skip = (safePage - 1) * safeLimit;

    const [data, total_items] = await Promise.all([
      this.prisma.emailLog.findMany({
        where: {
          to_email: {
            equals: candidateEmail,
            mode: 'insensitive',
          },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: safeLimit,
      }),
      this.prisma.emailLog.count({
        where: {
          to_email: {
            equals: candidateEmail,
            mode: 'insensitive',
          },
        },
      }),
    ]);

    return {
      data,
      current_page: safePage,
      items_per_page: safeLimit,
      total_items,
    };
  }
}
