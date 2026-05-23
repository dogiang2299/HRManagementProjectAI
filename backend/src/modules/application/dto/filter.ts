import { IsOptional, IsString, IsUUID } from 'class-validator';

export class ApplicationFilterDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsUUID()
  candidate_id?: string;

  @IsOptional()
  @IsUUID()
  recruitment_infor_id?: string;

  @IsOptional()
  @IsString()
  status?: string;
}