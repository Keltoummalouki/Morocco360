import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserStatus } from '../users/entities/user.entity';
import { Role, RoleName } from '../users/entities/role.entity';
import { Event } from '../events/entities/event.entity';
import { EventStaff } from '../events/entities/event-staff.entity';
import { Order } from '../orders/entities/order.entity';
import { paginate, PaginatedResult } from '../common/pagination';
import {
  AdminUsersQueryDto,
  CreateAdminUserDto,
  UpdateAdminUserDto,
} from './dto/admin-user.dto';

const SORTABLE = {
  username: 'u.username',
  email: 'u.email',
  createdAt: 'u.created_at',
  status: 'u.status',
};

@Injectable()
export class AdminUsersService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Role) private readonly roleRepo: Repository<Role>,
    @InjectRepository(Event) private readonly eventRepo: Repository<Event>,
    @InjectRepository(EventStaff)
    private readonly staffRepo: Repository<EventStaff>,
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
  ) {}

  // ── List (optionally scoped to one role) ───────────────────
  async list(
    query: AdminUsersQueryDto,
    roleScope?: RoleName,
  ): Promise<PaginatedResult<unknown>> {
    const qb = this.userRepo
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.role', 'r');

    const role = roleScope ?? query.role;
    if (role) qb.andWhere('r.name = :role', { role });
    if (query.status) qb.andWhere('u.status = :status', { status: query.status });
    if (query.search?.trim()) {
      qb.andWhere(
        `(u.username ILIKE :s OR u.email ILIKE :s OR u.full_name ILIKE :s
          OR u.first_name ILIKE :s OR u.last_name ILIKE :s OR u.phone_number ILIKE :s)`,
        { s: `%${query.search.trim()}%` },
      );
    }

    const result = await paginate(qb, query, {
      sortable: SORTABLE,
      defaultSort: 'u.created_at',
    });
    return { data: result.data.map((u) => this.toDto(u)), meta: result.meta };
  }

  async findOne(id: number): Promise<unknown> {
    return this.toDto(await this.findEntity(id));
  }

  /** Lightweight search (max 10) for organizer/staff assignment pickers. */
  async search(role?: RoleName, search?: string): Promise<unknown[]> {
    const qb = this.userRepo
      .createQueryBuilder('u')
      .leftJoin('u.role', 'r')
      .select(['u.id', 'u.username', 'u.email', 'u.full_name']);
    if (role) qb.andWhere('r.name = :role', { role });
    if (search?.trim()) {
      qb.andWhere(
        '(u.email ILIKE :s OR u.username ILIKE :s OR u.full_name ILIKE :s)',
        { s: `%${search.trim()}%` },
      );
    }
    const users = await qb.orderBy('u.username', 'ASC').limit(10).getMany();
    return users.map((u) => ({
      id: u.id,
      username: u.username,
      email: u.email,
      full_name: u.full_name,
    }));
  }

  async create(dto: CreateAdminUserDto, role: RoleName): Promise<unknown> {
    await this.assertUnique(dto.username, dto.email, dto.phone_number);
    const roleEntity = await this.roleRepo.findOne({ where: { name: role } });
    const password = await bcrypt.hash(dto.password, 12);
    const user = this.userRepo.create({
      username: dto.username,
      email: dto.email,
      password,
      first_name: dto.first_name,
      last_name: dto.last_name,
      full_name: dto.full_name,
      phone_number: dto.phone_number,
      date_of_birth: dto.date_of_birth ?? null,
      role: roleEntity ?? undefined,
      status: UserStatus.ACTIVE,
    });
    return this.toDto(await this.userRepo.save(user));
  }

  async update(id: number, dto: UpdateAdminUserDto): Promise<unknown> {
    const user = await this.findEntity(id);
    await this.assertUnique(
      dto.username,
      dto.email,
      dto.phone_number,
      id,
      user,
    );

    const fields: (keyof UpdateAdminUserDto)[] = [
      'username',
      'email',
      'first_name',
      'last_name',
      'full_name',
      'phone_number',
    ];
    for (const key of fields) {
      const value = dto[key];
      // Object.assign keeps the copy type-checked; indexing through `any`
      // would silently accept a key the entity does not have.
      if (value !== undefined) Object.assign(user, { [key]: value });
    }
    if (dto.date_of_birth !== undefined) {
      user.date_of_birth = dto.date_of_birth || null;
    }
    return this.toDto(await this.userRepo.save(user));
  }

  async setStatus(id: number, status: UserStatus): Promise<unknown> {
    const user = await this.findEntity(id);
    user.status = status;
    // Suspended users must be forced to re-authenticate.
    if (status === UserStatus.SUSPENDED) user.refresh_token_hash = null;
    return this.toDto(await this.userRepo.save(user));
  }

  // ── Related data ───────────────────────────────────────────
  async getOrders(
    id: number,
    query: AdminUsersQueryDto,
  ): Promise<PaginatedResult<unknown>> {
    await this.findEntity(id);
    const qb = this.orderRepo
      .createQueryBuilder('o')
      .leftJoinAndSelect('o.payment', 'p')
      .where('o.userId = :id', { id });
    const result = await paginate(qb, query, {
      sortable: { createdAt: 'o.created_at', amount: 'o.total_amount' },
      defaultSort: 'o.created_at',
    });
    return {
      data: result.data.map((o) => ({
        id: o.id,
        total_amount: o.total_amount,
        status: o.status,
        created_at: o.created_at,
        payment_status: o.payment?.status ?? null,
      })),
      meta: result.meta,
    };
  }

  /** Events created by the organizer + events they are assigned to. */
  async getOrganizerEvents(id: number): Promise<unknown[]> {
    await this.findEntity(id);
    const [created, assignments] = await Promise.all([
      this.eventRepo.find({
        where: { organizer: { id } },
        order: { date_start: 'DESC' },
      }),
      this.staffRepo.find({
        where: { user: { id } },
        relations: ['event'],
      }),
    ]);
    const byId = new Map<number, { event: Event; source: string }>();
    for (const e of created) byId.set(e.id, { event: e, source: 'created' });
    for (const a of assignments) {
      if (a.event && !byId.has(a.event.id)) {
        byId.set(a.event.id, { event: a.event, source: 'assigned' });
      }
    }
    return [...byId.values()].map(({ event, source }) => ({
      id: event.id,
      title: event.title,
      date_start: event.date_start,
      city: event.city,
      status: event.status,
      source,
    }));
  }

  /** Events a staff member is assigned to. */
  async getStaffEvents(id: number): Promise<unknown[]> {
    await this.findEntity(id);
    const assignments = await this.staffRepo.find({
      where: { user: { id } },
      relations: ['event'],
      order: { assigned_at: 'DESC' },
    });
    return assignments
      .filter((a) => a.event)
      .map((a) => ({
        id: a.event.id,
        title: a.event.title,
        date_start: a.event.date_start,
        city: a.event.city,
        status: a.event.status,
        staffRole: a.staff_role,
      }));
  }

  // ── Helpers ────────────────────────────────────────────────
  private async findEntity(id: number): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { id },
      relations: ['role'],
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  private async assertUnique(
    username?: string,
    email?: string,
    phone?: string,
    excludeId?: number,
    current?: User,
  ): Promise<void> {
    const idFilter = excludeId ? Not(excludeId) : undefined;
    if (username && username !== current?.username) {
      const dup = await this.userRepo.findOne({
        where: { username, ...(idFilter ? { id: idFilter } : {}) },
      });
      if (dup) throw new ConflictException('Username already taken');
    }
    if (email && email !== current?.email) {
      const dup = await this.userRepo.findOne({
        where: { email, ...(idFilter ? { id: idFilter } : {}) },
      });
      if (dup) throw new ConflictException('Email already in use');
    }
    if (phone && phone !== current?.phone_number) {
      const dup = await this.userRepo.findOne({
        where: { phone_number: phone, ...(idFilter ? { id: idFilter } : {}) },
      });
      if (dup) throw new ConflictException('Phone number already in use');
    }
  }

  private toDto(u: User) {
    return {
      id: u.id,
      username: u.username,
      email: u.email,
      first_name: u.first_name,
      last_name: u.last_name,
      full_name: u.full_name,
      phone_number: u.phone_number,
      date_of_birth: u.date_of_birth,
      status: u.status,
      role: u.role?.name ?? null,
      created_at: u.created_at,
    };
  }
}
