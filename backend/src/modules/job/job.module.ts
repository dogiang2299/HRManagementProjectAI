import { Module } from '@nestjs/common';
import { JobController } from './job.controller';
import { JobService } from './job.service';
import { AuditLogModule } from '../audit_log/audit_log.module';

@Module({
  imports: [AuditLogModule],
  controllers: [JobController],
  providers: [JobService]
})
export class JobModule {}
