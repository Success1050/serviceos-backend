import { Test, TestingModule } from '@nestjs/testing';
import { InternalTicketController } from './internal-ticket.controller';

describe('InternalTicketController', () => {
  let controller: InternalTicketController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InternalTicketController],
    }).compile();

    controller = module.get<InternalTicketController>(InternalTicketController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
