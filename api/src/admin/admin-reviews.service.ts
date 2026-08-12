import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  EventReview,
  ReviewStatus,
} from '../reviews/entities/event-review.entity';
import { User } from '../users/entities/user.entity';
import { paginate, PaginatedResult } from '../common/pagination';
import { AdminReviewsQueryDto } from './dto/admin-review.dto';

const SORTABLE = {
  createdAt: 'rv.created_at',
  rating: 'rv.rating',
  status: 'rv.status',
};

@Injectable()
export class AdminReviewsService {
  constructor(
    @InjectRepository(EventReview)
    private readonly repo: Repository<EventReview>,
  ) {}

  async list(query: AdminReviewsQueryDto): Promise<PaginatedResult<unknown>> {
    const qb = this.repo
      .createQueryBuilder('rv')
      .leftJoinAndSelect('rv.event', 'e')
      .leftJoinAndSelect('rv.user', 'u');

    if (query.status)
      qb.andWhere('rv.status = :status', { status: query.status });
    if (query.eventId)
      qb.andWhere('e.id = :eventId', { eventId: query.eventId });
    if (query.userId) qb.andWhere('u.id = :userId', { userId: query.userId });
    if (query.rating)
      qb.andWhere('rv.rating = :rating', { rating: query.rating });
    if (query.search?.trim()) {
      qb.andWhere(
        `(rv.comment ILIKE :s OR u.full_name ILIKE :s OR u.email ILIKE :s
          OR u.username ILIKE :s OR e.title ILIKE :s)`,
        { s: `%${query.search.trim()}%` },
      );
    }

    const result = await paginate(qb, query, {
      sortable: SORTABLE,
      defaultSort: 'rv.created_at',
    });
    return { data: result.data.map((r) => this.toDto(r)), meta: result.meta };
  }

  async findOne(id: number): Promise<unknown> {
    const review = await this.repo.findOne({
      where: { id },
      relations: ['event', 'user', 'approved_by'],
    });
    if (!review) throw new NotFoundException('Review not found');
    return this.toDto(review);
  }

  async setStatus(
    id: number,
    status: ReviewStatus,
    adminId: number,
  ): Promise<unknown> {
    const review = await this.repo.findOne({
      where: { id },
      relations: ['event', 'user'],
    });
    if (!review) throw new NotFoundException('Review not found');
    review.status = status;
    review.approved_by =
      status === ReviewStatus.APPROVED ? ({ id: adminId } as User) : null!;
    await this.repo.save(review);
    return this.toDto(review);
  }

  private toDto(r: EventReview) {
    return {
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      status: r.status,
      created_at: r.created_at,
      event: r.event ? { id: r.event.id, title: r.event.title } : null,
      user: r.user
        ? {
            id: r.user.id,
            username: r.user.username,
            email: r.user.email,
            full_name: r.user.full_name,
          }
        : null,
    };
  }
}
