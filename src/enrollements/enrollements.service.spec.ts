import { Test, TestingModule } from '@nestjs/testing';
import { EnrollementsService } from './enrollements.service';

describe('EnrollementsService', () => {
  let service: EnrollementsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EnrollementsService],
    }).compile();

    service = module.get<EnrollementsService>(EnrollementsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
