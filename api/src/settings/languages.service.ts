import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Language } from './entities/language.entity';
import { Country } from './entities/country.entity';
import { paginate, PaginatedResult } from '../common/pagination';
import {
  AssignCountriesDto,
  CreateLanguageDto,
  QueryLanguageDto,
  UpdateLanguageDto,
} from './dto/language.dto';

const SORTABLE = {
  name: 'l.name',
  code: 'l.code',
  createdAt: 'l.created_at',
};

@Injectable()
export class LanguagesService {
  constructor(
    @InjectRepository(Language)
    private readonly repo: Repository<Language>,
    @InjectRepository(Country)
    private readonly countryRepo: Repository<Country>,
  ) {}

  async list(query: QueryLanguageDto): Promise<PaginatedResult<Language>> {
    const qb = this.repo.createQueryBuilder('l');

    if (query.search?.trim()) {
      qb.andWhere('(l.name ILIKE :s OR l.code ILIKE :s)', {
        s: `%${query.search.trim()}%`,
      });
    }
    if (query.status) {
      qb.andWhere('l.status = :status', { status: query.status });
    }

    return paginate(qb, query, {
      sortable: SORTABLE,
      defaultSort: 'l.name',
    });
  }

  async findOne(id: number): Promise<Language> {
    const language = await this.repo.findOne({
      where: { id },
      relations: ['countries'],
    });
    if (!language) throw new NotFoundException('Language not found');
    return language;
  }

  async create(dto: CreateLanguageDto): Promise<Language> {
    const language = this.repo.create({
      name: dto.name,
      code: dto.code,
      status: dto.status,
    });
    if (dto.countryIds?.length) {
      language.countries = await this.countryRepo.findBy({
        id: In(dto.countryIds),
      });
    }
    return this.repo.save(language);
  }

  async update(id: number, dto: UpdateLanguageDto): Promise<Language> {
    const language = await this.findOne(id);
    if (dto.name !== undefined) language.name = dto.name;
    if (dto.code !== undefined) language.code = dto.code;
    if (dto.status !== undefined) language.status = dto.status;
    if (dto.countryIds !== undefined) {
      language.countries = dto.countryIds.length
        ? await this.countryRepo.findBy({ id: In(dto.countryIds) })
        : [];
    }
    return this.repo.save(language);
  }

  /** Languages are safe to delete — it only unlinks the country_languages rows. */
  async remove(id: number): Promise<void> {
    const language = await this.findOne(id);
    await this.repo.remove(language);
  }

  async assignCountries(
    id: number,
    dto: AssignCountriesDto,
  ): Promise<Language> {
    const language = await this.findOne(id);
    language.countries = dto.countryIds.length
      ? await this.countryRepo.findBy({ id: In(dto.countryIds) })
      : [];
    return this.repo.save(language);
  }
}
