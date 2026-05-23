import { Module } from '@nestjs/common';
import { CompanyRegisterController } from './company_register.controller';
import { CompanyRegisterService } from './company_register.service';

@Module({
  controllers: [CompanyRegisterController],
  providers: [CompanyRegisterService]
})
export class CompanyRegisterModule {}
