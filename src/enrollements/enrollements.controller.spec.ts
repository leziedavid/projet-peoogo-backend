import { Test, TestingModule } from '@nestjs/testing';
import { EnrollementsController } from './enrollements.controller';

describe('EnrollementsController', () => {
  let controller: EnrollementsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EnrollementsController],
    }).compile();

    controller = module.get<EnrollementsController>(EnrollementsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
