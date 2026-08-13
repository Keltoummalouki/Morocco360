/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { EventCategoriesService } from './event-categories.service';
import { EventCategory } from './entities/event-category.entity';
import { Event } from '../events/entities/event.entity';

function chainableQb(rows: unknown[], total: number) {
  const qb: Record<string, jest.Mock> = {};
  for (const m of ['andWhere', 'orderBy', 'skip', 'take']) {
    qb[m] = jest.fn().mockReturnValue(qb);
  }
  qb.getManyAndCount = jest.fn().mockResolvedValue([rows, total]);
  return qb;
}

describe('EventCategoriesService', () => {
  let service: EventCategoriesService;
  let repo: jest.Mocked<Repository<EventCategory>>;
  let eventRepo: jest.Mocked<Repository<Event>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventCategoriesService,
        {
          provide: getRepositoryToken(EventCategory),
          useValue: {
            createQueryBuilder: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn((v: unknown) => v),
            save: jest.fn((v) => Promise.resolve({ id: 1, ...v })),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Event),
          useValue: { count: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(EventCategoriesService);
    repo = module.get(getRepositoryToken(EventCategory));
    eventRepo = module.get(getRepositoryToken(Event));
  });

  describe('list', () => {
    it('paginates with search on name/description', async () => {
      const qb = chainableQb([{ id: 1 }], 1);
      repo.createQueryBuilder.mockReturnValue(qb as never);

      const res = await service.list({ page: 1, limit: 10, search: 'mus' });

      expect(qb.andWhere).toHaveBeenCalledWith(
        '(ec.name ILIKE :s OR ec.description ILIKE :s)',
        { s: '%mus%' },
      );
      expect(res.meta.limit).toBe(10);
    });
  });

  describe('remove', () => {
    it('blocks deletion when active events use the category', async () => {
      repo.findOne.mockResolvedValue({ id: 1 } as EventCategory);
      eventRepo.count.mockResolvedValue(1);

      await expect(service.remove(1)).rejects.toBeInstanceOf(ConflictException);
      expect(repo.remove).not.toHaveBeenCalled();
    });

    it('deletes when no active event uses the category', async () => {
      const cat = { id: 1 } as EventCategory;
      repo.findOne.mockResolvedValue(cat);
      eventRepo.count.mockResolvedValue(0);

      await service.remove(1);

      expect(repo.remove).toHaveBeenCalledWith(cat);
    });
  });
});
