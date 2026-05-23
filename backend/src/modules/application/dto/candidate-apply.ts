import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CandidateApplyDto {
  @IsUUID()
  @IsNotEmpty()
  recruitment_infor_id!: string;

  @IsUUID()
  @IsOptional()
  candidate_cv_id?: string;

  @IsUUID()
  @IsOptional()
  employee_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  cover_letter?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  preferred_location?: string;
}
