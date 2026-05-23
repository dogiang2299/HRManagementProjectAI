import { 
  IsOptional, 
  IsString, 
  IsUUID, 
  IsBoolean, 
  MaxLength,
  IsIn,
} from "class-validator";
import { POSITION_POST_STATUS_VALUES } from "src/constant";

export class CreatePositionPostDTO {

  @IsOptional()
  @IsString()
  @MaxLength(50)
  position_code?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  name_post?: string;

  @IsOptional()
  @IsUUID()
  unit_id?: string;

  @IsOptional()
  @IsString()
  description_post?: string;

  @IsOptional()
  @IsString()
  requirements_post?: string;

  @IsOptional()
  @IsString()
  benefits_post?: string;

  @IsOptional()
  @IsUUID()
  Setting_Process_Recruitment_id?: string;

  @IsOptional()
  @IsBoolean()
  auto_rotation?: boolean;

  @IsOptional()
  @IsBoolean()
  auto_eli_candidate?: boolean;

  @IsOptional()
  @IsBoolean()
  auto_near?: boolean;

  @IsOptional()
  @IsString()
  @IsIn(POSITION_POST_STATUS_VALUES)
  @MaxLength(50)
  status?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  benefit_more?: {
    competitive_salary?: string;
    professional_environment?: string;
    training_and_development?: string;
    career_opportunities?: string;
    allowances_and_welfare?: string;
  };
}
