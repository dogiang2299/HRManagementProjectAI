import { IsOptional, IsString, MaxLength } from "class-validator";

export class CreateAiDraftDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;
}
