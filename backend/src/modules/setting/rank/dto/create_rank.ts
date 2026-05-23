import {
  IsOptional,
  IsString,
  IsUUID,
  IsBoolean,
  MaxLength,
  IsIn,
} from 'class-validator';
import { RANK_STATUS_VALUES } from 'src/constant';

export class CreateRankDTO {

  @IsOptional()
  @IsString()
  @MaxLength(50)
  rank_code?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  name_rank?: string;

  @IsOptional()
  @IsUUID()
  unit_id?: string;

  @IsOptional()
  @IsString()
  @IsIn(RANK_STATUS_VALUES)
  @MaxLength(50)
  status?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}