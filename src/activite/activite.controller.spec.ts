import { Test, TestingModule } from '@nestjs/testing';
import { ActiviteController } from './activite.controller';

describe('ActiviteController', () => {
  let controller: ActiviteController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ActiviteController],
    }).compile();

    controller = module.get<ActiviteController>(ActiviteController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
