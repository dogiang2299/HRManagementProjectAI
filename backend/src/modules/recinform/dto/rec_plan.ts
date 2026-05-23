import { IsArray, IsDateString, IsInt, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { RecruitmentPlanBatchDto } from './rec_batches';
import { RecruitmentPlanPostedDto } from './rec_postes';

export class RecruitmentPlanDto {
  @IsOptional()
  @IsInt()
  total_real_number?: number;

  @IsOptional()
  @IsDateString()
  monthly_target?: string;

  @IsOptional()
  @IsDateString()
  expected_deadline?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({each: true})
  @Type(() => RecruitmentPlanBatchDto)
  batches?: RecruitmentPlanBatchDto[]

  @IsOptional()
  @IsArray()
  @ValidateNested({each: true})
  @Type(() => RecruitmentPlanPostedDto)
  postes?: RecruitmentPlanPostedDto[]

}
