import { Controller } from '@nestjs/common';
import { Body, Delete, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { ApplicationService } from './application.service';
import { CreateApplicationDto } from './dto/create';
import { CandidateApplyDto } from './dto/candidate-apply';
import { CandidateApplicationStateQueryDto } from './dto/candidate-state-query';
import { UpdateApplicationStatusDto } from './dto/update';
import { ApplicationFilterDto } from './dto/filter';
import { ApplicationPerformanceQueryDto } from './dto/performance-query';
import { ApplicationRejectedQueryDto } from './dto/rejected-query';
import { extractActorFromRequest } from 'src/common/utils/request-actor.util';
import { FileInterceptor } from '@nestjs/platform-express';
import { UseInterceptors, UploadedFile } from '@nestjs/common';
import { diskStorage } from 'multer';
import { applyCvInterceptor, sanitizeFilename } from './utils';


@Controller('applications')
export class ApplicationController {
  constructor(private readonly applicationService: ApplicationService) {}

  @Post()
  create(@Body() body: CreateApplicationDto, @Req() req: any) {
    const actor = extractActorFromRequest(req);
    return this.applicationService.create(body, actor);
  }

  @Post('candidate/apply')
  @UseInterceptors(applyCvInterceptor)
  applyForJob(
    @Body() body: CandidateApplyDto,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    const actor = extractActorFromRequest(req);
    return this.applicationService.applyForJob(body, file, actor);
  }

  @Get('candidate/state')
  getCandidateApplicationState(
    @Query() query: CandidateApplicationStateQueryDto,
    @Req() req: any,
  ) {
    const actor = extractActorFromRequest(req);
    return this.applicationService.getCandidateApplicationState(query, actor);
  }

  @Get('candidate/me')
  getMyApplications(
    @Query('status') status: string | undefined,
    @Req() req: any,
  ) {
    const actor = extractActorFromRequest(req);
    const employeeId = actor?.actorEmployeeId;
    return this.applicationService.getMyApplicationsByEmployee(employeeId, status);
  }

  @Get()
  findAll(@Query() query: ApplicationFilterDto, @Req() req: any) {
    const actor = extractActorFromRequest(req);
    return this.applicationService.findAll(query, actor);
  }

  @Get('performance/summary')
  getPerformanceSummary(@Query() query: ApplicationPerformanceQueryDto, @Req() req: any) {
    const actor = extractActorFromRequest(req);
    return this.applicationService.getPerformanceSummary(query, actor);
  }

  @Get('rejected/summary')
  getRejectedSummary(@Query() query: ApplicationRejectedQueryDto, @Req() req: any) {
    const actor = extractActorFromRequest(req);
    return this.applicationService.getRejectedSummary(query, actor);
  }

  @Get('recruitment/:recruitmentId/candidates')
  getCandidatesByRecruitmentAndStatus(
    @Param('recruitmentId') recruitmentId: string,
    @Query('status') status: string,
  ) {
    return this.applicationService.findCandidatesByRecruitmentAndStatus(
      recruitmentId,
      status,
    );
  }
@Patch(':id/accept-contact')
acceptContactRequest(@Param('id') id: string, @Req() req: any) {
  const actor = extractActorFromRequest(req);
  return this.applicationService.acceptContactRequest(id, actor);
}

@Patch(':id/decline-contact')
declineContactRequest(@Param('id') id: string, @Req() req: any) {
  const actor = extractActorFromRequest(req);
  return this.applicationService.declineContactRequest(id, actor);
}
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.applicationService.findOne(id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() body: UpdateApplicationStatusDto,
    @Req() req: any,
  ) {
    const actor = extractActorFromRequest(req);
    return this.applicationService.updateStatus(id, body, actor);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    const actor = extractActorFromRequest(req);
    return this.applicationService.remove(id, actor);
  }
}
