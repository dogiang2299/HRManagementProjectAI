import { Module } from '@nestjs/common';
import { CandidateReviewController } from './candidate_review.controller';
import { JwtModule } from "@nestjs/jwt";
import { AuditLogModule } from '../audit_log/audit_log.module';
import { CandidateReviewService } from './candidate_review.service';
@Module({
  imports: [
    AuditLogModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || "secret", // phải giống secret bạn sign token
    }),
  ],
  controllers: [CandidateReviewController],
  providers: [CandidateReviewService]
})
export class CandidateReviewModule {}
