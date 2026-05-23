import { Test, TestingModule } from '@nestjs/testing';
import { InforcompanyService } from './inforcompany.service';

describe('InforcompanyService', () => {
  let service: InforcompanyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InforcompanyService],
    }).compile();

    service = module.get<InforcompanyService>(InforcompanyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
