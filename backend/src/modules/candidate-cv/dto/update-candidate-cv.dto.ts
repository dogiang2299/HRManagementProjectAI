import { Type } from "class-transformer";
import {
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export class UpdateCandidateCvDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsObject()
  structured_data?: Record<string, any>;

  @IsOptional()
  @IsString()
  raw_text?: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  desired_position?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  years_experience?: number;
}
