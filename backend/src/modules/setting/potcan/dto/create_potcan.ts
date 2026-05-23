import { IsBoolean, IsOptional, IsString, MaxLength, IsUUID } from 'class-validator';

export class CreatePotentialTypeDTO {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsUUID()
  unit_id?: string;
}