import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class SendEmailToCandidateDto {
  @IsUUID()
  @IsNotEmpty()
  candidate_id: string;

  @IsUUID()
  @IsOptional()
  template_id?: string;

  @IsString()
  @IsOptional()
  subject?: string;

  @IsString()
  @IsOptional()
  body?: string;
}