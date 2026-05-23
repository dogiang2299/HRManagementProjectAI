import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateSettingEmailOtherDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  sec_code?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  name?: string;

  @IsOptional()
  @IsUUID()
  unit_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  subject?: string;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsBoolean()
  auto_send?: boolean;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}