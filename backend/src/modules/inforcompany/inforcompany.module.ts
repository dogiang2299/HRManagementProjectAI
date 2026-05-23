import { Module } from '@nestjs/common';
import { InforcompanyController } from './inforcompany.controller';
import { InforcompanyService } from './inforcompany.service';

@Module({
  controllers: [InforcompanyController],
  providers: [InforcompanyService]
})
export class InforcompanyModule {}
