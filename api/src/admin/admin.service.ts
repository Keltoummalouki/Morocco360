import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserStatus } from '../users/entities/user.entity';
import { Role, RoleName } from '../users/entities/role.entity';
import { Event } from '../events/entities/event.entity';
import {
  EventStaff,
  EventStaffRole,
} from '../events/entities/event-staff.entity';
import { CreateOrganizerDto } from './dto/create-organizer.dto';
import { UpdateUserDto, UpdateUserStatusDto } from './dto/update-user.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Role) private readonly roleRepo: Repository<Role>,
    @InjectRepository(Event) private readonly eventRepo: Repository<Event>,
    @InjectRepository(EventStaff)
    private readonly staffRepo: Repository<EventStaff>,
  ) {}

  // ── List users filtered by role ──────────────────────────────────────────
  async listUsers(roleName?: RoleName, search?: string): Promise<unknown[]> {
    const qb = this.userRepo
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.role', 'r')
      .orderBy('u.created_at', 'DESC');

    if (roleName) {
      qb.andWhere('r.name = :role', { role: roleName });
    }
    if (search) {
      qb.andWhere(
        '(u.email ILIKE :s OR u.username ILIKE :s OR u.full_name ILIKE :s)',
        {
          s: `%${search}%`,
        },
      );
    }

    const users = await qb.getMany();
    return users.map((u) => this.toDto(u));
  }

  // ── Create organizer ──────────────────────────────────────────────────────
  async createOrganizer(dto: CreateOrganizerDto): Promise<unknown> {
    const exists = await this.userRepo.findOne({ where: { email: dto.email } });
    if (exists) throw new ConflictException('Email already in use');

    const role = await this.roleRepo.findOne({
      where: { name: RoleName.ORGANIZER },
    });
    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = this.userRepo.create({
      username: dto.username,
      email: dto.email,
      password: passwordHash,
      full_name: dto.full_name,
      phone_number: dto.phone_number,
      role: role ?? undefined,
      status: UserStatus.ACTIVE,
    });
    const saved = await this.userRepo.save(user);
    return this.toDto(saved);
  }

  // ── Update user fields ─────────────────────────────────────────────────────
  async updateUser(id: number, dto: UpdateUserDto): Promise<unknown> {
    const user = await this.findOrFail(id);
    if (dto.email && dto.email !== user.email) {
      const dup = await this.userRepo.findOne({ where: { email: dto.email } });
      if (dup) throw new ConflictException('Email already in use');
    }
    Object.assign(user, dto);
    const saved = await this.userRepo.save(user);
    return this.toDto(saved);
  }

  // ── Suspend / activate ─────────────────────────────────────────────────────
  async setStatus(id: number, dto: UpdateUserStatusDto): Promise<unknown> {
    const user = await this.findOrFail(id);
    user.status = dto.status;
    // Invalidate refresh token so the user is forced to re-login
    if (dto.status === UserStatus.SUSPENDED) {
      user.refresh_token_hash = null;
    }
    const saved = await this.userRepo.save(user);
    return this.toDto(saved);
  }

  // ── Delete user ────────────────────────────────────────────────────────────
  async deleteUser(id: number): Promise<void> {
    const user = await this.findOrFail(id);
    await this.userRepo.remove(user);
  }

  // ── Platform statistics ────────────────────────────────────────────────────
  async getStats() {
    const now = new Date();

    const [totalUsers, totalOrganizers, totalEvents, activeEvents] =
      await Promise.all([
        this.userRepo
          .createQueryBuilder('u')
          .leftJoin('u.role', 'r')
          .where('r.name = :role', { role: 'USER' })
          .getCount(),
        this.userRepo
          .createQueryBuilder('u')
          .leftJoin('u.role', 'r')
          .where('r.name = :role', { role: 'ORGANIZER' })
          .getCount(),
        this.eventRepo.count(),
        this.eventRepo.count({ where: { is_active: true } }),
      ]);

    const [recentUsers, upcomingEvents] = await Promise.all([
      this.userRepo.find({
        relations: ['role'],
        order: { created_at: 'DESC' },
        take: 5,
      }),
      this.eventRepo.find({
        select: [
          'id',
          'title',
          'date_start',
          'city',
          'category',
          'is_active',
          'total_stock',
        ],
        where: { date_start: MoreThanOrEqual(now) },
        order: { date_start: 'ASC' },
        take: 5,
      }),
    ]);

    return {
      totalUsers,
      totalOrganizers,
      totalEvents,
      activeEvents,
      recentUsers: recentUsers.map((u) => this.toDto(u)),
      upcomingEvents,
    };
  }

  // ── List all events (for assignment dropdown) ──────────────────────────────
  async listEvents(): Promise<unknown[]> {
    const events = await this.eventRepo.find({
      select: ['id', 'title', 'date_start', 'city'],
      order: { date_start: 'DESC' },
    });
    return events;
  }

  // ── Assign event to organizer ──────────────────────────────────────────────
  async assignEvent(userId: number, eventId: number): Promise<unknown> {
    const user = await this.findOrFail(userId);
    const event = await this.eventRepo.findOne({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event not found');

    const existing = await this.staffRepo.findOne({
      where: { user_id: userId, event_id: eventId },
    });
    if (existing)
      throw new ConflictException('Event already assigned to this organizer');

    const entry = this.staffRepo.create({
      user,
      user_id: userId,
      event,
      event_id: eventId,
      staff_role: EventStaffRole.ORGANIZER,
      assigned_by_user_id: userId, // self-assigned by admin action
    });
    await this.staffRepo.save(entry);
    return { userId, eventId, assigned: true };
  }

  // ── Remove event assignment ────────────────────────────────────────────────
  async removeEventAssignment(userId: number, eventId: number): Promise<void> {
    const entry = await this.staffRepo.findOne({
      where: { user_id: userId, event_id: eventId },
    });
    if (!entry) throw new NotFoundException('Assignment not found');
    await this.staffRepo.remove(entry);
  }

  // ── Events assigned to a specific organizer ────────────────────────────────
  async getOrganizerEvents(userId: number): Promise<unknown[]> {
    const entries = await this.staffRepo.find({
      where: { user_id: userId },
      relations: ['event'],
    });
    return entries.map((e) => ({
      id: e.event.id,
      title: e.event.title,
      date_start: e.event.date_start,
      city: e.event.city,
    }));
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  private async findOrFail(id: number): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { id },
      relations: ['role'],
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  private toDto(u: User) {
    return {
      id: u.id,
      username: u.username,
      email: u.email,
      full_name: u.full_name,
      phone_number: u.phone_number,
      status: u.status,
      role: u.role?.name ?? null,
      created_at: u.created_at,
    };
  }
}
