import { Test, TestingModule } from '@nestjs/testing';
import { PotcanController } from './potcan.controller';

describe('PotcanController', () => {
  let controller: PotcanController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PotcanController],
    }).compile();

    controller = module.get<PotcanController>(PotcanController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
