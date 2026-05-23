import { Module } from '@nestjs/common';
import { PotcanController } from './potcan.controller';
import { PotcanService } from './potcan.service';

@Module({
  controllers: [PotcanController],
  providers: [PotcanService]
})
export class PotcanModule {}
