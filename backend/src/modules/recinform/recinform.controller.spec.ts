import { Test, TestingModule } from '@nestjs/testing';
import { RecinformController } from './recinform.controller';

describe('RecinformController', () => {
  let controller: RecinformController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecinformController],
    }).compile();

    controller = module.get<RecinformController>(RecinformController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
