import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Event,
  EventCategory,
  EventStatus,
} from '../events/entities/event.entity';
import {
  EventStaff,
  EventStaffRole,
} from '../events/entities/event-staff.entity';
import { TicketCategory } from '../events/entities/ticket-category.entity';
import { Order } from '../orders/entities/order.entity';
import { Ticket } from '../orders/entities/ticket.entity';
import { User } from '../users/entities/user.entity';
import { RoleName } from '../users/entities/role.entity';
import { City } from '../settings/entities/city.entity';
import { EventCategory as EventCategoryEntity } from '../settings/entities/event-category.entity';
import { paginate, PaginatedResult } from '../common/pagination';
import { AdminEventsQueryDto } from './dto/admin-events-query.dto';
import {
  AdminTicketCategoryDto,
  CreateAdminEventDto,
  UpdateAdminEventDto,
} from './dto/admin-event.dto';

const SORTABLE = {
  date: 'event.date_start',
  title: 'event.title',
  createdAt: 'event.created_at',
  status: 'event.status',
};

/** Keep the legacy public-site flags in sync with the admin status enum. */
function flagsForStatus(status: EventStatus) {
  return {
    is_active: status === EventStatus.ACTIVE,
    is_sold_out: status === EventStatus.SOLD_OUT,
  };
}

@Injectable()
export class AdminEventsService {
  constructor(
    @InjectRepository(Event) private readonly eventRepo: Repository<Event>,
    @InjectRepository(EventStaff)
    private readonly staffRepo: Repository<EventStaff>,
    @InjectRepository(TicketCategory)
    private readonly ticketCategoryRepo: Repository<TicketCategory>,
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
    @InjectRepository(Ticket) private readonly ticketRepo: Repository<Ticket>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(City) private readonly cityRepo: Repository<City>,
    @InjectRepository(EventCategoryEntity)
    private readonly categoryRepo: Repository<EventCategoryEntity>,
  ) {}

  // ── List ───────────────────────────────────────────────────
  async list(query: AdminEventsQueryDto): Promise<PaginatedResult<Event>> {
    const qb = this.eventRepo
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.organizer', 'organizer')
      .leftJoinAndSelect('event.cityEntity', 'cityEntity')
      .leftJoinAndSelect('cityEntity.country', 'country')
      .leftJoinAndSelect('event.categoryEntity', 'categoryEntity');

    if (query.search?.trim()) {
      qb.andWhere(
        `(event.title ILIKE :s OR event.location_name ILIKE :s OR event.city ILIKE :s
          OR organizer.full_name ILIKE :s OR organizer.username ILIKE :s)`,
        { s: `%${query.search.trim()}%` },
      );
    }
    if (query.status) {
      qb.andWhere('event.status = :status', { status: query.status });
    }
    if (query.cityId) {
      qb.andWhere('cityEntity.id = :cityId', { cityId: query.cityId });
    }
    if (query.countryId) {
      qb.andWhere('country.id = :countryId', { countryId: query.countryId });
    }
    if (query.categoryId) {
      qb.andWhere('categoryEntity.id = :categoryId', {
        categoryId: query.categoryId,
      });
    }
    if (query.dateFrom) {
      qb.andWhere('event.date_start >= :dateFrom', {
        dateFrom: new Date(query.dateFrom),
      });
    }
    if (query.dateTo) {
      qb.andWhere('event.date_start <= :dateTo', {
        dateTo: new Date(query.dateTo),
      });
    }

    return paginate(qb, query, {
      sortable: SORTABLE,
      defaultSort: 'event.date_start',
    });
  }

  async findOne(id: number): Promise<Event> {
    const event = await this.eventRepo.findOne({
      where: { id },
      relations: [
        'organizer',
        'categories',
        'cityEntity',
        'cityEntity.country',
        'categoryEntity',
      ],
    });
    if (!event) throw new NotFoundException(`Event #${id} not found`);
    return event;
  }

  // ── Create / update ────────────────────────────────────────
  async create(dto: CreateAdminEventDto): Promise<Event> {
    const event = this.eventRepo.create({
      title: dto.title,
      description: dto.description,
      date_start: new Date(dto.date_start),
      date_end: new Date(dto.date_end),
      location_name: dto.location_name,
      city: dto.city,
      category: dto.category,
      latitude: dto.latitude,
      longitude: dto.longitude,
      image_url: dto.image_url,
      total_stock: dto.total_stock ?? 0,
    });

    const status = dto.status ?? EventStatus.ACTIVE;
    event.status = status;
    Object.assign(event, flagsForStatus(status));

    await this.applyCity(event, dto.cityId);
    await this.applyCategory(event, dto.categoryId);
    await this.applyOrganizer(event, dto.organizerId);
    if (dto.categories) {
      event.categories = dto.categories.map((c) => this.buildTicketCategory(c));
    }

    const saved = await this.eventRepo.save(event);
    await this.syncOrganizerAssignment(saved);
    return this.findOne(saved.id);
  }

