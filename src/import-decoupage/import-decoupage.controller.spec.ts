import { Test, TestingModule } from '@nestjs/testing';
import { ImportDecoupageController } from './import-decoupage.controller';

describe('ImportDecoupageController', () => {
  let controller: ImportDecoupageController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ImportDecoupageController],
    }).compile();

    controller = module.get<ImportDecoupageController>(ImportDecoupageController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
