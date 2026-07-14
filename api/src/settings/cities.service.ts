import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { City } from './entities/city.entity';
import { Country } from './entities/country.entity';
import { Event } from '../events/entities/event.entity';
import { paginate, PaginatedResult } from '../common/pagination';
import { CreateCityDto, QueryCityDto, UpdateCityDto } from './dto/city.dto';

const SORTABLE = {
  name: 'city.name',
  createdAt: 'city.created_at',
};

@Injectable()
export class CitiesService {
  constructor(
    @InjectRepository(City) private readonly repo: Repository<City>,
    @InjectRepository(Country)
    private readonly countryRepo: Repository<Country>,
    @InjectRepository(Event) private readonly eventRepo: Repository<Event>,
  ) {}

  async list(query: QueryCityDto): Promise<PaginatedResult<City>> {
    const qb = this.repo
      .createQueryBuilder('city')
      .leftJoinAndSelect('city.country', 'country');

    if (query.search?.trim()) {
      qb.andWhere('city.name ILIKE :s', { s: `%${query.search.trim()}%` });
    }
    if (query.status) {
      qb.andWhere('city.status = :status', { status: query.status });
    }
    if (query.countryId) {
      qb.andWhere('country.id = :cid', { cid: query.countryId });
    }

    return paginate(qb, query, {
      sortable: SORTABLE,
      defaultSort: 'city.name',
    });
  }

  async findOne(id: number): Promise<City> {
    const city = await this.repo.findOne({
      where: { id },
      relations: ['country'],
    });
    if (!city) throw new NotFoundException('City not found');
    return city;
  }

  async create(dto: CreateCityDto): Promise<City> {
    const city = this.repo.create({
      name: dto.name,
      latitude: dto.latitude,
      longitude: dto.longitude,
      status: dto.status,
    });
    if (dto.countryId !== undefined) {
      city.country = await this.resolveCountry(dto.countryId);
    }
    return this.repo.save(city);
  }

  async update(id: number, dto: UpdateCityDto): Promise<City> {
    const city = await this.findOne(id);
    if (dto.name !== undefined) city.name = dto.name;
    if (dto.latitude !== undefined) city.latitude = dto.latitude;
    if (dto.longitude !== undefined) city.longitude = dto.longitude;
    if (dto.status !== undefined) city.status = dto.status;
    if (dto.countryId !== undefined) {
      city.country = await this.resolveCountry(dto.countryId);
    }
    return this.repo.save(city);
  }

  /** Delete only when no events reference the city; otherwise suspend it. */
  async remove(id: number): Promise<void> {
    const city = await this.findOne(id);
    const usedByEvents = await this.eventRepo.count({
      where: { cityEntity: { id } },
    });
    if (usedByEvents > 0) {
      throw new ConflictException(
        'City is used by events — suspend it instead of deleting.',
      );
    }
    await this.repo.remove(city);
  }

  private async resolveCountry(countryId: number): Promise<Country> {
    const country = await this.countryRepo.findOne({
      where: { id: countryId },
    });
    if (!country) throw new BadRequestException('Country not found');
    return country;
  }
}
