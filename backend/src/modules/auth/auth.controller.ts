import { Body, Controller, HttpCode, HttpStatus, Injectable, Post } from "@nestjs/common";
import { ChangePasswordDto, LoginDTO, RegisterDTO, RegisterResponseDto } from "./dto/auth.dto";
import { Employee } from "generated/prisma/browser";
import { AuthService } from "./auth.service";
import { ForgotPasswordDto, VerifyForgotPasswordOtpDto, ResetPasswordByOtpDto } from "./dto/forgot-password.dto";


@Controller('auth')
export class AuthController{
    constructor(private authService: AuthService){}
    @Post('register')
    register(
    @Body() body: RegisterDTO
    ): Promise<RegisterResponseDto> {
    return this.authService.register(body);
    }

    @Post('login')
    @HttpCode(HttpStatus.OK) // trả 200 cho "login" (không phải create)
    login(@Body() body: LoginDTO) {
    return this.authService.login(body);
    }

    @Post('check-user')
    @HttpCode(HttpStatus.OK)
    checkUser (@Body('phone_account') phone_account: string){
        return this.authService.checkUserByPhone(phone_account);
    }

    @Post('change-password')
    @HttpCode(HttpStatus.OK)
    changePassword(@Body() dto: ChangePasswordDto){
        return this.authService.changePassword(dto.user_id, dto.new_password);
    }
    @Post('forgot-password')
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.authService.forgotPassword(body.email_account);
  }

  @Post('verify-forgot-password-otp')
  async verifyForgotPasswordOtp(@Body() body: VerifyForgotPasswordOtpDto) {
    return this.authService.verifyForgotPasswordOtp(
      body.email_account,
      body.otp_code,
    );
  }

  @Post('reset-password-by-otp')
  async resetPasswordByOtp(@Body() body: ResetPasswordByOtpDto) {
    return this.authService.resetPasswordByOtp(
      body.email_account,
      body.otp_code,
      body.new_password,
    );
  }
}