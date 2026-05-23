import { Test, TestingModule } from '@nestjs/testing';
import { CandidateReviewController } from './candidate_review.controller';

describe('CandidateReviewController', () => {
  let controller: CandidateReviewController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CandidateReviewController],
    }).compile();

    controller = module.get<CandidateReviewController>(CandidateReviewController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
