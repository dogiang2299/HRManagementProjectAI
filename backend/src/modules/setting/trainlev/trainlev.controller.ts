
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { Setting_Training_Level } from '@prisma/client';
import { TrainingLevelFilterType } from './dto/filter_type';
import { TrainingLevelPaginType } from './dto/pagin_type';
import { CreateTrainingLevelDTO } from './dto/create_trainlev';
import { UpdateTrainingLevelDTO } from './dto/update_trainlev';
import { TrainlevService } from './trainlev.service';

@Controller('training-level')
export class TrainlevController {
  constructor(private trainingLevelService: TrainlevService) {}

  @Post()
  create(
    @Body() data: CreateTrainingLevelDTO,
  ): Promise<Setting_Training_Level> {
    return this.trainingLevelService.create(data);
  }

  @Get()
  getAll(
    @Query() filter: TrainingLevelFilterType,
  ): Promise<TrainingLevelPaginType> {
    return this.trainingLevelService.getAll(filter);
  }

  @Get(':id')
  getByID(
    @Param('id') id: string,
  ): Promise<Setting_Training_Level | null> {
    return this.trainingLevelService.getByID(id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() body: UpdateTrainingLevelDTO,
  ): Promise<Setting_Training_Level> {
    return this.trainingLevelService.update(id, body);
  }

  @Delete(':id')
  delete(
    @Param('id') id: string,
  ): Promise<Setting_Training_Level> {
    return this.trainingLevelService.delete(id);
  }
}