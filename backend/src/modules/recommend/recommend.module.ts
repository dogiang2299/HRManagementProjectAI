import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma.module';
import { RecruitmentSkillBuilderService } from './recruitment-skill-builder.service';
import { RecommendationController } from './recommend.controller';
import { RecommendationService } from './recommend.service';
import { RecommendationEngineService } from './recommendation-engine.service';

@Module({
  imports: [PrismaModule],
  controllers: [RecommendationController],
  providers: [
    RecommendationService,
    RecruitmentSkillBuilderService,
    RecommendationEngineService,
  ],
  exports: [
    RecommendationService,
    RecruitmentSkillBuilderService,
    RecommendationEngineService,
  ],
})
export class RecommendationModule {}