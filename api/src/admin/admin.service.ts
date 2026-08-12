import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Event } from '../events/entities/event.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Event) private readonly eventRepo: Repository<Event>,
  ) {}

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
