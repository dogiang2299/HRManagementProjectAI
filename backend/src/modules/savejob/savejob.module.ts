import { Module } from '@nestjs/common';
import { SavejobController } from './savejob.controller';
import { SavejobService } from './savejob.service';

@Module({
  controllers: [SavejobController],
  providers: [SavejobService]
})
export class SavejobModule {}
