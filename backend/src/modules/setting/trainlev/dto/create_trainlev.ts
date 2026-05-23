import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateTrainingLevelDTO {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  level_code?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  name_level?: string;
}