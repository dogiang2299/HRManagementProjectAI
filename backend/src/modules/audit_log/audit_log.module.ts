import { Module } from '@nestjs/common';
import { AuditLogController } from './audit_log.controller';
import { AuditLogService } from './audit_log.service';

@Module({
  controllers: [AuditLogController],
  providers: [AuditLogService],
  exports: [AuditLogService],
})
export class AuditLogModule {}
