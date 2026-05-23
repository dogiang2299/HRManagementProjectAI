import { Test, TestingModule } from '@nestjs/testing';
import { InterviewScheService } from './interview_sche.service';

describe('InterviewScheService', () => {
  let service: InterviewScheService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InterviewScheService],
    }).compile();

    service = module.get<InterviewScheService>(InterviewScheService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
