import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  IsDateString,
  MaxLength,
  IsUUID,
} from "class-validator";

export class CreateInforCompanyDTO {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  infor_code?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  full_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  acronym_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  business_type?: string;

  @IsOptional()
  @IsString()
  @MaxLength(13)
  tax_idennumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  code_company?: string;

  @IsOptional()
  @IsDateString()
  date_stablish?: string;

  @IsOptional()
  @IsString()
  image_logo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  code_business?: string;

  @IsOptional()
  @IsDateString()
  date_of_issue?: string;

  @IsOptional()
  @IsString()
  place_of_issue?: string;

  @IsOptional()
  @IsString()
  employee_quantity?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  short_address?: string;

  @IsOptional()
  @IsString()
  map_link?: string;

  @IsOptional()
  @IsString()
  @MaxLength(15)
  phone_number?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  fax?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  website?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  status?: string; // VD: "đang theo dõi" | "ngừng theo dõi"

  @IsOptional()
  @IsUUID()
  field_of_activity_id?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
