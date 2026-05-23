import { IsBooleanString, IsOptional, IsString } from "class-validator";
import { Type } from "class-transformer";

export class QueryNotificationDto {
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;

  @IsOptional()
  @IsBooleanString()
  is_read?: string;

  @IsOptional()
  @IsString()
  type?: string;
}