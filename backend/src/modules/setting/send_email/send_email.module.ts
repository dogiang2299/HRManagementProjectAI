import { Module } from '@nestjs/common';
import { SendEmailController } from './send_email.controller';
import { SendEmailService } from './send_email.service';

@Module({
  controllers: [SendEmailController],
  providers: [SendEmailService]
})
export class SendEmailModule {}
