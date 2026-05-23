import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { CompanyRegisterService } from './company_register.service';
import { CreateCompanyRegistrationDto } from './dto/create';
import { CompanyRegistrationFilterType } from './dto/filter_type';
import { CompanyRegistrationPaginType } from './dto/pagin_type';
import { UpdateCompanyRegistrationDto } from './dto/update';

@Controller('company-register')
export class CompanyRegisterController {
  constructor(private readonly service: CompanyRegisterService) {}

  @Post()
  create(@Body() data: CreateCompanyRegistrationDto) {
    return this.service.create(data);
  }

  @Get()
  getAll(@Query() filter: CompanyRegistrationFilterType): Promise<CompanyRegistrationPaginType> {
    return this.service.getAll(filter);
  }

  @Get(':id')
  getByID(@Param('id') id: string) {
    return this.service.getByID(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: UpdateCompanyRegistrationDto) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}