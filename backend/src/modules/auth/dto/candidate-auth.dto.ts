import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MinLength } from "class-validator";

export class CandidateRegisterDTO {
  @IsOptional()
  @IsString()
  employee_name?: string;

  @IsEmail()
  @IsNotEmpty()
  email_account: string;

  @IsNotEmpty()
  @Matches(/^[0-9]{9,15}$/, { message: "phone_account must be 9-15 digits" })
  phone_account: string;

  @IsNotEmpty()
  @MinLength(6)
  password: string;
}

export class CandidateLoginDTO {
  @IsNotEmpty()
  @Matches(/^[0-9]{9,15}$/, { message: "phone_account must be 9-15 digits" })
  phone_account: string;

  @IsNotEmpty()
  password: string;
}
