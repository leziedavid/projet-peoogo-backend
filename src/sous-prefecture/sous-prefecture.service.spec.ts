import { Test, TestingModule } from '@nestjs/testing';
import { SousPrefectureService } from './sous-prefecture.service';

describe('SousPrefectureService', () => {
  let service: SousPrefectureService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SousPrefectureService],
    }).compile();

    service = module.get<SousPrefectureService>(SousPrefectureService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
