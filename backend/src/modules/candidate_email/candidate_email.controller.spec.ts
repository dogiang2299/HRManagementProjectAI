import { Test, TestingModule } from '@nestjs/testing';
import { CandidateEmailController } from './candidate_email.controller';

describe('CandidateEmailController', () => {
  let controller: CandidateEmailController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CandidateEmailController],
    }).compile();

    controller = module.get<CandidateEmailController>(CandidateEmailController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
