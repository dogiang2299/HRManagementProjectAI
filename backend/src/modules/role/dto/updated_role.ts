import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateRoleDTO {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name_role?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  status: string;  
}
