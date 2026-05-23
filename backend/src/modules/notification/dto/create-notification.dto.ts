import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from "class-validator";

export class CreateNotificationDto {
  @IsUUID()
  receiver_id!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  receiver_role!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  type!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  related_type?: string;

  @IsOptional()
  @IsUUID()
  related_id?: string;

  @IsOptional()
  @IsBoolean()
  is_read?: boolean;
}