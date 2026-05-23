import { Test, TestingModule } from '@nestjs/testing';
import { CompanyFollowController } from './company-follow.controller';

describe('CompanyFollowController', () => {
  let controller: CompanyFollowController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CompanyFollowController],
    }).compile();

    controller = module.get<CompanyFollowController>(CompanyFollowController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
