import { Test, TestingModule } from '@nestjs/testing';
import { TrainlevController } from './trainlev.controller';

describe('TrainlevController', () => {
  let controller: TrainlevController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TrainlevController],
    }).compile();

    controller = module.get<TrainlevController>(TrainlevController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
