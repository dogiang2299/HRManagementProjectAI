import { Module } from '@nestjs/common';
import { InterviewScheController } from './interview_sche.controller';
import { InterviewScheService } from './interview_sche.service';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [NotificationModule],
  controllers: [InterviewScheController],
  providers: [InterviewScheService]
})
export class InterviewScheModule {}
