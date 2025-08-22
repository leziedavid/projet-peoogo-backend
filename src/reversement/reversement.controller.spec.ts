import { Test, TestingModule } from '@nestjs/testing';
import { ReversementController } from './reversement.controller';

describe('ReversementController', () => {
  let controller: ReversementController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReversementController],
    }).compile();

    controller = module.get<ReversementController>(ReversementController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
