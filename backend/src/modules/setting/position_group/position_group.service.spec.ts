import { Test, TestingModule } from '@nestjs/testing';
import { PositionGroupService } from './position_group.service';

describe('PositionGroupService', () => {
  let service: PositionGroupService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PositionGroupService],
    }).compile();

    service = module.get<PositionGroupService>(PositionGroupService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
