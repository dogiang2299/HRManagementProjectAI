import { IsOptional, IsString } from 'class-validator';

export class BlogPostQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  page?: string | number;

  @IsOptional()
  limit?: string | number;
}
