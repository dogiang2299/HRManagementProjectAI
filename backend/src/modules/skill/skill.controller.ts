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
import { CreateTaxonomyNodeDto } from './dto/create-taxonomy-node';
import { UpdateTaxonomyNodeDto } from './dto/update-taxonomy-node';
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

  @Get('taxonomy/tree')
  getTaxonomyTree(
    @Query('search') search?: string,
    @Query('missing_only') missingOnly?: string,
  ) {
    return this.service.getTaxonomyTree({
      search,
      missing_only:
        missingOnly === 'true' || missingOnly === '1' || missingOnly === 'yes',
    });
  }

  @Get('taxonomy/options')
  getTaxonomyOptions() {
    return this.service.getTaxonomyOptions();
  }

  @Get('taxonomy-nodes/tree')
  getTaxonomyNodeTree(
    @Query('search') search?: string,
    @Query('missing_only') missingOnly?: string,
  ) {
    return this.service.getTaxonomyNodeTree({
      search,
      missing_only:
        missingOnly === 'true' || missingOnly === '1' || missingOnly === 'yes',
    });
  }

  @Get('taxonomy-nodes/options')
  getTaxonomyNodeOptions() {
    return this.service.getTaxonomyNodeOptions();
  }

  @Get('taxonomy-nodes/catalog')
  getTaxonomyNodesCatalog() {
    return this.service.getTaxonomyNodesCatalog();
  }

  @Get('taxonomy-nodes/summary')
  getTaxonomyNodeSummary() {
    return this.service.getTaxonomyNodeSummary();
  }

  @Post('taxonomy-nodes')
  createTaxonomyNode(@Body() body: CreateTaxonomyNodeDto) {
    return this.service.createTaxonomyNode(body);
  }

  @Put('taxonomy-nodes/:nodeId')
  updateTaxonomyNode(
    @Param('nodeId') nodeId: string,
    @Body() body: UpdateTaxonomyNodeDto,
  ) {
    return this.service.updateTaxonomyNode(nodeId, body);
  }

  @Delete('taxonomy-nodes/:nodeId')
  softDeleteTaxonomyNode(@Param('nodeId') nodeId: string) {
    return this.service.softDeleteTaxonomyNode(nodeId);
  }

  @Post('taxonomy')
  saveTaxonomySkill(@Body() body: CreateSkillDto) {
    return this.service.saveTaxonomySkill(body);
  }

  @Put('taxonomy/:id')
  updateTaxonomySkill(
    @Param('id') id: string,
    @Body() body: UpdateSkillDto,
  ) {
    return this.service.updateTaxonomySkill(id, body);
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

  @Get('search')
  searchSkills(
    @Query('keyword') keyword?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.searchSkills(keyword, Number(limit) || 20);
  }

  @Get('position-skill-tree')
  getPositionSkillTree(@Query('search') search?: string) {
    return this.service.getPositionSkillTree({ search });
  }

  @Get('position/:positionId/skills')
  getSkillsForPosition(@Param('positionId') positionId: string) {
    return this.service.getSkillsForPosition(positionId);
  }

  @Post('position/:positionId/skills')
  addSkillToPosition(
    @Param('positionId') positionId: string,
    @Body() body: { skill_id?: string },
  ) {
    return this.service.addSkillToPosition(positionId, body?.skill_id);
  }

  @Delete('position/:positionId/skills/:skillId')
  removeSkillFromPosition(
    @Param('positionId') positionId: string,
    @Param('skillId') skillId: string,
  ) {
    return this.service.removeSkillFromPosition(positionId, skillId);
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
