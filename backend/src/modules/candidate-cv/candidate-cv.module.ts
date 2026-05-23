import { Module } from "@nestjs/common";
import { CandidateModule } from "src/modules/candidate/candidate.module";
import { AuditLogModule } from "src/modules/audit_log/audit_log.module";
import { CandidateCvController } from "./candidate-cv.controller";
import { CandidateCvService } from "./candidate-cv.service";
import { RecommendationModule } from '../recommend/recommend.module';
@Module({
  imports: [CandidateModule, AuditLogModule, RecommendationModule],
  controllers: [CandidateCvController],
  providers: [CandidateCvService],
  exports: [CandidateCvService],
})
export class CandidateCvModule {}
