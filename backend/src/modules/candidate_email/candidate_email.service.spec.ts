import { Test, TestingModule } from '@nestjs/testing';
import { CandidateEmailService } from './candidate_email.service';

describe('CandidateEmailService', () => {
  let service: CandidateEmailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CandidateEmailService],
    }).compile();

    service = module.get<CandidateEmailService>(CandidateEmailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
