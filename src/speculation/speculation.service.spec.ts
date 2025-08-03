import { Test, TestingModule } from '@nestjs/testing';
import { SpeculationService } from './speculation.service';

describe('SpeculationService', () => {
  let service: SpeculationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SpeculationService],
    }).compile();

    service = module.get<SpeculationService>(SpeculationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
