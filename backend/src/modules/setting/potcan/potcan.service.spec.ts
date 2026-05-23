import { Test, TestingModule } from '@nestjs/testing';
import { PotcanService } from './potcan.service';

describe('PotcanService', () => {
  let service: PotcanService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PotcanService],
    }).compile();

    service = module.get<PotcanService>(PotcanService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