  async update(id: number, dto: UpdateAdminEventDto): Promise<Event> {
    const event = await this.findOne(id);

    const scalars: (keyof UpdateAdminEventDto)[] = [
      'title',
      'description',
      'location_name',
      'city',
      'category',
      'latitude',
      'longitude',
      'image_url',
      'total_stock',
    ];
    for (const key of scalars) {
      if (dto[key] !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (event as any)[key] = dto[key];
      }
    }
    if (dto.date_start !== undefined) event.date_start = new Date(dto.date_start);
    if (dto.date_end !== undefined) event.date_end = new Date(dto.date_end);

    if (dto.status !== undefined) {
      event.status = dto.status;
      Object.assign(event, flagsForStatus(dto.status));
    }
    if (dto.cityId !== undefined) await this.applyCity(event, dto.cityId);
    if (dto.categoryId !== undefined)
      await this.applyCategory(event, dto.categoryId);
    if (dto.organizerId !== undefined)
      await this.applyOrganizer(event, dto.organizerId);
    if (dto.categories !== undefined) {
      event.categories = dto.categories.map((c) => this.buildTicketCategory(c));
    }

    const saved = await this.eventRepo.save(event);
    if (dto.organizerId !== undefined) await this.syncOrganizerAssignment(saved);
    return this.findOne(saved.id);
  }

  async setStatus(id: number, status: EventStatus): Promise<Event> {
    const event = await this.findOne(id);
    event.status = status;
    Object.assign(event, flagsForStatus(status));
    await this.eventRepo.save(event);
    return this.findOne(id);
  }

  // ── Organizer ──────────────────────────────────────────────
  async assignOrganizer(id: number, organizerId: number): Promise<Event> {
    const event = await this.findOne(id);
    await this.applyOrganizer(event, organizerId, true);
    const saved = await this.eventRepo.save(event);
    await this.syncOrganizerAssignment(saved);
    return this.findOne(saved.id);
  }

  // ── Staff assignments ──────────────────────────────────────
  async getStaff(eventId: number): Promise<unknown[]> {
    await this.findOne(eventId);
    const entries = await this.staffRepo.find({
      where: { event: { id: eventId } },
      relations: ['user', 'user.role'],
      order: { assigned_at: 'DESC' },
    });
    return entries.map((e) => ({
      id: e.id,
      staffRole: e.staff_role,
      assignedAt: e.assigned_at,
      user: {
        id: e.user.id,
        username: e.user.username,
        email: e.user.email,
        full_name: e.user.full_name,
        role: e.user.role?.name ?? null,
      },
    }));
  }

