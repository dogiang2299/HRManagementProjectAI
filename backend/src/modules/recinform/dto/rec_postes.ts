import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class RecruitmentPlanPostedDto {
  @IsOptional()
  @IsDateString()
  posted_date?: string;

  @IsOptional()
  @IsDateString()
  expiration_date?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  job_board?: string;
}
