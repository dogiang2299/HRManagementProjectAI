import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { Interview_Schedule } from '@prisma/client';
import { CreateInterviewScheduleDto } from './dto/create';
import { InterviewFilterType } from './dto/filter_type';
import { InterviewPaginType } from './dto/pagin_type';
import { UpdateInterviewScheduleDto } from './dto/update';
import { InterviewScheService } from './interview_sche.service';
import { Req } from '@nestjs/common';
import { extractActorFromRequest } from 'src/common/utils/request-actor.util';

@Controller('interview-sche')
export class InterviewScheController {
  constructor(private readonly service: InterviewScheService) {}

  @Post()
  create(
    @Body() body: CreateInterviewScheduleDto,
    @Req() req: any,
  ): Promise<Interview_Schedule> {
    const actor = extractActorFromRequest(req);
    return this.service.create(body, actor as any);
  }

  @Get()
  getAll(
    @Query() params: InterviewFilterType,
    @Req() req: any,
  ): Promise<InterviewPaginType> {
    const actor = extractActorFromRequest(req);
    return this.service.getAll({
      ...params,
      pages: Number(params.pages) || 1,
      items_per_pages: Number(params.items_per_pages) || 10,
    }, actor as any);
  }

  @Get(':id')
  getById(
    @Param('id') id: string,
    @Req() req: any,
  ): Promise<Interview_Schedule | null > {
    const actor = extractActorFromRequest(req);
    return this.service.getById(id, actor as any);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() body: UpdateInterviewScheduleDto,
    @Req() req: any,
  ): Promise<Interview_Schedule | null> {
    const actor = extractActorFromRequest(req);
    return this.service.update(id, body, actor as any);
  }

  @Delete(':id')
  delete(
    @Param('id') id: string,
    @Req() req: any,
  ): Promise<Interview_Schedule> {
    const actor = extractActorFromRequest(req);
    return this.service.delete(id, actor as any);
  }
}