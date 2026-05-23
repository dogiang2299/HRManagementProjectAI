import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { MailModule } from 'src/modules/mail/mail.module';
import { CandidateEmailService } from './candidate_email.service';
import { CandidateEmailController } from './candidate_email.controller';

@Module({
  imports: [MailModule],
  controllers: [CandidateEmailController],
  providers: [CandidateEmailService, PrismaService],
  exports: [CandidateEmailService],
})
export class CandidateEmailModule {}