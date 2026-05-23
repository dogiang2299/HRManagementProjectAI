import { Module } from '@nestjs/common';
import { PositionPostController } from './position_post.controller';
import { PositionPostService } from './position_post.service';

@Module({
  controllers: [PositionPostController],
  providers: [PositionPostService]
})
export class PositionPostModule {}
