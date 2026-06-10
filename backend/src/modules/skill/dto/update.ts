import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';

export class UpdateSkillDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsUUID()
  parent_id?: string;

  @IsOptional()
  @IsUUID()
  unit_id?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  aliases?: string[];

  @IsOptional()
  @IsString()
  taxonomy_group?: string;

  @IsOptional()
  @IsString()
  taxonomy_subgroup?: string;

  @IsOptional()
  @IsUUID()
  taxonomy_group_node_id?: string;

  @IsOptional()
  @IsUUID()
  taxonomy_subgroup_node_id?: string;

  @IsOptional()
  @IsString()
  scope?: string;

  @IsOptional()
  @IsUUID()
  company_id?: string;

  @IsOptional()
  @IsBoolean()
  is_verified?: boolean;

  @IsOptional()
  @IsUUID()
  merged_to_skill_id?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateSkillDto)
  children?: UpdateSkillDto[];

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
