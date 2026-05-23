import {
  IsOptional,
  IsString,
  IsNotEmpty,
  MaxLength,
  IsUUID,
} from 'class-validator';

export class CreatePositionGroupDTO {
  
  @IsNotEmpty()
  @IsString()
  @MaxLength(150)
  name_group: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  unit_id?: string;
}
