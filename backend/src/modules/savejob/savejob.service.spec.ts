import { Test, TestingModule } from '@nestjs/testing';
import { SavejobService } from './savejob.service';

describe('SavejobService', () => {
  let service: SavejobService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SavejobService],
    }).compile();

    service = module.get<SavejobService>(SavejobService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
