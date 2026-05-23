import { Test, TestingModule } from '@nestjs/testing';
import { PositionPostController } from './position_post.controller';

describe('PositionPostController', () => {
  let controller: PositionPostController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PositionPostController],
    }).compile();

    controller = module.get<PositionPostController>(PositionPostController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
