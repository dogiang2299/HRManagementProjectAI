import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from "class-validator";

import { GenderEmployee } from "@prisma/client";
export class CreateEmployeeDTO {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  emp_code?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  employee_name?: string;

  @IsString()
  @MinLength(6)
  @MaxLength(100)
  password!: string;

  @IsOptional()
  @IsDateString()
  date_of_birth?: string;

  @IsOptional()
  @IsEnum(GenderEmployee)
  gender?: GenderEmployee;

  @IsOptional()
  @IsString()
  address?: string;
 
   @IsOptional()
  @IsString()
  avatar?: string;
  @IsOptional()
  @IsEmail()
  @MaxLength(100)
  email?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  status!: string;

  @IsEmail()
  @MaxLength(100)
  email_account: string;

  @IsString()
  @MaxLength(15)
  phone_account: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsUUID('4')
  company_id?: string;

    // ✅ hỗ trợ mảng role ids (multi-role)
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  role_ids?: string[];

  // ✅ nếu m đang dùng roles_id ở chỗ khác thì giữ luôn (alias)
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  roles_id?: string[];
}