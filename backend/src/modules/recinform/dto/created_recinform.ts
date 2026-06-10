import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { RecOtherCost } from './other_cost';
import { RecruitmentPlanDto } from './rec_plan';

export const EXPERIENCE_TYPE_OPTIONS = [
  'none',
  'exact',
  'range',
  'above',
  'below',
  'flexible',
] as const;

export type ExperienceType = (typeof EXPERIENCE_TYPE_OPTIONS)[number];

export class RecruitmentSkillDto {
  @IsUUID()
  skill_id: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  level?: number;

  @IsOptional()
  @IsBoolean()
  is_required?: boolean;
}

export class CreateRecruitmentInforDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  recruitment_code?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  channel_cost?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  other_cost?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
    
  @IsOptional()
  @IsString()
  @MaxLength(300)
  internal_title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  post_title?: string;

  @IsUUID()
  department_id: string;

  @IsUUID()
  rank_id: string;

  @IsUUID()
  work_location_id: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  type_of_job?: string;

  @IsOptional()
  @IsString()
  @IsIn(EXPERIENCE_TYPE_OPTIONS)
  @MaxLength(50)
  experience_type?: ExperienceType;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  experience_min?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  experience_max?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  experience_label?: string;

  @IsOptional()
  @IsDateString()
  application_deadline?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  salary_from?: number;


  @Type(() => Number)
  @IsNumber()
  total_needed?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  salary_to?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  salary_currency?: string;

  @IsString()
  position_post_id: string

  @IsOptional()
  @IsUUID()
  contact_person_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  status?: string;

   
  @IsOptional()
  @IsArray()
  @ValidateNested({each:true})
  @Type(() => RecOtherCost)
  other_costs?: RecOtherCost[]

  @IsArray()
  @IsOptional()
  @ValidateNested({each: true})
  @Type(() => RecruitmentPlanDto)
  plan?: RecruitmentPlanDto[]

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => RecruitmentSkillDto)
  skills?: RecruitmentSkillDto[]

  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  skill_ids?: string[]
}
