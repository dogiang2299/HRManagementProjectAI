import { Test, TestingModule } from '@nestjs/testing';
import { CompanyRegisterController } from './company_register.controller';

describe('CompanyRegisterController', () => {
  let controller: CompanyRegisterController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CompanyRegisterController],
    }).compile();

    controller = module.get<CompanyRegisterController>(CompanyRegisterController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
