import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req } from '@nestjs/common';
import { Job } from '@prisma/client';
import { extractActorFromRequest } from 'src/common/utils/request-actor.util';
import { CreateJobDto } from './dto/create';
import { JobFilterType } from './dto/filter_type';
import { JobPaginType } from './dto/pagin_type';
import { UpdateJobDto } from './dto/update';
import { JobService } from './job.service';

@Controller('jobs')
export class JobController {
  constructor(private readonly service: JobService) {}

  @Post()
  create(
    @Body() body: CreateJobDto,
    @Req() req: any,
  ): Promise<Job> {
    const actor = extractActorFromRequest(req);
    return this.service.create(body, actor);
  }

  @Get()
  getAll(
    @Query() params: JobFilterType,
    @Req() req: any,
  ): Promise<JobPaginType> {
    const actor = extractActorFromRequest(req);
    return this.service.getAll({
      ...params,
      pages: Number(params.pages) || 1,
      items_per_pages: Number(params.items_per_pages) || 10,
    }, actor);
  }

  @Get(':id')
  getById(
    @Param('id') id: string,
  ): Promise<Job | null> {
    return this.service.getById(id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() body: UpdateJobDto,
    @Req() req: any,
  ): Promise<Job | null> {
    const actor = extractActorFromRequest(req);
    return this.service.update(id, body, actor);
  }

  @Delete(':id')
  delete(
    @Param('id') id: string,
    @Req() req: any,
  ): Promise<Job> {
    const actor = extractActorFromRequest(req);
    return this.service.delete(id, actor);
  }
}