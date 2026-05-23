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
import { PositionGroupService } from './position_group.service';
import { CreatePositionGroupDTO } from './dto/create_position_group';
import { UpdatePositionGroupDTO } from './dto/update_position_group';
import { PositionGroupFilterType } from './dto/filter_type';
import { PositionGroupPaginType } from './dto/pagin_type';
import { Position_Group } from '@prisma/client';
import { extractActorFromRequest } from 'src/common/utils/request-actor.util';

@Controller('position-group')
export class PositionGroupController {
  constructor(private readonly positionGroupService: PositionGroupService) {}

  @Post()
  create(@Body() data: CreatePositionGroupDTO, @Req() req: any): Promise<Position_Group> {
    const actor = extractActorFromRequest(req);
    return this.positionGroupService.create(data, actor as any);
  }

  @Get()
  getAll(@Query() filter: PositionGroupFilterType, @Req() req: any): Promise<PositionGroupPaginType> {
    const actor = extractActorFromRequest(req);
    return this.positionGroupService.getAll(filter, actor as any);
  }

  @Get(':id')
  getByID(@Param('id') id: string, @Req() req: any): Promise<Position_Group | null> {
    const actor = extractActorFromRequest(req);
    return this.positionGroupService.getByID(id, actor as any);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() data: UpdatePositionGroupDTO,
    @Req() req: any,
  ): Promise<Position_Group> {
    const actor = extractActorFromRequest(req);
    return this.positionGroupService.update(id, data, actor as any);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Req() req: any): Promise<Position_Group> {
    const actor = extractActorFromRequest(req);
    return this.positionGroupService.delete(id, actor as any);
  }
}
