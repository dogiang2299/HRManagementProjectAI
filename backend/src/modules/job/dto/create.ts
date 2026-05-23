import { IsArray, IsBoolean, IsDateString, IsOptional, IsString, IsUUID, IsInt, IsIn } from 'class-validator';
import { JOB_STATUS_VALUES, type JobStatusType } from 'src/constant';

export class CreateJobDto {
  @IsOptional()
  @IsString()
  job_code?: string;

  @IsOptional()
  @IsString()
  name_job?: string;

  @IsOptional()
  @IsString()
  description_job?: string;

  @IsOptional()
  @IsString()
  type_job?: string;

  @IsOptional()
  @IsString()
  result_job?: string;

  @IsUUID()
  employee_id: string;

  @IsOptional()
  @IsDateString()
  deadline?: Date;

  @IsOptional()
  @IsBoolean()
  remind_enabled?: boolean;

  @IsOptional()
  @IsInt()
  remind_before_minutes?: number;

  @IsOptional()
  @IsIn(JOB_STATUS_VALUES)
  status?: JobStatusType;

  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  candidate_ids?: string[];
}