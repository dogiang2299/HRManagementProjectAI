import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import { Skill } from '@prisma/client';
import { SkillService } from './skill.service';
import { SkillFilterType } from './dto/filter_type';
import { SkillPaginType } from './dto/pagin_type';
import { CreateSkillDto } from './dto/create';
import { UpdateSkillDto } from './dto/update';
import { extractActorFromRequest } from 'src/common/utils/request-actor.util';

@Controller('skills')
export class SkillController {
  constructor(private readonly service: SkillService) {}

  @Post()
  create(@Body() body: CreateSkillDto, @Req() req: any): Promise<Skill> {
    const actor = extractActorFromRequest(req);
    return this.service.create(body, actor as any);
  }

  @Get()
  getAll(
    @Query() params: SkillFilterType,
    @Req() req: any,
  ): Promise<SkillPaginType> {
    const actor = extractActorFromRequest(req);
    return this.service.getAll({
      ...params,
      pages: Number(params.pages) || 1,
      items_per_pages: Number(params.items_per_pages) || 10,
    }, actor as any);
  }

  @Get('global-search')
  globalSearch(
    @Query('keyword') keyword?: string,
    @Query('limit') limit?: string,
    @Req() req?: any,
  ) {
    const actor = extractActorFromRequest(req);
    return this.service.globalSearch(keyword, Number(limit) || 20, actor as any);
  }

  @Get('tree')
  getTree(@Req() req: any) {
    const actor = extractActorFromRequest(req);
    return this.service.getTree(actor as any);
  }

  @Get(':id')
  getById(
    @Param('id') id: string,
    @Req() req: any,
  ): Promise<Skill | null> {
    const actor = extractActorFromRequest(req);
    return this.service.getById(id, actor as any);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() body: UpdateSkillDto,
    @Req() req: any,
  ): Promise<Skill> {
    const actor = extractActorFromRequest(req);
    return this.service.update(id, body, actor as any);
  }

  @Delete(':id')
  delete(
    @Param('id') id: string,
    @Req() req: any,
  ): Promise<Skill> {
    const actor = extractActorFromRequest(req);
    return this.service.delete(id, actor as any);
  }
}
