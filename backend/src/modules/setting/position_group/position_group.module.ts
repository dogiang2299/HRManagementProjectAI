import { Module } from '@nestjs/common';
import { PositionGroupController } from './position_group.controller';
import { PositionGroupService } from './position_group.service';

@Module({
  controllers: [PositionGroupController],
  providers: [PositionGroupService],
})
export class PositionGroupModule {}
