/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LanguagesService } from './languages.service';
import { Language } from './entities/language.entity';
import { Country } from './entities/country.entity';

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

describe('LanguagesService', () => {
  let service: LanguagesService;
  let repo: jest.Mocked<Repository<Language>>;
  let countryRepo: jest.Mocked<Repository<Country>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LanguagesService,
        {
          provide: getRepositoryToken(Language),
          useValue: {
            createQueryBuilder: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn((v: unknown) => v),
            save: jest.fn((v) => Promise.resolve({ id: 1, ...v })),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Country),
          useValue: { findBy: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(LanguagesService);
    repo = module.get(getRepositoryToken(Language));
    countryRepo = module.get(getRepositoryToken(Country));
  });

  describe('list', () => {
    // Feeds both the "Pays" column and the edit modal's country chips.
    it('loads the countries relation onto each row', async () => {
      const qb = chainableQb([], 0);
      repo.createQueryBuilder.mockReturnValue(qb as never);

      await service.list({ page: 1, limit: 20 });

      expect(qb.leftJoinAndSelect).toHaveBeenCalledWith(
        'l.countries',
        'country',
      );
    });

    it('searches name and code', async () => {
      const qb = chainableQb([], 0);
      repo.createQueryBuilder.mockReturnValue(qb as never);

      await service.list({ page: 1, limit: 20, search: 'ar' });

      expect(qb.andWhere).toHaveBeenCalledWith(
        '(l.name ILIKE :s OR l.code ILIKE :s)',
        { s: '%ar%' },
      );
    });
  });

  describe('assignCountries', () => {
    it('replaces the linked countries', async () => {
      const language = { id: 1, countries: [] } as unknown as Language;
      repo.findOne.mockResolvedValue(language);
      countryRepo.findBy.mockResolvedValue([{ id: 2 } as Country]);

      await service.assignCountries(1, { countryIds: [2] });

      expect(countryRepo.findBy).toHaveBeenCalled();
      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ countries: [{ id: 2 }] }),
      );
    });

    it('clears countries when given an empty list', async () => {
      const language = {
        id: 1,
        countries: [{ id: 9 }],
      } as unknown as Language;
      repo.findOne.mockResolvedValue(language);

      await service.assignCountries(1, { countryIds: [] });

      expect(countryRepo.findBy).not.toHaveBeenCalled();
      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ countries: [] }),
      );
    });
  });
});
