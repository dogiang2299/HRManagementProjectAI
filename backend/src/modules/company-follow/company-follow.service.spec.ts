import { Test, TestingModule } from '@nestjs/testing';
import { CompanyFollowService } from './company-follow.service';

describe('CompanyFollowService', () => {
  let service: CompanyFollowService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CompanyFollowService],
    }).compile();

    service = module.get<CompanyFollowService>(CompanyFollowService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
