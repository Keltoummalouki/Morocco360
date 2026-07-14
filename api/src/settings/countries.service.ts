import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Country } from './entities/country.entity';
import { City } from './entities/city.entity';
import { Language } from './entities/language.entity';
import { paginate, PaginatedResult } from '../common/pagination';
import {
  AssignLanguagesDto,
  CreateCountryDto,
  QueryCountryDto,
  UpdateCountryDto,
} from './dto/country.dto';

const SORTABLE = {
  name: 'c.name',
  iso_code: 'c.iso_code',
  createdAt: 'c.created_at',
};

@Injectable()
export class CountriesService {
  constructor(
    @InjectRepository(Country)
    private readonly repo: Repository<Country>,
    @InjectRepository(City) private readonly cityRepo: Repository<City>,
    @InjectRepository(Language)
    private readonly languageRepo: Repository<Language>,
  ) {}

  async list(query: QueryCountryDto): Promise<PaginatedResult<Country>> {
    const qb = this.repo
      .createQueryBuilder('c')
      .loadRelationCountAndMap('c.cityCount', 'c.cities');

    if (query.search?.trim()) {
      qb.andWhere('(c.name ILIKE :s OR c.iso_code ILIKE :s)', {
        s: `%${query.search.trim()}%`,
      });
    }
    if (query.status) {
      qb.andWhere('c.status = :status', { status: query.status });
    }

    return paginate(qb, query, { sortable: SORTABLE, defaultSort: 'c.name' });
  }

  async findOne(id: number): Promise<Country> {
    const country = await this.repo.findOne({
      where: { id },
      relations: ['cities', 'languages'],
    });
    if (!country) throw new NotFoundException('Country not found');
    return country;
  }

  async create(dto: CreateCountryDto): Promise<Country> {
    const country = this.repo.create({
      name: dto.name,
      iso_code: dto.iso_code,
      latitude: dto.latitude,
      longitude: dto.longitude,
      status: dto.status,
    });
    if (dto.languageIds?.length) {
      country.languages = await this.languageRepo.findBy({
        id: In(dto.languageIds),
      });
    }
    return this.repo.save(country);
  }

  async update(id: number, dto: UpdateCountryDto): Promise<Country> {
    const country = await this.findOne(id);
    if (dto.name !== undefined) country.name = dto.name;
    if (dto.iso_code !== undefined) country.iso_code = dto.iso_code;
    if (dto.latitude !== undefined) country.latitude = dto.latitude;
    if (dto.longitude !== undefined) country.longitude = dto.longitude;
    if (dto.status !== undefined) country.status = dto.status;
    if (dto.languageIds !== undefined) {
      country.languages = dto.languageIds.length
        ? await this.languageRepo.findBy({ id: In(dto.languageIds) })
        : [];
    }
    return this.repo.save(country);
  }

  /**
   * Delete only when no cities reference the country. Otherwise the admin
   * should suspend it (status = SUSPENDED) instead.
   */
  async remove(id: number): Promise<void> {
    const country = await this.findOne(id);
    const cityCount = await this.cityRepo.count({
      where: { country: { id } },
    });
    if (cityCount > 0) {
      throw new ConflictException(
        'Country has cities — suspend it instead of deleting.',
      );
    }
    await this.repo.remove(country);
  }

  async getCities(id: number): Promise<City[]> {
    await this.findOne(id);
    return this.cityRepo.find({
      where: { country: { id } },
      order: { name: 'ASC' },
    });
  }

  async getLanguages(id: number): Promise<Language[]> {
    const country = await this.findOne(id);
    return country.languages ?? [];
  }

  async assignLanguages(
    id: number,
    dto: AssignLanguagesDto,
  ): Promise<Country> {
    const country = await this.findOne(id);
    country.languages = dto.languageIds.length
      ? await this.languageRepo.findBy({ id: In(dto.languageIds) })
      : [];
    return this.repo.save(country);
  }
}
