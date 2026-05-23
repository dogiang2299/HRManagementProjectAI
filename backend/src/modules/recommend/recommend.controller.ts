import {
  Controller,
  Get,
  Query,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { RecommendationService } from './recommend.service';
import { extractActorFromRequest } from 'src/common/utils/request-actor.util';

class GetMyRecommendationsQueryDto {
  page?: string;
  limit?: string;
}

@Controller('recommendations')
export class RecommendationController {
  constructor(
    private readonly recommendationService: RecommendationService,
  ) {}

  @Get('my-jobs')
async getMyRecommendedJobs(
  @Req() req: Request,
  @Query() query: GetMyRecommendationsQueryDto,
) {
  const rawPage = Number(query?.page);
  const rawLimit = Number(query?.limit);
  const page =
    Number.isFinite(rawPage) && rawPage > 0
      ? Math.floor(rawPage)
      : 1;
  const limit =
    Number.isFinite(rawLimit) && rawLimit > 0
      ? Math.min(rawLimit, 50)
      : 9;

  const actor = extractActorFromRequest(req);

  if (!actor?.actorEmployeeId) {
    throw new UnauthorizedException('Bạn chưa đăng nhập');
  }

  const result =
    await this.recommendationService.getStoredRecommendationsForCurrentCandidate(
      actor,
      { page, limit },
    );

  return {
    message: 'Lấy danh sách job gợi ý thành công',
    ...result,
  };
}
}