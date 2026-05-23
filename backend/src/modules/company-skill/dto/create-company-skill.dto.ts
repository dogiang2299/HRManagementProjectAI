import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateCompanySkillDto {
  @IsUUID()
  skill_id: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  source?: string;

  @IsOptional()
  @IsString()
  note?: string;
}

export class CreateCustomCompanySkillDto {
  @IsString()
  @MaxLength(200)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}
