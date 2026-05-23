import { Test, TestingModule } from '@nestjs/testing';
import { CompanyRegisterService } from './company_register.service';

describe('CompanyRegisterService', () => {
  let service: CompanyRegisterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CompanyRegisterService],
    }).compile();

    service = module.get<CompanyRegisterService>(CompanyRegisterService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
