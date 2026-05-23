import { ForbiddenException, Injectable, NotFoundException, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { PrismaService } from "src/prisma.service";
import { AuditLogService } from "../audit_log/audit_log.service";
import { CreateCandidateReviewDto } from "./dto/create";
import { UpdateCandidateReviewDto } from "./dto/update";

@UseGuards(AuthGuard("jwt"))
@Injectable()
export class CandidateReviewService {
  constructor(
    private prisma: PrismaService,
    private auditLogService: AuditLogService,
  ) {}

  private normalizeRole(role?: string | null) {
    return (role || "").trim().toLowerCase();
  }

  private canReview(role: string) {
    const r = this.normalizeRole(role);
    return r === "employer" || r === "employee" || r === "admin";
  }

  private canManageReview(role: string) {
    const r = this.normalizeRole(role);
    return r === "employee" || r === "admin";
  }

  async create(candidateId: string, userId: string, role: string, dto: CreateCandidateReviewDto) {
    if (!this.canReview(role)) {
      throw new ForbiddenException("Ban khong co quyen danh gia.");
    }

    const candidate = await this.prisma.candidate.findUnique({
      where: { id: candidateId },
      select: { id: true },
    });
    if (!candidate) throw new NotFoundException("Candidate not found");

    const created = await this.prisma.candidateReview.create({
      data: {
        candidate_id: candidateId,
        reviewer_id: userId,
        rating: dto.rating as any,
        comment: dto.comment,
      },
    });

    await this.auditLogService.logCandidateActivity({
      candidateId,
      actorEmployeeId: userId,
      actorRole: role,
      actorType: "Employee",
      action: "CANDIDATE_REVIEW_CREATED",
      message: "Created candidate review",
      metadata: {
        review_id: created.id,
        rating: dto.rating,
        comment: dto.comment ?? null,
      },
    });

    return created;
  }

  async listByCandidate(candidateId: string) {
    const items = await this.prisma.candidateReview.findMany({
      where: { candidate_id: candidateId, is_active: true },
      orderBy: { created_at: "desc" },
      include: {
        Reviewer: { select: { id: true, employee_name: true } },
      },
    });

    const agg = await this.prisma.candidateReview.aggregate({
      where: { candidate_id: candidateId, is_active: true },
      _avg: { rating: true },
      _count: { rating: true },
    });

    return {
      average: agg._avg.rating ?? 0,
      count: agg._count.rating ?? 0,
      items,
    };
  }

  async update(reviewId: string, userId: string, role: string, dto: UpdateCandidateReviewDto) {
    if (!this.canManageReview(role)) {
      throw new ForbiddenException("Ban khong co quyen sua danh gia.");
    }

    const review = await this.prisma.candidateReview.findUnique({ where: { id: reviewId } });
    if (!review || !review.is_active) throw new NotFoundException("Review not found");

    const updated = await this.prisma.candidateReview.update({
      where: { id: reviewId },
      data: {
        rating: dto.rating !== undefined ? (dto.rating as any) : undefined,
        comment: dto.comment,
      },
    });

    await this.auditLogService.logCandidateActivity({
      candidateId: review.candidate_id,
      actorEmployeeId: userId,
      actorRole: role,
      actorType: "Employee",
      action: "CANDIDATE_REVIEW_UPDATED",
      message: "Updated candidate review",
      metadata: {
        review_id: reviewId,
        old_rating: review.rating,
        new_rating: updated.rating,
        old_comment: review.comment ?? null,
        new_comment: updated.comment ?? null,
      },
    });

    return updated;
  }

  async remove(reviewId: string, userId: string, role: string) {
    if (!this.canManageReview(role)) {
      throw new ForbiddenException("Khong co quyen xoa.");
    }

    const review = await this.prisma.candidateReview.findUnique({ where: { id: reviewId } });
    if (!review || !review.is_active) throw new NotFoundException("Review not found");

    const deleted = await this.prisma.candidateReview.update({
      where: { id: reviewId },
      data: { is_active: false },
    });

    await this.auditLogService.logCandidateActivity({
      candidateId: review.candidate_id,
      actorEmployeeId: userId,
      actorRole: role,
      actorType: "Employee",
      action: "CANDIDATE_REVIEW_DELETED",
      message: "Deleted candidate review",
      metadata: {
        review_id: reviewId,
        rating: review.rating,
        comment: review.comment ?? null,
      },
    });

    return deleted;
  }
}
