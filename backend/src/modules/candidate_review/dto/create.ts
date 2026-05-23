import { IsNumber, IsOptional, IsString, Max, Min } from "class-validator";

export class CreateCandidateReviewDto {
  @IsNumber()
  @Min(0)
  @Max(5)
  rating: number; // FE gửi 3.5, 4.0...

  @IsOptional()
  @IsString()
  comment?: string;

}