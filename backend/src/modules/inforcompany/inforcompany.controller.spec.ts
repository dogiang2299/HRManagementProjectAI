import { Test, TestingModule } from '@nestjs/testing';
import { InforcompanyController } from './inforcompany.controller';

describe('InforcompanyController', () => {
  let controller: InforcompanyController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InforcompanyController],
    }).compile();

    controller = module.get<InforcompanyController>(InforcompanyController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
