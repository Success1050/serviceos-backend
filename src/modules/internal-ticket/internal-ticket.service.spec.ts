import { Test, TestingModule } from '@nestjs/testing';
import { InternalTicketService } from './internal-ticket.service';

describe('InternalTicketService', () => {
  let service: InternalTicketService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InternalTicketService],
    }).compile();

    service = module.get<InternalTicketService>(InternalTicketService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
