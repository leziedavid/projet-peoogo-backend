import { Test, TestingModule } from '@nestjs/testing';
import { LocaliteController } from './localite.controller';

describe('LocaliteController', () => {
  let controller: LocaliteController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LocaliteController],
    }).compile();

    controller = module.get<LocaliteController>(LocaliteController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
