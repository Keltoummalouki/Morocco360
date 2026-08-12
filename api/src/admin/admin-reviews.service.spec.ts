import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminReviewsService } from './admin-reviews.service';
import {
  EventReview,
  ReviewStatus,
} from '../reviews/entities/event-review.entity';

function chainableQb(rows: unknown[], total: number) {
  const qb: Record<string, jest.Mock> = {};
  for (const m of [
    'leftJoinAndSelect',
    'andWhere',
    'orderBy',
    'skip',
    'take',
  ]) {
    qb[m] = jest.fn().mockReturnValue(qb);
  }
  qb.getManyAndCount = jest.fn().mockResolvedValue([rows, total]);
  return qb;
}

describe('AdminReviewsService', () => {
  let service: AdminReviewsService;
  let repo: jest.Mocked<Repository<EventReview>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminReviewsService,
        {
          provide: getRepositoryToken(EventReview),
          useValue: {
            createQueryBuilder: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn((v) => Promise.resolve(v)),
          },
        },
      ],
    }).compile();

    service = module.get(AdminReviewsService);
    repo = module.get(getRepositoryToken(EventReview));
  });

  describe('list', () => {
    it('filters by rating and status', async () => {
      const qb = chainableQb([], 0);
      repo.createQueryBuilder.mockReturnValue(qb as never);

      await service.list({
        page: 1,
        limit: 20,
        rating: 5,
        status: ReviewStatus.PENDING,
      });

      expect(qb.andWhere).toHaveBeenCalledWith('rv.rating = :rating', {
        rating: 5,
      });
      expect(qb.andWhere).toHaveBeenCalledWith('rv.status = :status', {
        status: ReviewStatus.PENDING,
      });
    });
  });

  describe('setStatus', () => {
    it('records the approver when approving', async () => {
      repo.findOne.mockResolvedValue({
        id: 1,
        status: ReviewStatus.PENDING,
      } as EventReview);

      await service.setStatus(1, ReviewStatus.APPROVED, 42);

      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: ReviewStatus.APPROVED,
          approved_by: { id: 42 },
        }),
      );
    });

    it('clears the approver when unapproving', async () => {
      repo.findOne.mockResolvedValue({
        id: 1,
        status: ReviewStatus.APPROVED,
      } as EventReview);

      await service.setStatus(1, ReviewStatus.UNAPPROVED, 42);

      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: ReviewStatus.UNAPPROVED,
          approved_by: null,
        }),
      );
    });
  });
});
