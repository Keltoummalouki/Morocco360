import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from './entities/event.entity';
import { EventStaff, EventStaffRole } from './entities/event-staff.entity';
import { TicketCategory } from './entities/ticket-category.entity';
import { User } from '../users/entities/user.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { FilterEventsDto } from './dto/filter-events.dto';

interface Caller {
  id: number;
  role: string;
}

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private readonly repo: Repository<Event>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(EventStaff)
    private readonly staffRepo: Repository<EventStaff>,
  ) {}

  findAll(filters: FilterEventsDto = {}): Promise<Event[]> {
    const qb = this.repo
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.categories', 'cat')
      .where('event.is_active = true');

    // Full-text search
    if (filters.q?.trim()) {
      const term = `%${filters.q.trim()}%`;
      qb.andWhere(
        '(event.title ILIKE :term OR event.description ILIKE :term OR event.city ILIKE :term OR event.location_name ILIKE :term)',
        { term },
      );
    }

    // City (case-insensitive exact match)
    if (filters.city?.trim()) {
      qb.andWhere('event.city ILIKE :city', { city: filters.city.trim() });
    }

    // Category
    if (filters.category) {
      qb.andWhere('event.category = :category', { category: filters.category });
    }

    // Date range (filters on date_start)
    if (filters.date_from) {
      qb.andWhere('event.date_start >= :date_from', {
        date_from: new Date(filters.date_from),
      });
    }
    if (filters.date_to) {
      qb.andWhere('event.date_start <= :date_to', {
        date_to: new Date(filters.date_to),
      });
    }

    // Price range — compares against the cheapest ticket category for each event
    const PRICE_SUBQUERY =
      '(SELECT COALESCE(MIN(tc.price), 0) FROM ticket_categories tc WHERE tc.event_id = event.id)';

    if (filters.price_min !== undefined && filters.price_min !== '') {
      const min = parseFloat(filters.price_min);
      if (!isNaN(min)) {
        qb.andWhere(`${PRICE_SUBQUERY} >= :priceMin`, { priceMin: min });
      }
    }
    if (filters.price_max !== undefined && filters.price_max !== '') {
      const max = parseFloat(filters.price_max);
      if (!isNaN(max)) {
        qb.andWhere(`${PRICE_SUBQUERY} <= :priceMax`, { priceMax: max });
      }
    }

    // Sort
    const dir = filters.order?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    if (filters.sort === 'price') {
      qb.orderBy(PRICE_SUBQUERY, dir);
    } else if (filters.sort === 'title') {
      qb.orderBy('event.title', dir);
    } else {
      qb.orderBy('event.date_start', dir || 'ASC');
    }

    return qb.getMany();
  }

  findAllAdmin(): Promise<Event[]> {
    return this.repo.find({
      relations: ['categories'],
      order: { date_start: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Event> {
    const event = await this.repo.findOne({
      where: { id },
      relations: ['categories', 'organizer'],
    });
    if (!event) throw new NotFoundException(`Event #${id} not found`);
    return event;
  }

  async create(dto: CreateEventDto, caller?: Caller): Promise<Event> {
    const event = this.repo.create(dto);
    if (caller?.role === 'ORGANIZER') {
      event.organizer = { id: caller.id } as User;
    }
    const saved = await this.repo.save(event);
    // Auto-assign organizer into event_staff so the organizer module sees this event
    if (caller?.role === 'ORGANIZER') {
      const staffEntry = this.staffRepo.create({
        event: saved,
        user: { id: caller.id } as User,
        staff_role: EventStaffRole.ORGANIZER,
        assigned_by: { id: caller.id } as User,
      });
      await this.staffRepo.save(staffEntry);
    }
    return saved;
  }

  async update(
    id: number,
    dto: UpdateEventDto,
    caller?: Caller,
  ): Promise<Event> {
    const event = await this.findOne(id);
    if (caller?.role === 'ORGANIZER' && event.organizer?.id !== caller.id) {
      throw new ForbiddenException('You can only edit your own events');
    }
    const { categories, ...rest } = dto;
    Object.assign(event, rest);
    if (categories !== undefined) {
      event.categories = categories.map((c) =>
        this.repo.manager.create(TicketCategory, c),
      );
    }
    return this.repo.save(event);
  }

  async remove(id: number, caller?: Caller): Promise<void> {
    const event = await this.findOne(id);
    if (caller?.role === 'ORGANIZER' && event.organizer?.id !== caller.id) {
      throw new ForbiddenException('You can only delete your own events');
    }
    await this.repo.remove(event);
  }

  async getSaved(userId: number): Promise<Event[]> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['savedEvents', 'savedEvents.categories'],
    });
    return user?.savedEvents ?? [];
  }

  async saveEvent(eventId: number, userId: number): Promise<void> {
    const [user, event] = await Promise.all([
      this.userRepo.findOne({
        where: { id: userId },
        relations: ['savedEvents'],
      }),
      this.repo.findOne({ where: { id: eventId } }),
    ]);
    if (!user) throw new NotFoundException('User not found');
    if (!event) throw new NotFoundException('Event not found');
    if (!user.savedEvents.some((e) => e.id === eventId)) {
      user.savedEvents.push(event);
      await this.userRepo.save(user);
    }
  }

  async unsaveEvent(eventId: number, userId: number): Promise<void> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['savedEvents'],
    });
    if (!user) throw new NotFoundException('User not found');
    user.savedEvents = user.savedEvents.filter((e) => e.id !== eventId);
    await this.userRepo.save(user);
  }
}
