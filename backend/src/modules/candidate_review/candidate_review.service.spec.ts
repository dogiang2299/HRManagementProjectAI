import { Test, TestingModule } from '@nestjs/testing';
import { CandidateReviewService } from './candidate_review.service';

describe('CandidateReviewService', () => {
  let service: CandidateReviewService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CandidateReviewService],
    }).compile();

    service = module.get<CandidateReviewService>(CandidateReviewService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
