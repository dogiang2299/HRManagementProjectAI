import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsArray, IsUUID } from 'class-validator';
import { CreateInterviewScheduleDto } from './create';

export class UpdateInterviewScheduleDto extends PartialType(
  CreateInterviewScheduleDto,
) {
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  interviewer_ids?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  candidate_ids?: string[];
}