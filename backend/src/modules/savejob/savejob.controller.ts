import { Controller, Get, Param, Post, Req, UnauthorizedException } from '@nestjs/common';
import { SavejobService } from './savejob.service';
import { extractActorFromRequest } from 'src/common/utils/request-actor.util';

@Controller('savejob')
export class SavejobController {
  constructor(private readonly savedJobService: SavejobService) {}

  @Post('toggle/:recruitmentInforId')
  async toggleSaveJob(
    @Param('recruitmentInforId') recruitmentInforId: string,
    @Req() req: any,
  ) {
    const actor = extractActorFromRequest(req);
    const employeeId = actor?.actorEmployeeId;

    if (!employeeId) {
      throw new UnauthorizedException('Unauthorized');
    }

    return this.savedJobService.toggleSaveJobByEmployee(employeeId, recruitmentInforId);
  }

  @Get('me')
  async getMySavedJobs(@Req() req: any) {
    const actor = extractActorFromRequest(req);
    const employeeId = actor?.actorEmployeeId;

    if (!employeeId) {
      throw new UnauthorizedException('Unauthorized');
    }

    return this.savedJobService.getMySavedJobsByEmployee(employeeId);
  }

  @Get('check/:recruitmentInforId')
  async checkSaved(
    @Param('recruitmentInforId') recruitmentInforId: string,
    @Req() req: any,
  ) {
    const actor = extractActorFromRequest(req);
    const employeeId = actor?.actorEmployeeId;

    if (!employeeId) {
      throw new UnauthorizedException('Unauthorized');
    }

    return this.savedJobService.checkSavedByEmployee(employeeId, recruitmentInforId);
  }
}