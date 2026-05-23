import { Module } from '@nestjs/common';
import { TrainlevController } from './trainlev.controller';
import { TrainlevService } from './trainlev.service';

@Module({
  controllers: [TrainlevController],
  providers: [TrainlevService]
})
export class TrainlevModule {}
