import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from '../events/entities/event.entity';
import {
  EventStaff,
  EventStaffRole,
} from '../events/entities/event-staff.entity';
import { Ticket, TicketStatus } from '../orders/entities/ticket.entity';
import { User } from '../users/entities/user.entity';
import { AssignStaffDto } from './dto/assign-staff.dto';

interface AssignedEventRaw {
  event_id: number;
  title: string;
  date_start: Date;
  date_end: Date;
  location_name: string;
  city: string;
  image_url: string;
  staff_role: string;
  total_tickets: string;
  checked_in: string;
  pending: string;
  cancelled: string;
}

interface EventStatsRaw {
  sold: string;
  checked_in: string;
  pending: string;
  cancelled: string;
}

interface CategoryStatsRaw {
  name: string;
  total: string;
  checked: string;
}

@Injectable()
export class OrganizerService {
  private readonly logger = new Logger(OrganizerService.name);

  constructor(
    @InjectRepository(Event) private readonly eventRepo: Repository<Event>,
    @InjectRepository(EventStaff)
    private readonly staffRepo: Repository<EventStaff>,
    @InjectRepository(Ticket) private readonly ticketRepo: Repository<Ticket>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  async getAssignedEvents(userId: number): Promise<unknown[]> {
    const result = await this.staffRepo
      .createQueryBuilder('es')
      .leftJoin('es.event', 'e')
      .leftJoin('tickets', 't', 't.event_id = es.event_id')
      .select([
        'es.id AS assignment_id',
        'es.staff_role AS staff_role',
        'e.id AS event_id',
        'e.title AS title',
        'e.date_start AS date_start',
        'e.date_end AS date_end',
        'e.location_name AS location_name',
        'e.city AS city',
        'e.image_url AS image_url',
        'COUNT(t.id) AS total_tickets',
        `SUM(CASE WHEN t.status = '${TicketStatus.CHECKED}' THEN 1 ELSE 0 END) AS checked_in`,
        `SUM(CASE WHEN t.status = '${TicketStatus.VALID}' THEN 1 ELSE 0 END) AS pending`,
        `SUM(CASE WHEN t.status = '${TicketStatus.CANCELLED}' THEN 1 ELSE 0 END) AS cancelled`,
      ])
      .where('es.user_id = :userId', { userId })
      .groupBy(
        'es.id, es.staff_role, e.id, e.title, e.date_start, e.date_end, e.location_name, e.city, e.image_url',
      )
      .getRawMany<AssignedEventRaw>();

    return result.map((row) => ({
      id: row.event_id,
      title: row.title,
      date_start: row.date_start,
      date_end: row.date_end,
      location_name: row.location_name,
      city: row.city,
      image_url: row.image_url,
      staffRole: row.staff_role,
      stats: {
        totalTickets: Number(row.total_tickets) || 0,
        checkedIn: Number(row.checked_in) || 0,
        pending: Number(row.pending) || 0,
        cancelled: Number(row.cancelled) || 0,
      },
    }));
  }

  async getEventStats(eventId: number, userId: number): Promise<unknown> {
    await this.assertAssigned(eventId, userId);

    const event = await this.eventRepo.findOne({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event not found');

    const overallStats = await this.ticketRepo
      .createQueryBuilder('t')
      .select([
        'COUNT(t.id) AS sold',
        `SUM(CASE WHEN t.status = '${TicketStatus.CHECKED}' THEN 1 ELSE 0 END) AS checked_in`,
        `SUM(CASE WHEN t.status = '${TicketStatus.VALID}' THEN 1 ELSE 0 END) AS pending`,
        `SUM(CASE WHEN t.status = '${TicketStatus.CANCELLED}' THEN 1 ELSE 0 END) AS cancelled`,
      ])
      .where('t.event_id = :eventId', { eventId })
      .getRawOne<EventStatsRaw>();

    const categoryStats = await this.ticketRepo
      .createQueryBuilder('t')
      .leftJoin('t.category', 'c')
      .select([
        'c.name AS name',
        'COUNT(t.id) AS total',
        `SUM(CASE WHEN t.status = '${TicketStatus.CHECKED}' THEN 1 ELSE 0 END) AS checked`,
      ])
      .where('t.event_id = :eventId', { eventId })
      .groupBy('c.id, c.name')
      .getRawMany<CategoryStatsRaw>();

    const sold = Number(overallStats?.sold) || 0;
    const checkedIn = Number(overallStats?.checked_in) || 0;
    const pending = Number(overallStats?.pending) || 0;
    const cancelled = Number(overallStats?.cancelled) || 0;

    return {
      title: event.title,
      capacity: event.total_stock,
      sold,
      checkedIn,
      pending,
      cancelled,
      remaining: event.total_stock - sold,
      checkInRate: sold > 0 ? Math.round((checkedIn / sold) * 100) : 0,
      byCategory: categoryStats.map((row) => ({
        name: row.name,
        total: Number(row.total),
        checked: Number(row.checked),
        remaining: Number(row.total) - Number(row.checked),
      })),
    };
  }

  async getAttendees(eventId: number, userId: number): Promise<unknown[]> {
    await this.assertAssigned(eventId, userId);
    const tickets = await this.ticketRepo.find({
      where: { event_id: eventId, status: TicketStatus.CHECKED },
      relations: ['order', 'order.user', 'category'],
      order: { checked_at: 'DESC' },
    });
    return tickets.map((t) => ({
      ticketId: t.id,
      holderName: t.order?.user?.full_name ?? t.order?.user?.username ?? '—',
      email: t.order?.user?.email ?? '—',
      category: t.category?.name ?? '—',
      checkedAt: t.checked_at,
      seat: t.seat_number ?? null,
    }));
  }

  async assignStaff(
    eventId: number,
    dto: AssignStaffDto,
    assignedBy: number,
  ): Promise<EventStaff> {
    const [event, user] = await Promise.all([
      this.eventRepo.findOne({ where: { id: eventId } }),
      this.userRepo.findOne({ where: { id: dto.userId } }),
    ]);
    if (!event) throw new NotFoundException('Event not found');
    if (!user) throw new NotFoundException('User not found');

    const existing = await this.staffRepo.findOne({
      where: { event_id: eventId, user_id: dto.userId },
    });
    if (existing)
      throw new ConflictException('User already assigned to this event');

    const entry = this.staffRepo.create({
      event,
      event_id: eventId,
      user,
      user_id: dto.userId,
      staff_role: EventStaffRole.ORGANIZER,
      assigned_by_user_id: assignedBy,
    });
    this.logger.log(
      `Assigned user=${dto.userId} as ORGANIZER to event=${eventId} by user=${assignedBy}`,
    );
    return this.staffRepo.save(entry);
  }

  async removeStaff(eventId: number, userId: number): Promise<void> {
    const entry = await this.staffRepo.findOne({
      where: { event_id: eventId, user_id: userId },
    });
    if (!entry) throw new NotFoundException('Assignment not found');
    await this.staffRepo.remove(entry);
  }

  async getStaff(eventId: number): Promise<unknown[]> {
    const entries = await this.staffRepo.find({
      where: { event_id: eventId },
      relations: ['user'],
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
      },
    }));
  }

  async getAttendeesForExport(
    eventId: number,
    userId: number,
  ): Promise<Ticket[]> {
    await this.assertAssigned(eventId, userId);
    return this.ticketRepo.find({
      where: { event_id: eventId },
      relations: ['order', 'order.user', 'category'],
    });
  }

  async searchUsers(email?: string, username?: string): Promise<unknown[]> {
    const qb = this.userRepo
      .createQueryBuilder('u')
      .select(['u.id', 'u.email', 'u.username', 'u.full_name']);
    if (email) {
      qb.where('u.email ILIKE :email', { email: `%${email}%` });
    } else if (username) {
      qb.where('u.username ILIKE :username', { username: `%${username}%` });
    }
    const users = await qb.limit(10).getMany();
    return users.map((u) => ({
      id: u.id,
      email: u.email,
      username: u.username,
      full_name: u.full_name,
    }));
  }

  private async assertAssigned(eventId: number, userId: number): Promise<void> {
    const found = await this.staffRepo.findOne({
      where: { event_id: eventId, user_id: userId },
    });
    if (!found) throw new ForbiddenException('Not assigned to this event');
  }
}
