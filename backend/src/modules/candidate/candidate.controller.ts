import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
  UnauthorizedException,
} from '@nestjs/common';
import { Candidate } from '@prisma/client';
import { CandidateService } from './candidate.service';
import { ApplicationService } from '../application/application.service';
import { CreateCandidateDto } from './dto/create';
import { CandidateFilterType } from './dto/filter_type';
import { PotentialCandidateFilterType } from './dto/potential_filter_type';
import { CandidatePaginType } from './dto/pagin_type';
import { UpdateCandidateDto } from './dto/update';
import { UpdateCandidateCareerPreferencesDto } from './dto/update_career_preferences';
import { UpdateCandidateBasicInfoDto } from './dto/update_basic_info';
import { FileInterceptor } from '@nestjs/platform-express';
import { extractActorFromRequest } from 'src/common/utils/request-actor.util';
import { diskStorage } from 'multer';
import path from 'path';
import type { Response } from "express";
import * as fs from "fs";
function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
}
const cvInterceptor = FileInterceptor('cv', {
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const ok = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ].includes(file.mimetype);

    cb(ok ? null : new Error('Invalid file type'), ok);
  },
  storage: diskStorage({
    destination: './uploads/cv',
    filename: (req, file, cb) => {
      const safe = sanitizeFilename(file.originalname);
      const ext = safe.includes('.') ? safe.split('.').pop() : '';
      const base = ext ? safe.slice(0, -(ext.length + 1)) : safe;
      const filename = `${Date.now()}-${base}.${ext || 'file'}`;
      cb(null, filename);
    },
  }),
});

const avatarInterceptor = FileInterceptor('avatar', {
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
    ].includes(file.mimetype);

    cb(ok ? null : new Error('Invalid file type'), ok);
  },
  storage: diskStorage({
    destination: './uploads/avatar',
    filename: (req, file, cb) => {
      const safe = sanitizeFilename(file.originalname);
      const ext = safe.includes('.') ? safe.split('.').pop() : '';
      const base = ext ? safe.slice(0, -(ext.length + 1)) : safe;
      const filename = `${Date.now()}-${base}.${ext || 'file'}`;
      cb(null, filename);
    },
  }),
});
@Controller('candidate')
export class CandidateController {
  constructor(
    private readonly candidateService: CandidateService,
    private readonly applicationService: ApplicationService,
  ) {}

  @Post()
  create(@Body() data: CreateCandidateDto, @Req() req: any): Promise<Candidate> {
    const actor = extractActorFromRequest(req);
    return this.candidateService.create(data, actor);
  }
  @Get(":id/cv")
  async getCv(@Param("id") id: string, @Res() res: Response) {
    const candidate = await this.candidateService.getByID(id);

    if (!candidate.cv_file) throw new NotFoundException("Candidate has no CV");

    const filePath = path.join(process.cwd(), "uploads", "cv", candidate.cv_file);
    if (!fs.existsSync(filePath)) throw new NotFoundException("CV file not found on server");

    // inline để preview trên browser; muốn download force thì dùng attachment
    return res.sendFile(filePath);
  }
  @Get()
  getAll(@Query() filter: CandidateFilterType, @Req() req: any): Promise<CandidatePaginType> {
    const actor = extractActorFromRequest(req);
    return this.candidateService.getAll(filter, actor as any);
  }

  @Get('potential')
  getPotentialCandidates(
    @Query() filter: PotentialCandidateFilterType,
    @Req() req: any,
  ): Promise<CandidatePaginType> {
    const actor = extractActorFromRequest(req);
    return this.candidateService.getPotentialCandidates(filter, actor as any);
  }

  @Get('me')
  async getMyProfile(@Req() req: any) {
    const actor = extractActorFromRequest(req);
    const employeeId =
      (actor as any)?.actorEmployeeId ||
      req?.headers?.['x-employee-id'] ||
      req?.headers?.['X-Employee-Id'];

    if (!employeeId) {
      throw new BadRequestException('employee_id is required');
    }

    return this.candidateService.getMyProfileByEmployee(employeeId);
  }

@Patch('me/career-preferences')
async updateMyCareerPreferences(
  @Req() req: Request,
  @Body() dto: UpdateCandidateCareerPreferencesDto,
) {
  const actor = extractActorFromRequest(req);

  if (!actor?.actorEmployeeId) {
    throw new UnauthorizedException('Bạn chưa đăng nhập');
  }

  return this.candidateService.updateCareerPreferencesByEmployee(
    actor.actorEmployeeId,
    dto,
  );
}

  @Patch('me/basic-info')
  async updateMyBasicInfo(
    @Req() req: any,
    @Body() dto: UpdateCandidateBasicInfoDto,
  ) {
    const actor = extractActorFromRequest(req);
    const employeeId =
      actor?.actorEmployeeId ||
      req?.headers?.['x-employee-id'] ||
      req?.headers?.['X-Employee-Id'];

    if (!employeeId) {
      throw new UnauthorizedException('Bạn chưa đăng nhập');
    }

    return this.candidateService.updateBasicInfoByEmployee(employeeId, dto, actor);
  }

  @Get('career-options')
  async getCareerOptions() {
    return this.candidateService.getCareerOptions();
  }

