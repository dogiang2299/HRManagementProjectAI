import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { CandidateAuthController } from './candidate-auth.controller';
import { PrismaService } from 'src/prisma.service';
import { JwtModule } from '@nestjs/jwt';
import { MailModule } from '../mail/mail.module';
  
@Module({
  imports: [JwtModule.register({}), MailModule],
  controllers: [AuthController, CandidateAuthController],
  providers: [AuthService, PrismaService],
  exports: [AuthService],
})
export class AuthModule {}