import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CitiesService } from './cities.service';
import { City } from './entities/city.entity';
import { Country } from './entities/country.entity';
import { Event } from '../events/entities/event.entity';

function chainableQb(rows: unknown[], total: number) {
  const qb: Record<string, jest.Mock> = {};
  for (const m of [
    'leftJoinAndSelect',
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

describe('CitiesService', () => {
  let service: CitiesService;
  let repo: jest.Mocked<Repository<City>>;
  let countryRepo: jest.Mocked<Repository<Country>>;
  let eventRepo: jest.Mocked<Repository<Event>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CitiesService,
        {
          provide: getRepositoryToken(City),
          useValue: {
            createQueryBuilder: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn((v: Partial<City>) => v),
            save: jest.fn((v: Partial<City>) =>
              Promise.resolve({ id: 1, ...v }),
            ),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Country),
          useValue: { findOne: jest.fn() },
        },
        {
          provide: getRepositoryToken(Event),
          useValue: { count: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(CitiesService);
    repo = module.get(getRepositoryToken(City));
    countryRepo = module.get(getRepositoryToken(Country));
    eventRepo = module.get(getRepositoryToken(Event));
  });

  describe('list', () => {
    it('filters by countryId when provided', async () => {
      const qb = chainableQb([], 0);
      repo.createQueryBuilder.mockReturnValue(qb as never);

      await service.list({ page: 1, limit: 20, countryId: 7 });

      expect(qb.andWhere).toHaveBeenCalledWith('country.id = :cid', {
        cid: 7,
      });
    });
  });

  describe('create', () => {
    it('rejects an unknown country', async () => {
      countryRepo.findOne.mockResolvedValue(null);
      await expect(
        service.create({ name: 'Nowhere', countryId: 999 }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('remove', () => {
    it('blocks deletion when events use the city', async () => {
      repo.findOne.mockResolvedValue({ id: 1 } as City);
      eventRepo.count.mockResolvedValue(2);

      await expect(service.remove(1)).rejects.toBeInstanceOf(ConflictException);
      expect(repo.remove).not.toHaveBeenCalled();
    });

    it('deletes an unused city', async () => {
      const city = { id: 1 } as City;
      repo.findOne.mockResolvedValue(city);
      eventRepo.count.mockResolvedValue(0);

      await service.remove(1);

      expect(repo.remove).toHaveBeenCalledWith(city);
    });
  });
});
