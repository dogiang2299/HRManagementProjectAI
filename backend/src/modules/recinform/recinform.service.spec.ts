import { Test, TestingModule } from '@nestjs/testing';
import { RecinformService } from './recinform.service';

describe('RecinformService', () => {
  let service: RecinformService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RecinformService],
    }).compile();

    service = module.get<RecinformService>(RecinformService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
