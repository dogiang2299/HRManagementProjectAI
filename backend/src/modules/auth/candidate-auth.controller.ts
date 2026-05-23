import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { CandidateLoginDTO, CandidateRegisterDTO } from "./dto/candidate-auth.dto";

@Controller("it-job")
export class CandidateAuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  register(@Body() body: CandidateRegisterDTO) {
    return this.authService.registerCandidate(body);
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  login(@Body() body: CandidateLoginDTO) {
    return this.authService.loginCandidate(body);
  }
}
