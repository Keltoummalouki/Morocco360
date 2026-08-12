import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventCategory } from './entities/event-category.entity';
import { Event } from '../events/entities/event.entity';
import { paginate, PaginatedResult } from '../common/pagination';
import {
  CreateEventCategoryDto,
  QueryEventCategoryDto,
  UpdateEventCategoryDto,
} from './dto/event-category.dto';

const SORTABLE = {
  name: 'ec.name',
  createdAt: 'ec.created_at',
};

@Injectable()
export class EventCategoriesService {
  constructor(
    @InjectRepository(EventCategory)
    private readonly repo: Repository<EventCategory>,
    @InjectRepository(Event) private readonly eventRepo: Repository<Event>,
  ) {}

  async list(
    query: QueryEventCategoryDto,
  ): Promise<PaginatedResult<EventCategory>> {
    const qb = this.repo.createQueryBuilder('ec');

    if (query.search?.trim()) {
      qb.andWhere('(ec.name ILIKE :s OR ec.description ILIKE :s)', {
        s: `%${query.search.trim()}%`,
      });
    }
    if (query.status) {
      qb.andWhere('ec.status = :status', { status: query.status });
    }

    return paginate(qb, query, { sortable: SORTABLE, defaultSort: 'ec.name' });
  }

  async findOne(id: number): Promise<EventCategory> {
    const category = await this.repo.findOne({ where: { id } });
    if (!category) throw new NotFoundException('Event category not found');
    return category;
  }

  async create(dto: CreateEventCategoryDto): Promise<EventCategory> {
    const category = this.repo.create(dto);
    return this.repo.save(category);
  }

  async update(
    id: number,
    dto: UpdateEventCategoryDto,
  ): Promise<EventCategory> {
    const category = await this.findOne(id);
    Object.assign(category, dto);
    return this.repo.save(category);
  }

  /**
   * Delete only when no active event references the category; otherwise the
   * admin should suspend it.
   */
  async remove(id: number): Promise<void> {
    const category = await this.findOne(id);
    const usedByActive = await this.eventRepo.count({
      where: { categoryEntity: { id }, is_active: true },
    });
    if (usedByActive > 0) {
      throw new ConflictException(
        'Category is used by active events — suspend it instead of deleting.',
      );
    }
    await this.repo.remove(category);
  }
}
