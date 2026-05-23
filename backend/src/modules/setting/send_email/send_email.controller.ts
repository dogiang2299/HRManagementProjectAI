import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req } from '@nestjs/common';
import { CreateSettingEmailOtherDto } from './dto/create';
import { SettingEmailOtherFilterType } from './dto/filter_type';
import { SettingEmailOtherPaginType } from './dto/pagin_type';
import { UpdateSettingEmailOtherDto } from './dto/update';
import { SendEmailService } from './send_email.service';
import { SettingEmail } from '@prisma/client';
import { extractActorFromRequest } from 'src/common/utils/request-actor.util';
@Controller('send-email')
export class SendEmailController {
  constructor(private readonly sendEmailService: SendEmailService) {}

  @Post()
  create(
    @Body() data: CreateSettingEmailOtherDto,
    @Req() req: any,
  ): Promise<SettingEmail> {
    const actor = extractActorFromRequest(req);
    return this.sendEmailService.create(data, actor as any);
  }

  @Get()
  getAll(
    @Query() filter: SettingEmailOtherFilterType,
    @Req() req: any,
  ): Promise<SettingEmailOtherPaginType> {
    const actor = extractActorFromRequest(req);
    return this.sendEmailService.getAll(filter, actor as any);
  }

  @Get(':id')
  getByID(
    @Param('id') id: string,
    @Req() req: any,
  ): Promise<SettingEmail> {
    const actor = extractActorFromRequest(req);
    return this.sendEmailService.getByID(id, actor as any);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() data: UpdateSettingEmailOtherDto,
    @Req() req: any,
  ): Promise<SettingEmail> {
    const actor = extractActorFromRequest(req);
    return this.sendEmailService.update(id, data, actor as any);
  }

  @Delete(':id')
  delete(
    @Param('id') id: string,
    @Req() req: any,
  ): Promise<SettingEmail> {
    const actor = extractActorFromRequest(req);
    return this.sendEmailService.delete(id, actor as any);
  }
}