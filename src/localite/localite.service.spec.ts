import { Test, TestingModule } from '@nestjs/testing';
import { LocaliteService } from './localite.service';

describe('LocaliteService', () => {
  let service: LocaliteService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LocaliteService],
    }).compile();

    service = module.get<LocaliteService>(LocaliteService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
