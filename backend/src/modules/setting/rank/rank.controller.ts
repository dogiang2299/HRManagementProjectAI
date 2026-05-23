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
import { RankService } from './rank.service';
import { CreateRankDTO } from './dto/create_rank';
import { UpdateRankDTO } from './dto/update_rank';
import { RankFilterType } from './dto/filter_type';
import { RankPaginType } from './dto/pagin_type';
import { Rank } from '@prisma/client';
import { extractActorFromRequest } from 'src/common/utils/request-actor.util';

@Controller('rank')
export class RankController {
  constructor(private readonly rankService: RankService) {}

  @Post()
  create(@Body() data: CreateRankDTO, @Req() req: any): Promise<Rank> {
    const actor = extractActorFromRequest(req);
    return this.rankService.create(data, actor as any);
  }

  @Get()
  getAll(@Query() filter: RankFilterType, @Req() req: any): Promise<RankPaginType> {
    const actor = extractActorFromRequest(req);
    return this.rankService.getAll(filter, actor as any);
  }

  @Get(':id')
  getByID(@Param('id') id: string, @Req() req: any): Promise<Rank | null> {
    const actor = extractActorFromRequest(req);
    return this.rankService.getByID(id, actor as any);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() body: UpdateRankDTO,
    @Req() req: any,
  ): Promise<Rank> {
    const actor = extractActorFromRequest(req);
    return this.rankService.update(id, body, actor as any);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Req() req: any): Promise<Rank> {
    const actor = extractActorFromRequest(req);
    return this.rankService.delete(id, actor as any);
  }
}