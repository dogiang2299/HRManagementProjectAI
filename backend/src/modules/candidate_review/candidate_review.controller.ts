import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { CreateCandidateReviewDto } from "./dto/create";
import { UpdateCandidateReviewDto } from "./dto/update";
import { CandidateReviewService } from "./candidate_review.service";

@Controller()
export class CandidateReviewController {
  constructor(
    private service: CandidateReviewService,
    private jwtService: JwtService,
  ) {}

  private async getAuth(req: any) {
    const auth = req.headers?.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    if (!token) throw new UnauthorizedException("Missing Bearer token");

    let payload: any;
    try {
      payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.ACCESS_TOKEN_SECRET,
      });
    } catch (error: any) {
      if (error?.name === "TokenExpiredError") {
        throw new UnauthorizedException("Access token expired");
      }
      throw new UnauthorizedException("Invalid access token");
    }

    const userId = payload.id; // token payload user id
    const rawRole = payload.roles?.[0];
    const role =
      typeof rawRole === "string"
        ? rawRole
        : rawRole?.role?.name_role || rawRole?.name_role || rawRole?.name || "";

    if (!userId) throw new UnauthorizedException("Token missing user id");
    return { userId, role };
  }

  @Get("candidate/:id/reviews")
  list(@Param("id") candidateId: string) {
    return this.service.listByCandidate(candidateId);
  }
  
  @Post("candidate/:id/reviews")
  async create(@Param("id") candidateId: string, @Req() req: any, @Body() dto: CreateCandidateReviewDto) {
    const { userId, role } = await this.getAuth(req);
    
    return this.service.create(candidateId, userId, role, dto);
  }

  @Patch("reviews/:reviewId")
  async update(@Param("reviewId") reviewId: string, @Req() req: any, @Body() dto: UpdateCandidateReviewDto) {
    const { userId, role } = await this.getAuth(req);
    return this.service.update(reviewId, userId, role, dto);
  }

  @Delete("reviews/:reviewId")
  async remove(@Param("reviewId") reviewId: string, @Req() req: any) {
    const { userId, role } = await this.getAuth(req);
    return this.service.remove(reviewId, userId, role);
  }
}