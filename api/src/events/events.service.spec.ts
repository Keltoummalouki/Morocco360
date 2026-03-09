/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';

import { EventsService } from './events.service';
import { Event } from './entities/event.entity';
import { TicketCategory } from './entities/ticket-category.entity';
import { User } from '../users/entities/user.entity';

// ── Fixtures ──────────────────────────────────────────────
const mockCategory: TicketCategory = {
  id: 1,
  name: 'General',
  price: 50,
  stock_allocated: 100,
  event: null as unknown as Event,
  tickets: [],
};

const mockEvent: Event = {
  id: 1,
  title: 'Marrakech Jazz Festival',
  description: 'An annual jazz festival in the heart of Marrakech.',
  date_start: new Date('2025-07-15'),
  date_end: new Date('2025-07-17'),
  location_name: 'Jemaa el-Fna, Marrakech',
  latitude: 31.6258,
  longitude: -7.9892,
  image_url: null as unknown as string,
  total_stock: 200,
  is_active: true,
  created_at: new Date(),
  organizer: null as unknown as User,
  categories: [mockCategory],
};

// ── Suite ─────────────────────────────────────────────────
describe('EventsService', () => {
  let service: EventsService;
  let repo: jest.Mocked<Repository<Event>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        {
          provide: getRepositoryToken(Event),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
    repo = module.get(getRepositoryToken(Event));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ── findAll ──────────────────────────────────────────────
  describe('findAll', () => {
    it('returns only active events ordered by date_start', async () => {
      repo.find.mockResolvedValue([mockEvent]);

      const result = await service.findAll();

      expect(repo.find).toHaveBeenCalledWith({
        where: { is_active: true },
        relations: ['categories'],
        order: { date_start: 'ASC' },
      });
      expect(result).toEqual([mockEvent]);
    });

    it('returns an empty array when there are no active events', async () => {
      repo.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  // ── findOne ──────────────────────────────────────────────
  describe('findOne', () => {
    it('returns the event when found', async () => {
      repo.findOne.mockResolvedValue(mockEvent);

      const result = await service.findOne(1);

      expect(repo.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['categories', 'organizer'],
      });
      expect(result).toEqual(mockEvent);
    });

    it('throws NotFoundException when the event does not exist', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });
});