  @Put('me/cv')
@UseInterceptors(cvInterceptor)
async uploadMyCv(
  @UploadedFile() file: Express.Multer.File,
  @Req() req: any,
) {
  if (!file) {
    throw new BadRequestException('cv file is required');
  }

  const actor = extractActorFromRequest(req);
  const employeeId =
    actor?.actorEmployeeId ||
    req?.headers?.['x-employee-id'] ||
    req?.headers?.['X-Employee-Id'];

  if (!employeeId) {
    throw new BadRequestException('employee_id is required');
  }

  const myProfile = await this.candidateService.getMyProfileByEmployee(employeeId);
  const updated = await this.candidateService.replaceCv(
    myProfile.id,
    file.filename,
    actor,
  );

  return {
    message: 'Upload CV success',
    cv_file: updated.cv_file,
    cv_url: updated.cv_file ? `/candidate/${myProfile.id}/cv` : null,
    cv_uploaded_at: updated.cv_uploaded_at,
    
  };
}

  @Put('me/avatar')
  @UseInterceptors(avatarInterceptor)
  async uploadMyAvatar(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('avatar file is required');
    }

    const actor = extractActorFromRequest(req);
    const employeeId =
      actor?.actorEmployeeId ||
      req?.headers?.['x-employee-id'] ||
      req?.headers?.['X-Employee-Id'];

    if (!employeeId) {
      throw new UnauthorizedException('Bạn chưa đăng nhập');
    }

    const updated = await this.candidateService.replaceAvatarByEmployee(
      employeeId,
      file.filename,
      actor,
    );

    return {
      message: 'Upload avatar success',
      avatar_file: updated.avatar_file,
      avatar_url: updated.avatar_file ? `/uploads/avatar/${updated.avatar_file}` : null,
      avatar_uploaded_at: updated.avatar_uploaded_at,
    };
  }

  @Get(':id')
  getByID(@Param('id') id: string, @Req() req: any): Promise<Candidate> {
    const actor = extractActorFromRequest(req);
    return this.candidateService.getByID(id, actor as any);
  }

  @Get(':id/applications')
  async getApplicationsByCandidate(@Param('id') id: string, @Req() req: any) {
    const actor = extractActorFromRequest(req);
    return this.applicationService.getApplicationsByCandidateId(id, actor as any);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() body: UpdateCandidateDto,
    @Req() req: any,
  ): Promise<Candidate> {
    const actor = extractActorFromRequest(req);
    return this.candidateService.update(id, body, actor);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Req() req: any): Promise<Candidate> {
    const actor = extractActorFromRequest(req);
    return this.candidateService.delete(id, actor);
  }

  @Post('upload-cv')
  @UseInterceptors(cvInterceptor)
  async uploadCvPost(
    @UploadedFile() file: Express.Multer.File,
    @Body('candidate_id') candidateId: string,
    @Req() req: any,
  ) {
    if (!candidateId) throw new BadRequestException('candidate_id is required');
    if (!file) throw new BadRequestException('cv file is required');

    const actor = extractActorFromRequest(req);
    const updated = await this.candidateService.replaceCv(candidateId, file.filename, actor);

    return {
      message: 'Upload CV success',
      cv_file: updated.cv_file,
      cv_url: updated.cv_file ? `/uploads/cv/${updated.cv_file}` : null,
      cv_uploaded_at: updated.cv_uploaded_at,
    };
  }

  @Put(':id/cv')
  @UseInterceptors(cvInterceptor)
  async uploadCvPut(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    if (!file) throw new BadRequestException('cv file is required');

    const actor = extractActorFromRequest(req);
    const updated = await this.candidateService.replaceCv(id, file.filename, actor);

    return {
      message: 'Replace CV success',
      cv_file: updated.cv_file,
      cv_url: updated.cv_file ? `/uploads/cv/${updated.cv_file}` : null,
      cv_uploaded_at: updated.cv_uploaded_at,
    };
  }

  @Post('upload-avatar')
  @UseInterceptors(avatarInterceptor)
  async uploadAvatarPost(
    @UploadedFile() file: Express.Multer.File,
    @Body('candidate_id') candidateId: string,
    @Req() req: any,
  ) {
    if (!candidateId) throw new BadRequestException('candidate_id is required');
    if (!file) throw new BadRequestException('avatar file is required');

    const actor = extractActorFromRequest(req);
    const updated = await this.candidateService.replaceAvatar(candidateId, file.filename, actor);

    return {
      message: 'Upload avatar success',
      avatar_file: updated.avatar_file,
      avatar_url: updated.avatar_file ? `/uploads/avatar/${updated.avatar_file}` : null,
      avatar_uploaded_at: updated.avatar_uploaded_at,
    };
  }

  @Put(':id/avatar')
  @UseInterceptors(avatarInterceptor)
  async uploadAvatarPut(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    if (!file) throw new BadRequestException('avatar file is required');

    const actor = extractActorFromRequest(req);
    const updated = await this.candidateService.replaceAvatar(id, file.filename, actor);

    return {
      message: 'Replace avatar success',
      avatar_file: updated.avatar_file,
      avatar_url: updated.avatar_file ? `/uploads/avatar/${updated.avatar_file}` : null,
      avatar_uploaded_at: updated.avatar_uploaded_at,
    };
  }
}
