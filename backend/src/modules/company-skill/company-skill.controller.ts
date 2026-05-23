import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { extractActorFromRequest } from 'src/common/utils/request-actor.util';
import { CompanySkillService } from './company-skill.service';
import {
  CreateCompanySkillDto,
  CreateCustomCompanySkillDto,
} from './dto/create-company-skill.dto';

@Controller('company-skills')
export class CompanySkillController {
  constructor(private readonly companySkillService: CompanySkillService) {}

  @Get('search')
  search(@Query('keyword') keyword: string, @Req() req: any) {
    return this.companySkillService.search(
      keyword,
      extractActorFromRequest(req),
    );
  }

  @Get()
  findActive(@Req() req: any) {
    return this.companySkillService.findActive(extractActorFromRequest(req));
  }

  @Post()
  add(@Body() body: CreateCompanySkillDto, @Req() req: any) {
    return this.companySkillService.add(body, extractActorFromRequest(req));
  }

  @Post('custom')
  createCustom(@Body() body: CreateCustomCompanySkillDto, @Req() req: any) {
    return this.companySkillService.createCustom(body, extractActorFromRequest(req));
  }

  @Delete(':skill_id')
  remove(@Param('skill_id') skillId: string, @Req() req: any) {
    return this.companySkillService.remove(skillId, extractActorFromRequest(req));
  }

  @Patch(':skill_id/restore')
  restore(@Param('skill_id') skillId: string, @Req() req: any) {
    return this.companySkillService.restore(skillId, extractActorFromRequest(req));
  }
}
