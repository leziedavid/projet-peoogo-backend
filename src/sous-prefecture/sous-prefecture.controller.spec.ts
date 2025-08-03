import { Test, TestingModule } from '@nestjs/testing';
import { SousPrefectureController } from './sous-prefecture.controller';

describe('SousPrefectureController', () => {
  let controller: SousPrefectureController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SousPrefectureController],
    }).compile();

    controller = module.get<SousPrefectureController>(SousPrefectureController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
