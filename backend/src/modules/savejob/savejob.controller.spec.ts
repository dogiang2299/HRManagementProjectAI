import { Test, TestingModule } from '@nestjs/testing';
import { SavejobController } from './savejob.controller';

describe('SavejobController', () => {
  let controller: SavejobController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SavejobController],
    }).compile();

    controller = module.get<SavejobController>(SavejobController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
