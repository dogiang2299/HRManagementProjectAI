import { Type } from 'class-transformer';
import { IsOptional, IsString, IsUUID, IsDate, MaxLength, IsBoolean, IsArray, ValidateNested } from 'class-validator';
export class CandidateExperienceDto {
  @IsOptional()
  @IsUUID()
  id?: string; 
  
  @IsOptional()
  @IsString()
  company_name?: string;

  @IsOptional()
  @IsString()
  position?: string;

  @IsOptional()
  @IsString()
  from_month?: Date; // nhận string từ client, convert sang Date trong service

  @IsOptional()
  @IsString()
  to_month?: Date;

  @IsOptional()
  @IsString()
  job_description?: string;

  @IsOptional()
  @IsBoolean()
  is_active: boolean
}
export class CreateCandidateDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  candidate_code?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  candidate_name?: string;

  @IsOptional()
  @IsDate()
  date_of_birth?: Date;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  gender?: string;

  @IsOptional()
  @IsString()
  @MaxLength(15)
  phone_number?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  email?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  provice?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsDate()
  date_applied?: Date;

  @IsOptional()
  @IsUUID()
  source_channel_id?: string;

  @IsOptional()
  @IsUUID()
  referrer_id?: string;

  @IsOptional()
  @IsUUID()
  process_id?: string;

  @IsOptional()
  @IsBoolean()
  is_potential?: boolean;

  @IsOptional()
  @IsUUID()
  potential_type_id?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({each: true})
  @Type(() => CandidateExperienceDto)
  candidateExperiences: CandidateExperienceDto[]

  @IsOptional()
  @IsString()
  status: string;
}