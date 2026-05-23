import { Test, TestingModule } from '@nestjs/testing';
import { TrainlevService } from './trainlev.service';

describe('TrainlevService', () => {
  let service: TrainlevService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TrainlevService],
    }).compile();

    service = module.get<TrainlevService>(TrainlevService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
