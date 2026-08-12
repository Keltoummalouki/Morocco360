import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminBookingsService } from './admin-bookings.service';
import { Order, OrderStatus } from '../orders/entities/order.entity';
import { Ticket, TicketStatus } from '../orders/entities/ticket.entity';

function chainableQb(rows: unknown[], total: number) {
  const qb: Record<string, jest.Mock> = {};
  for (const m of [
    'leftJoinAndSelect',
    'loadRelationCountAndMap',
    'andWhere',
    'orderBy',
    'skip',
    'take',
  ]) {
    qb[m] = jest.fn().mockReturnValue(qb);
  }
  qb.getManyAndCount = jest.fn().mockResolvedValue([rows, total]);
  return qb;
}

describe('AdminBookingsService', () => {
  let service: AdminBookingsService;
  let orderRepo: jest.Mocked<Repository<Order>>;
  let ticketRepo: jest.Mocked<Repository<Ticket>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminBookingsService,
        {
          provide: getRepositoryToken(Order),
          useValue: {
            createQueryBuilder: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn((v) => Promise.resolve(v)),
          },
        },
        {
          provide: getRepositoryToken(Ticket),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(AdminBookingsService);
    orderRepo = module.get(getRepositoryToken(Order));
    ticketRepo = module.get(getRepositoryToken(Ticket));
  });

  describe('list', () => {
    it('filters by status and eventId', async () => {
      const qb = chainableQb([], 0);
      orderRepo.createQueryBuilder.mockReturnValue(qb as never);

      await service.list({
        page: 1,
        limit: 20,
        status: OrderStatus.PAID,
        eventId: 3,
      });

      expect(qb.andWhere).toHaveBeenCalledWith('o.status = :status', {
        status: OrderStatus.PAID,
      });
      expect(qb.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('tk.event_id = :eventId'),
        { eventId: 3 },
      );
    });
  });

  describe('setStatus', () => {
    it('suspends the order and cascades VALID tickets to SUSPENDED', async () => {
      orderRepo.findOne.mockResolvedValue({
        id: 1,
        tickets: [],
      } as unknown as Order);

      await service.setStatus(1, OrderStatus.SUSPENDED);

      expect(orderRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: OrderStatus.SUSPENDED }),
      );
      expect(ticketRepo.update).toHaveBeenCalledWith(
        expect.objectContaining({ order: { id: 1 } }),
        { status: TicketStatus.SUSPENDED },
      );
    });
  });
});
