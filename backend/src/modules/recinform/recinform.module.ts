import { Module } from '@nestjs/common';
import { RecinformController } from './recinform.controller';
import { RecinformService } from './recinform.service';
import { PrismaModule } from 'src/prisma.module';
import { RecommendationModule } from '../recommend/recommend.module';

@Module({
  imports: [PrismaModule, RecommendationModule],
  controllers: [RecinformController],
  providers: [RecinformService],
  exports: [RecinformService],
})
export class RecinformModule {}