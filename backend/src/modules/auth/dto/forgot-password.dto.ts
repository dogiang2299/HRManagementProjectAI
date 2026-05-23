import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail()
  @IsNotEmpty()
  email_account: string;
}

export class VerifyForgotPasswordOtpDto {
  @IsEmail()
  @IsNotEmpty()
  email_account: string;

  @IsString()
  @IsNotEmpty()
  otp_code: string;
}

export class ResetPasswordByOtpDto {
  @IsEmail()
  @IsNotEmpty()
  email_account: string;

  @IsString()
  @IsNotEmpty()
  otp_code: string;

  @IsString()
  @MinLength(6)
  new_password: string;
}