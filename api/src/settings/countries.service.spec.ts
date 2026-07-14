import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CountriesService } from './countries.service';
import { Country } from './entities/country.entity';
import { City } from './entities/city.entity';
import { Language } from './entities/language.entity';
import { SettingStatus } from '../common/enums/status.enum';

function chainableQb(rows: unknown[], total: number) {
  const qb: Record<string, jest.Mock> = {};
  for (const m of [
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

describe('CountriesService', () => {
  let service: CountriesService;
  let repo: jest.Mocked<Repository<Country>>;
  let cityRepo: jest.Mocked<Repository<City>>;
  let languageRepo: jest.Mocked<Repository<Language>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CountriesService,
        {
          provide: getRepositoryToken(Country),
          useValue: {
            createQueryBuilder: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn((v) => v),
            save: jest.fn((v) => Promise.resolve({ id: 1, ...v })),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(City),
          useValue: { count: jest.fn(), find: jest.fn() },
        },
        {
          provide: getRepositoryToken(Language),
          useValue: { findBy: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(CountriesService);
    repo = module.get(getRepositoryToken(Country));
    cityRepo = module.get(getRepositoryToken(City));
    languageRepo = module.get(getRepositoryToken(Language));
  });

  describe('list', () => {
    it('returns { data, meta } and applies search + status filters', async () => {
      const qb = chainableQb([{ id: 1 }], 1);
      repo.createQueryBuilder.mockReturnValue(qb as never);

      const result = await service.list({
        page: 1,
        limit: 20,
        search: 'mor',
        status: SettingStatus.ACTIVE,
      });

      expect(qb.andWhere).toHaveBeenCalledWith(
        '(c.name ILIKE :s OR c.iso_code ILIKE :s)',
        { s: '%mor%' },
      );
      expect(qb.andWhere).toHaveBeenCalledWith('c.status = :status', {
        status: SettingStatus.ACTIVE,
      });
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.totalPages).toBe(1);
    });
  });

  describe('create', () => {
    it('links languages when languageIds are given', async () => {
      languageRepo.findBy.mockResolvedValue([{ id: 5 } as Language]);

      await service.create({ name: 'Morocco', languageIds: [5] });

      expect(languageRepo.findBy).toHaveBeenCalled();
      expect(repo.save).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('blocks deletion when the country still has cities', async () => {
      repo.findOne.mockResolvedValue({ id: 1 } as Country);
      cityRepo.count.mockResolvedValue(3);

      await expect(service.remove(1)).rejects.toBeInstanceOf(ConflictException);
      expect(repo.remove).not.toHaveBeenCalled();
    });

    it('deletes when there are no cities', async () => {
      const country = { id: 1 } as Country;
      repo.findOne.mockResolvedValue(country);
      cityRepo.count.mockResolvedValue(0);

      await service.remove(1);

      expect(repo.remove).toHaveBeenCalledWith(country);
    });
  });

  describe('findOne', () => {
    it('throws NotFound when missing', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.findOne(99)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
