import { Test, TestingModule } from '@nestjs/testing';
import { ReversementService } from './reversement.service';

describe('ReversementService', () => {
  let service: ReversementService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReversementService],
    }).compile();

    service = module.get<ReversementService>(ReversementService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
