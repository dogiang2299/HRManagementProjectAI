import { Test, TestingModule } from '@nestjs/testing';
import { PositionPostService } from './position_post.service';

describe('PositionPostService', () => {
  let service: PositionPostService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PositionPostService],
    }).compile();

    service = module.get<PositionPostService>(PositionPostService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
