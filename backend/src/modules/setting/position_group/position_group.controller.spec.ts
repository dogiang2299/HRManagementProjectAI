import { Test, TestingModule } from '@nestjs/testing';
import { PositionGroupController } from './position_group.controller';

describe('PositionGroupController', () => {
  let controller: PositionGroupController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PositionGroupController],
    }).compile();

    controller = module.get<PositionGroupController>(PositionGroupController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
