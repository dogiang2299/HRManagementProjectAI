import { IsOptional, IsString, IsUUID, IsInt, IsDateString, IsArray } from 'class-validator';

export class CreateInterviewScheduleDto {
  @IsOptional()
  @IsString()
  sche_code?: string;

  @IsOptional()
  @IsDateString()
  interview_date?: Date;

  @IsOptional()
  @IsString()
  interview_location?: string;

  @IsOptional()
  @IsString()
  interview_room?: string;

  @IsOptional()
  @IsUUID()
  company_id?: string;

  @IsInt()
  time_duration: number;

  @IsOptional()
  @IsDateString()
  times?: Date;

  @IsOptional()
  @IsUUID()
  type_schedule?: string;
  
  @IsOptional()
  @IsString()
  meeting_link?: string;

  @IsOptional()
  @IsString()
  note?: string;
  
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  candidate_ids?: string[];

  @IsOptional()
  @IsUUID()
  recruitment_infor_id?: string;
}
