import { Test, TestingModule } from '@nestjs/testing';
import { ActiviteService } from './activite.service';

describe('ActiviteService', () => {
  let service: ActiviteService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ActiviteService],
    }).compile();

    service = module.get<ActiviteService>(ActiviteService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
