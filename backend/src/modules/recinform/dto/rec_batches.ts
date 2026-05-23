import { IsDateString, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class RecruitmentPlanBatchDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  batches_title?: string;

  @IsOptional()
  @IsDateString()
  from_date?: string;

  @IsOptional()
  @IsDateString()
  to_date?: string;

  @IsOptional()
  @IsInt()
  number_recruitment?: number;

  @IsOptional()
  @IsDateString()
  monthly_target?: string;
}
