import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { CandidateCV, Prisma } from "@prisma/client";
import { CandidateService } from "src/modules/candidate/candidate.service";
import { PrismaService } from "src/prisma.service";
import { AuditLogService } from "src/modules/audit_log/audit_log.service";
import { RequestActor } from "src/common/utils/request-actor.util";
import { RecommendationEngineService } from '../recommend/recommendation-engine.service';
import {
  CANDIDATE_CV_SOURCE_TYPE,
  CANDIDATE_CV_STATUS,
  EMPTY_CV_STRUCTURED_DATA,
} from "./constants/candidate-cv.constant";
import { CreateAiDraftDto } from "./dto/create-ai-draft.dto";
import { UpdateCandidateCvDto } from "./dto/update-candidate-cv.dto";

@Injectable()
export class CandidateCvService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly candidateService: CandidateService,
    private readonly auditLogService: AuditLogService,
    private readonly recommendationEngineService: RecommendationEngineService,
  ) {}

  private async resolveCandidateId(actor?: RequestActor) {
    const employeeId = actor?.actorEmployeeId;
    if (!employeeId) {
      throw new UnauthorizedException("Unauthorized");
    }

    const myProfile = await this.candidateService.getMyProfileByEmployee(employeeId);
    if (!myProfile?.id) {
      throw new UnauthorizedException("Candidate profile not found");
    }

    return myProfile.id;
  }

  private async getOwnedCvOrThrow(id: string, candidateId: string) {
    const cv = await this.prisma.candidateCV.findUnique({
      where: { id },
    });

    if (!cv) {
      throw new NotFoundException("CV not found");
    }

    if (cv.candidate_id !== candidateId) {
      throw new ForbiddenException("You can only access your own CV");
    }

    return cv;
  }

  private isCompleted(cv: CandidateCV) {
    return cv.status === CANDIDATE_CV_STATUS.COMPLETED;
  }

  private assertNotArchived(cv: CandidateCV) {
    if (cv.status === CANDIDATE_CV_STATUS.ARCHIVED) {
      throw new BadRequestException("Archived CV cannot be updated");
    }
  }

  private getDefaultAiDraftTitle() {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, "0");
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const yyyy = now.getFullYear();
    return `CV tao bang AI - ${dd}/${mm}/${yyyy}`;
  }

  private extractCvFileName(fileUrl?: string | null, fileName?: string | null) {
    if (fileName && fileName.trim()) return fileName.trim();
    if (!fileUrl) return undefined;

    try {
      const pathname = fileUrl.startsWith("http")
        ? new URL(fileUrl).pathname
        : fileUrl;
      const last = pathname.split("/").pop();
      return last || undefined;
    } catch {
      const last = fileUrl.split("/").pop();
      return last || undefined;
    }
  }

  private async syncPrimaryCVToCandidateProfile(
    tx: Prisma.TransactionClient,
    candidateId: string,
    cv: CandidateCV,
  ) {
    const data: Prisma.CandidateUpdateInput = {
      updated_at: new Date(),
    };

    if (cv.source_type === CANDIDATE_CV_SOURCE_TYPE.UPLOADED_FILE) {
      const fileName = this.extractCvFileName(cv.file_url, cv.file_name);
      if (fileName) {
        data.cv_file = fileName;
        data.cv_uploaded_at = new Date();
      }
    }

    if (typeof cv.raw_text === "string" && cv.raw_text.trim()) {
      data.cv_extracted_text = cv.raw_text;
    }

    if (typeof cv.summary === "string" && cv.summary.trim()) {
      data.career_summary = cv.summary;
    }

    // TODO: map desired_position string into desired_position_id safely when mapping rule is finalized.
    await tx.candidate.update({
      where: { id: candidateId },
      data,
    });
  }

  private validateStructuredDataForComplete(structuredData: unknown) {
    if (!structuredData || typeof structuredData !== "object") {
      throw new BadRequestException("structured_data is required to complete CV");
    }

    const data = structuredData as any;
    const personalInfo = data.personalInfo || {};

    const fullName = String(personalInfo.fullName || "").trim();
    const email = String(personalInfo.email || "").trim();
    const phone = String(personalInfo.phone || "").trim();
    const summary = String(data.summary || "").trim();
    const skills = Array.isArray(data.skills) ? data.skills : [];

    if (!fullName) {
      throw new BadRequestException("personalInfo.fullName is required");
    }

    if (!email && !phone) {
      throw new BadRequestException("personalInfo.email or personalInfo.phone is required");
    }

    if (!summary && skills.length === 0) {
      throw new BadRequestException("skills or summary is required");
    }
  }

  async findMine(actor?: RequestActor) {
    const candidateId = await this.resolveCandidateId(actor);

    return this.prisma.candidateCV.findMany({
      where: { candidate_id: candidateId },
      orderBy: [
        { is_primary: "desc" },
        { updated_at: "desc" },
      ],
      select: {
        id: true,
        title: true,
        source_type: true,
        status: true,
        is_primary: true,
        file_name: true,
        file_url: true,
        desired_position: true,
        years_experience: true,
        created_at: true,
        updated_at: true,
      },
    });
  }

  async findOne(id: string, actor?: RequestActor) {
    const candidateId = await this.resolveCandidateId(actor);
    return this.getOwnedCvOrThrow(id, candidateId);
  }

  async createAiDraft(body: CreateAiDraftDto, actor?: RequestActor) {
    const candidateId = await this.resolveCandidateId(actor);

    return this.prisma.candidateCV.create({
      data: {
        candidate_id: candidateId,
        title: body?.title?.trim() || this.getDefaultAiDraftTitle(),
        source_type: CANDIDATE_CV_SOURCE_TYPE.AI_GENERATED,
        status: CANDIDATE_CV_STATUS.DRAFT,
        structured_data: EMPTY_CV_STRUCTURED_DATA as Prisma.InputJsonValue,
        is_primary: false,
      },
    });
  }

  async update(id: string, body: UpdateCandidateCvDto, actor?: RequestActor) {
    const candidateId = await this.resolveCandidateId(actor);
    const cv = await this.getOwnedCvOrThrow(id, candidateId);
    this.assertNotArchived(cv);

    return this.prisma.candidateCV.update({
      where: { id },
      data: {
        title: body.title ?? undefined,
        structured_data: body.structured_data as Prisma.InputJsonValue | undefined,
        raw_text: body.raw_text ?? undefined,
        summary: body.summary ?? undefined,
        desired_position: body.desired_position ?? undefined,
        years_experience: body.years_experience ?? undefined,
      },
    });
  }

  async complete(id: string, actor?: RequestActor) {
    const candidateId = await this.resolveCandidateId(actor);
    const cv = await this.getOwnedCvOrThrow(id, candidateId);

    if (cv.status === CANDIDATE_CV_STATUS.ARCHIVED) {
      throw new BadRequestException("Archived CV cannot be completed");
    }

    this.validateStructuredDataForComplete(cv.structured_data);

    return this.prisma.candidateCV.update({
      where: { id },
      data: {
        status: CANDIDATE_CV_STATUS.COMPLETED,
      },
    });
  }

  async setPrimary(id: string, actor?: RequestActor) {
    const candidateId = await this.resolveCandidateId(actor);
    const cv = await this.getOwnedCvOrThrow(id, candidateId);

    if (!this.isCompleted(cv)) {
      throw new BadRequestException("Only COMPLETED CV can be set as primary");
    }

    if (cv.status === CANDIDATE_CV_STATUS.ARCHIVED) {
      throw new BadRequestException("Archived CV cannot be set as primary");
    }

    const primaryCv = await this.prisma.$transaction(async (tx) => {
      await tx.candidateCV.updateMany({
        where: {
          candidate_id: candidateId,
          is_primary: true,
        },
        data: {
          is_primary: false,
        },
      });

      const updatedPrimaryCv = await tx.candidateCV.update({
        where: { id },
        data: {
          is_primary: true,
        },
      });

      await this.syncPrimaryCVToCandidateProfile(tx, candidateId, updatedPrimaryCv);
      return updatedPrimaryCv;
    });

    // Rebuild recommendation with the new primary CV
    let recommendationResult: any = null;
    let recommendationError: string | null = null;

    try {
      recommendationResult = await this.recommendationEngineService.rebuildCandidateRecommendation(candidateId);
    } catch (error: any) {
      recommendationError = error?.message || String(error);
      console.error(
        '[RecommendationEngine] Failed to rebuild candidate recommendation after setting primary CV:',
        recommendationError,
      );
    }

    // Log the activity
    await this.auditLogService.logCandidateActivity({
      candidateId,
      action: 'PRIMARY_CV_CHANGED',
      message: recommendationError
        ? 'Set CV as primary, but recommendation rebuild failed'
        : 'Set CV as primary and rebuilt recommendation via FastAPI',
      metadata: {
        cv_id: id,
        cv_title: primaryCv.title,
        cv_file_name: primaryCv.file_name,
        recommendation_status: recommendationError ? 'FAILED' : 'SUCCESS',
        recommendation_error: recommendationError,
        sync_result: recommendationResult?.sync ?? null,
        ranking_result: recommendationResult?.ranking
          ? {
              status: recommendationResult.ranking.status,
              n_ranked_jobs: recommendationResult.ranking.n_ranked_jobs,
            }
          : null,
      },
      ...actor,
    });

    return {
      ...primaryCv,
      recommendation_result: recommendationResult,
      recommendation_error: recommendationError,
    };
  }

  async archive(id: string, actor?: RequestActor) {
    const candidateId = await this.resolveCandidateId(actor);
    const cv = await this.getOwnedCvOrThrow(id, candidateId);

    if (cv.is_primary) {
      throw new BadRequestException("Cannot archive primary CV. Please choose another primary CV first");
    }

    return this.prisma.candidateCV.update({
      where: { id },
      data: {
        status: CANDIDATE_CV_STATUS.ARCHIVED,
      },
    });
  }

  async getPrimaryCV(candidateId: string) {
    return this.prisma.candidateCV.findFirst({
      where: {
        candidate_id: candidateId,
        is_primary: true,
        status: {
          not: CANDIDATE_CV_STATUS.ARCHIVED,
        },
      },
      orderBy: [
        { updated_at: "desc" },
        { created_at: "desc" },
      ],
    });
  }

  async remove(id: string, actor?: RequestActor) {
    const candidateId = await this.resolveCandidateId(actor);
    const cv = await this.getOwnedCvOrThrow(id, candidateId);

    if (cv.is_primary) {
      throw new BadRequestException("Cannot delete primary CV. Please choose another primary CV first");
    }

    return this.prisma.candidateCV.delete({ where: { id } });
  }

}
