import { Test, TestingModule } from '@nestjs/testing';
import { ImportDecoupageService } from './import-decoupage.service';

describe('ImportDecoupageService', () => {
  let service: ImportDecoupageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ImportDecoupageService],
    }).compile();

    service = module.get<ImportDecoupageService>(ImportDecoupageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
