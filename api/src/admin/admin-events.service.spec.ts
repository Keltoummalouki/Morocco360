/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { AdminEventsService } from './admin-events.service';
import { Event, EventStatus } from '../events/entities/event.entity';
import { EventStaff } from '../events/entities/event-staff.entity';
import { TicketCategory } from '../events/entities/ticket-category.entity';
import { Order } from '../orders/entities/order.entity';
import { Ticket } from '../orders/entities/ticket.entity';
import { User } from '../users/entities/user.entity';
import { City } from '../settings/entities/city.entity';
import { EventCategory } from '../settings/entities/event-category.entity';

function chainableQb(rows: unknown[], total: number) {
  const qb: Record<string, jest.Mock> = {};
  for (const m of ['leftJoinAndSelect', 'andWhere', 'where', 'orderBy', 'skip', 'take']) {
    qb[m] = jest.fn().mockReturnValue(qb);
  }
  qb.getManyAndCount = jest.fn().mockResolvedValue([rows, total]);
  return qb;
}

describe('AdminEventsService', () => {
  let service: AdminEventsService;
  let eventRepo: jest.Mocked<Repository<Event>>;
  let staffRepo: jest.Mocked<Repository<EventStaff>>;
  let ticketCategoryRepo: jest.Mocked<Repository<TicketCategory>>;
  let userRepo: jest.Mocked<Repository<User>>;

  beforeEach(async () => {
    const repo = () => ({
      createQueryBuilder: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn((v: unknown) => v),
      save: jest.fn((v: unknown) => Promise.resolve(v)),
      remove: jest.fn(),
    });
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminEventsService,
        { provide: getRepositoryToken(Event), useValue: repo() },
        { provide: getRepositoryToken(EventStaff), useValue: repo() },
        { provide: getRepositoryToken(TicketCategory), useValue: repo() },
        { provide: getRepositoryToken(Order), useValue: repo() },
        { provide: getRepositoryToken(Ticket), useValue: repo() },
        { provide: getRepositoryToken(User), useValue: repo() },
        { provide: getRepositoryToken(City), useValue: repo() },
        { provide: getRepositoryToken(EventCategory), useValue: repo() },
      ],
    }).compile();

    service = module.get(AdminEventsService);
    eventRepo = module.get(getRepositoryToken(Event));
    staffRepo = module.get(getRepositoryToken(EventStaff));
    ticketCategoryRepo = module.get(getRepositoryToken(TicketCategory));
    userRepo = module.get(getRepositoryToken(User));
  });

  describe('list', () => {
    it('applies status, city, country and category filters', async () => {
      const qb = chainableQb([{ id: 1 }], 1);
      eventRepo.createQueryBuilder.mockReturnValue(qb as never);

      const res = await service.list({
        page: 1,
        limit: 20,
        status: EventStatus.ACTIVE,
        cityId: 3,
        countryId: 1,
        categoryId: 2,
      });

      expect(qb.andWhere).toHaveBeenCalledWith('event.status = :status', {
        status: EventStatus.ACTIVE,
      });
      expect(qb.andWhere).toHaveBeenCalledWith('cityEntity.id = :cityId', {
        cityId: 3,
      });
      expect(qb.andWhere).toHaveBeenCalledWith('country.id = :countryId', {
        countryId: 1,
      });
      expect(res.meta.total).toBe(1);
    });
  });

  describe('setStatus', () => {
    it('syncs is_active/is_sold_out to the new status', async () => {
      const event = {
        id: 1,
        status: EventStatus.ACTIVE,
        is_active: true,
        is_sold_out: false,
      } as Event;
      eventRepo.findOne.mockResolvedValue(event);

      const suspended = await service.setStatus(1, EventStatus.SUSPENDED);
      expect(suspended.is_active).toBe(false);

      const soldOut = await service.setStatus(1, EventStatus.SOLD_OUT);
      expect(soldOut.is_sold_out).toBe(true);
      expect(soldOut.is_active).toBe(false);
    });
  });

  describe('assignOrganizer', () => {
    it('rejects a user who is not an organizer', async () => {
      eventRepo.findOne.mockResolvedValue({ id: 1 } as Event);
      userRepo.findOne.mockResolvedValue({
        id: 5,
        role: { name: 'USER' },
      } as unknown as User);

      await expect(service.assignOrganizer(1, 5)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('addStaff', () => {
    it('rejects a duplicate assignment', async () => {
      eventRepo.findOne.mockResolvedValue({ id: 1 } as Event);
      userRepo.findOne.mockResolvedValue({
        id: 7,
        role: { name: 'STAFF' },
      } as unknown as User);
      staffRepo.findOne.mockResolvedValue({ id: 'x' } as unknown as EventStaff);

      await expect(service.addStaff(1, 7)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });

  describe('updateTicketCategory', () => {
    it('recomputes stock_remaining preserving sold tickets', async () => {
      ticketCategoryRepo.findOne.mockResolvedValue({
        id: 9,
        stock_allocated: 100,
        stock_remaining: 60, // 40 sold
      } as TicketCategory);

      await service.updateTicketCategory(1, 9, {
        name: 'VIP',
        price: 500,
        stock_allocated: 120,
      });

      expect(ticketCategoryRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ stock_allocated: 120, stock_remaining: 80 }),
      );
    });
  });
});
