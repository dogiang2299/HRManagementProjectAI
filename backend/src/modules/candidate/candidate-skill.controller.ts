import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { CandidateSkillService } from './candidate-skill.service';
import { extractActorFromRequest } from 'src/common/utils/request-actor.util';

@Controller('candidate')
export class CandidateSkillController {
  constructor(private readonly skillService: CandidateSkillService) {}

  @Get(':id/skills')
  async getSkills(@Param('id') id: string) {
    return this.skillService.getCandidateSkills(id);
  }

  @Post(':id/skills')
  async addSkill(
    @Param('id') id: string,
    @Body() body: { skill_id?: string; skill_name?: string },
    @Req() req: any,
  ) {
    // optional: actor for audit in future
    extractActorFromRequest(req);

    if (body.skill_id) {
      return this.skillService.addSkillById(id, body.skill_id);
    }

    if (body.skill_name) {
      return this.skillService.addSkillByName(id, body.skill_name.trim());
    }

    return { error: 'skill_id or skill_name required' };
  }

  @Delete(':id/skills/:skillId')
  async deleteSkill(@Param('id') id: string, @Param('skillId') skillId: string, @Req() req: any) {
    extractActorFromRequest(req);
    return this.skillService.removeSkill(id, skillId);
  }
}
