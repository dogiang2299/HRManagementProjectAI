import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateRoleDTO {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  role_code: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  name_role?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  status: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
