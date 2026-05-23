import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class UpdateCandidateCareerPreferencesDto {
  @IsOptional()
  @IsUUID()
  desired_position_id?: string | null;

  @IsOptional()
  @IsUUID()
  desired_rank_id?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  preferred_job_type?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  provice?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  district?: string | null;

  @IsOptional()
  @IsString()
  address?: string | null;
}
