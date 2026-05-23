import { Module } from '@nestjs/common';
import { CandidateController } from './candidate.controller';
import { CandidateSkillController } from './candidate-skill.controller';
import { CandidateService } from './candidate.service';
import { CandidateSkillService } from './candidate-skill.service';
import { AuditLogModule } from '../audit_log/audit_log.module';
import { PrismaModule } from 'src/prisma.module';
import { RecommendationModule } from '../recommend/recommend.module';
import { ApplicationModule } from '../application/application.module';

@Module({
  imports: [AuditLogModule, PrismaModule, RecommendationModule, ApplicationModule],
  controllers: [CandidateController, CandidateSkillController],
  providers: [CandidateService, CandidateSkillService],
  exports: [CandidateService, CandidateSkillService],
})
export class CandidateModule {}