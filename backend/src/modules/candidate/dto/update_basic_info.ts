import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class UpdateCandidateBasicInfoDto {
  @IsOptional()
  @IsString()
  @MaxLength(300)
  candidate_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(15)
  @Matches(/^[0-9]{9,15}$/, {
    message: 'phone_number must be 9-15 digits',
  })
  phone_number?: string;
}
