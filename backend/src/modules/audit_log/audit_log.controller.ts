import { Controller, Get, Param, Query } from '@nestjs/common';
import { AuditLogService } from './audit_log.service';

@Controller('candidate')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get(':id/audit-logs')
  listByCandidate(
    @Param('id') candidateId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.auditLogService.getCandidateHistory(
      candidateId,
      Number(page) || 1,
      Number(limit) || 20,
    );
  }
}
