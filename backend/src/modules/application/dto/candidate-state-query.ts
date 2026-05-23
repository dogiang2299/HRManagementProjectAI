import { IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class CandidateApplicationStateQueryDto {
  @IsUUID()
  @IsNotEmpty()
  recruitment_infor_id: string;

  @IsUUID()
  @IsOptional()
  employee_id?: string;
}
