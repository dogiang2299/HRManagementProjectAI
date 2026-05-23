import { IsEmail, IsNotEmpty, IsString, IsUUID, Matches, MinLength } from "class-validator";
export class RegisterResponseDto {
  id: string;
  email_account: string;
  phone_account: string;
  status: string;
  emp_code: string | null;
  is_active: boolean;
  created_at: Date;
}
// matches validate cho phone
export class RegisterDTO{
    @IsNotEmpty()
    @MinLength(100)
    @IsEmail()
    email_account: string;

    @MinLength(15)
    @Matches(/^[\+]?[()]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/)
    phone_account: string;

    @IsNotEmpty()
    @MinLength(100)
    password: string;
    
    @IsNotEmpty()
    status: string;
}

export class LoginDTO{
    @IsNotEmpty()
    @IsEmail()
    email_account: string;

    @Matches(/^[\+]?[()]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/)
    phone_account: string;
    
    @IsNotEmpty()
    password: string;
}

export class ChangePasswordDto {
  @IsUUID()
  @IsNotEmpty()
  user_id: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  new_password: string;
}