import { Module } from '@nestjs/common';
import { CompanySkillController } from './company-skill.controller';
import { CompanySkillService } from './company-skill.service';

@Module({
  controllers: [CompanySkillController],
  providers: [CompanySkillService],
  exports: [CompanySkillService],
})
export class CompanySkillModule {}
