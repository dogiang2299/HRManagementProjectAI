
import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { SendEmailToCandidateDto } from '../candidate_email/dto/send-email-to-candidate.dto';
import { CandidateEmailService } from './candidate_email.service';
import { extractActorFromRequest } from 'src/common/utils/request-actor.util';

@Controller('candidate-email')
export class CandidateEmailController {
  constructor(private readonly candidateEmailService: CandidateEmailService) {}

  @Post('send')
  async sendToCandidate(@Body() body: SendEmailToCandidateDto, @Req() req: any) {
    const actor = extractActorFromRequest(req);
    return this.candidateEmailService.sendToCandidate(body, actor as any);
  }

  @Get(':candidateId/logs')
  async getEmailLogs(
    @Param('candidateId') candidateId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Req() req?: any,
  ) {
    const actor = extractActorFromRequest(req);
    return this.candidateEmailService.getEmailLogsByCandidate(
      candidateId,
      Number(page) || 1,
      Number(limit) || 10,
      actor as any,
    );
  }
}