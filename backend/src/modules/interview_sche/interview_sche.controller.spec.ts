import { Test, TestingModule } from '@nestjs/testing';
import { InterviewScheController } from './interview_sche.controller';

describe('InterviewScheController', () => {
  let controller: InterviewScheController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InterviewScheController],
    }).compile();

    controller = module.get<InterviewScheController>(InterviewScheController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