  async addStaff(eventId: number, userId: number): Promise<unknown> {
    const event = await this.findOne(eventId);
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['role'],
    });
    if (!user) throw new NotFoundException('User not found');

    const existing = await this.staffRepo.findOne({
      where: { event: { id: eventId }, user: { id: userId } },
    });
    if (existing) throw new ConflictException('User already assigned');

    const staff_role =
      user.role?.name === RoleName.ORGANIZER
        ? EventStaffRole.ORGANIZER
        : EventStaffRole.STAFF;
    const entry = this.staffRepo.create({ event, user, staff_role });
    await this.staffRepo.save(entry);
    return this.getStaff(eventId);
  }

  async removeStaff(eventId: number, userId: number): Promise<void> {
    const entry = await this.staffRepo.findOne({
      where: { event: { id: eventId }, user: { id: userId } },
    });
    if (!entry) throw new NotFoundException('Assignment not found');
    await this.staffRepo.remove(entry);
  }

  // ── Ticket categories ──────────────────────────────────────
  async addTicketCategory(
    eventId: number,
    dto: AdminTicketCategoryDto,
  ): Promise<TicketCategory> {
    const event = await this.findOne(eventId);
    const cat = this.buildTicketCategory(dto);
    cat.event = event;
    return this.ticketCategoryRepo.save(cat);
  }

  async updateTicketCategory(
    eventId: number,
    categoryId: number,
    dto: AdminTicketCategoryDto,
  ): Promise<TicketCategory> {
    const cat = await this.ticketCategoryRepo.findOne({
      where: { id: categoryId, event: { id: eventId } },
    });
    if (!cat) throw new NotFoundException('Ticket category not found');
    if (dto.name !== undefined) cat.name = dto.name;
    if (dto.description !== undefined) cat.description = dto.description;
    if (dto.price !== undefined) cat.price = dto.price;
    if (dto.status !== undefined) cat.status = dto.status;
    if (dto.stock_allocated !== undefined) {
      const sold = cat.stock_allocated - cat.stock_remaining;
      cat.stock_allocated = dto.stock_allocated;
      cat.stock_remaining = Math.max(0, dto.stock_allocated - sold);
    }
    return this.ticketCategoryRepo.save(cat);
  }

  async removeTicketCategory(
    eventId: number,
    categoryId: number,
  ): Promise<void> {
    const cat = await this.ticketCategoryRepo.findOne({
      where: { id: categoryId, event: { id: eventId } },
    });
    if (!cat) throw new NotFoundException('Ticket category not found');
    await this.ticketCategoryRepo.remove(cat);
  }

  // ── Bookings for an event ──────────────────────────────────
  async getBookings(
    eventId: number,
    query: AdminEventsQueryDto,
  ): Promise<PaginatedResult<Order>> {
    await this.findOne(eventId);
    const qb = this.orderRepo
      .createQueryBuilder('o')
      .leftJoinAndSelect('o.user', 'u')
      .leftJoinAndSelect('o.payment', 'p')
      .where(
        'EXISTS (SELECT 1 FROM tickets tk WHERE tk."orderId" = o.id AND tk.event_id = :eventId)',
        { eventId },
      );

    if (query.search?.trim()) {
      qb.andWhere('(u.full_name ILIKE :s OR u.email ILIKE :s)', {
        s: `%${query.search.trim()}%`,
      });
    }

    return paginate(qb, query, {
      sortable: { createdAt: 'o.created_at', amount: 'o.total_amount' },
      defaultSort: 'o.created_at',
    });
  }

  /** Structured payload for the printable/exportable attendee sheet. */
  async getAttendeeExport(eventId: number): Promise<{
    event: { id: number; title: string; date_start: Date; location_name: string };
    organizer: { name: string; email: string } | null;
    staff: { name: string; email: string; role: string }[];
    attendees: {
      name: string;
      email: string;
      category: string;
      status: string;
      seat: string | null;
      orderId: number | undefined;
    }[];
  }> {
    const event = await this.findOne(eventId);
    const [staff, tickets] = await Promise.all([
      this.staffRepo.find({
        where: { event: { id: eventId } },
        relations: ['user'],
      }),
      this.ticketRepo.find({
        where: { event_id: eventId },
        relations: ['order', 'order.user', 'category'],
        order: { id: 'ASC' },
      }),
    ]);

    return {
      event: {
        id: event.id,
        title: event.title,
        date_start: event.date_start,
        location_name: event.location_name,
      },
      organizer: event.organizer
        ? {
            name: event.organizer.full_name ?? event.organizer.username,
            email: event.organizer.email,
          }
        : null,
      staff: staff.map((s) => ({
        name: s.user.full_name ?? s.user.username,
        email: s.user.email,
        role: s.staff_role,
      })),
      attendees: tickets.map((t) => ({
        name: t.order?.user?.full_name ?? t.order?.user?.username ?? '—',
        email: t.order?.user?.email ?? '—',
        category: t.category?.name ?? '—',
        status: t.status,
        seat: t.seat_number ?? null,
        orderId: t.order?.id,
      })),
    };
  }

  // ── Helpers ────────────────────────────────────────────────
  private buildTicketCategory(dto: AdminTicketCategoryDto): TicketCategory {
    return this.ticketCategoryRepo.create({
      name: dto.name,
      description: dto.description,
      price: dto.price,
      stock_allocated: dto.stock_allocated,
      stock_remaining: dto.stock_allocated,
      status: dto.status,
    });
  }

  /** Sets normalized city + keeps the legacy `city` string in sync. */
  private async applyCity(event: Event, cityId?: number): Promise<void> {
    if (cityId === undefined) return;
    const city = await this.cityRepo.findOne({ where: { id: cityId } });
    if (!city) throw new BadRequestException('City not found');
    event.cityEntity = city;
    event.city = city.name;
  }

  /** Sets normalized category + mirrors a matching legacy enum value. */
  private async applyCategory(event: Event, categoryId?: number): Promise<void> {
    if (categoryId === undefined) return;
    const category = await this.categoryRepo.findOne({
      where: { id: categoryId },
    });
    if (!category) throw new BadRequestException('Event category not found');
    event.categoryEntity = category;
    const legacy = (Object.values(EventCategory) as string[]).find(
      (v) => v.toLowerCase() === category.name.toLowerCase(),
    );
    if (legacy) event.category = legacy as EventCategory;
  }

  private async applyOrganizer(
    event: Event,
    organizerId?: number,
    requireOrganizerRole = false,
  ): Promise<void> {
    if (organizerId === undefined) return;
    const user = await this.userRepo.findOne({
      where: { id: organizerId },
      relations: ['role'],
    });
    if (!user) throw new BadRequestException('Organizer not found');
    if (requireOrganizerRole && user.role?.name !== RoleName.ORGANIZER) {
      throw new BadRequestException('Selected user is not an organizer');
    }
    event.organizer = user;
  }

  /** Ensure the organizer has an EventStaff ORGANIZER row for this event. */
  private async syncOrganizerAssignment(event: Event): Promise<void> {
    if (!event.organizer) return;
    const existing = await this.staffRepo.findOne({
      where: { event: { id: event.id }, user: { id: event.organizer.id } },
    });
    if (existing) return;
    const entry = this.staffRepo.create({
      event,
      user: event.organizer,
      staff_role: EventStaffRole.ORGANIZER,
    });
    await this.staffRepo.save(entry);
  }
}
