import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from '../../events/entities/event.entity';
import { User } from '../../users/entities/user.entity';
import {
  EventReview,
  ReviewStatus,
} from '../../reviews/entities/event-review.entity';

interface SeedReview {
  user: string;
  event: string;
  rating: number;
  comment: string;
  status: ReviewStatus;
}

const SEED_REVIEWS: SeedReview[] = [
  {
    user: 'user@eventhub.com',
    event: 'Marrakech du Rire',
    rating: 5,
    comment: 'Événement incroyable, très bien organisé ! On reviendra.',
    status: ReviewStatus.APPROVED,
  },
  {
    user: 'amine.tazi@example.ma',
    event: 'Marrakech du Rire',
    rating: 4,
    comment: 'Bonne ambiance mais un peu bondé le samedi soir.',
    status: ReviewStatus.APPROVED,
  },
  {
    user: 'youssef.idrissi@example.ma',
    event: 'Marrakech du Rire',
    rating: 2,
    comment: 'Décevant par rapport au prix de la loge.',
    status: ReviewStatus.PENDING,
  },
  {
    user: 'user@eventhub.com',
    event: "Festival des Roses de Kelaat M'Gouna",
    rating: 5,
    comment: 'La vallée en pleine floraison, un souvenir inoubliable.',
    status: ReviewStatus.APPROVED,
  },
  {
    user: 'imane.raji@example.ma',
    event: "Festival des Roses de Kelaat M'Gouna",
    rating: 3,
    comment: 'Beau festival mais le circuit guidé était trop rapide.',
    status: ReviewStatus.PENDING,
  },
  {
    user: 'sara.bennis@example.ma',
    event: 'Rallye Aicha des Gazelles',
    rating: 5,
    comment: 'Organisation au top et une aventure humaine unique.',
    status: ReviewStatus.APPROVED,
  },
  {
    user: 'user@eventhub.com',
    event: 'Rallye Aicha des Gazelles',
    rating: 1,
    comment: 'Contenu inapproprié à modérer — test de rejet.',
    status: ReviewStatus.UNAPPROVED,
  },
  {
    user: 'nadia.fassi@example.ma',
    event: 'Marrakech Jazz Festival',
    rating: 4,
    comment: 'Programmation solide, hâte de la prochaine édition.',
    status: ReviewStatus.PENDING,
  },
  {
    user: 'lucie.martin@example.fr',
    event: 'Atlas Electronic',
    rating: 5,
    comment: 'Le cadre au pied de l’Atlas change tout. Line-up excellent.',
    status: ReviewStatus.PENDING,
  },
  {
    user: 'karim.ouazzani@example.ma',
    event: 'Gnaoua World Music Festival',
    rating: 4,
    comment: 'Les maalems étaient exceptionnels, un peu trop de monde.',
    status: ReviewStatus.APPROVED,
  },
];

@Injectable()
export class ReviewSeeder {
  constructor(
    @InjectRepository(EventReview)
    private readonly reviewRepo: Repository<EventReview>,
    @InjectRepository(Event) private readonly eventRepo: Repository<Event>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  async seed(): Promise<void> {
    if ((await this.reviewRepo.count()) > 0) {
      console.log('  [ReviewSeeder] Reviews already seeded — skipping');
      return;
    }

    const [users, events] = await Promise.all([
      this.userRepo.find(),
      this.eventRepo.find(),
    ]);
    const userByEmail = new Map(users.map((u) => [u.email, u]));
    const eventByTitle = new Map(events.map((e) => [e.title, e]));
    const admin = userByEmail.get('admin@eventhub.com') ?? null;

    let created = 0;
    for (const data of SEED_REVIEWS) {
      const user = userByEmail.get(data.user);
      const event = eventByTitle.get(data.event);
      if (!user || !event) continue;

      await this.reviewRepo.save(
        this.reviewRepo.create({
          user,
          event,
          rating: data.rating,
          comment: data.comment,
          status: data.status,
          // Moderated rows record who acted on them.
          approved_by:
            data.status === ReviewStatus.PENDING
              ? undefined
              : (admin ?? undefined),
        }),
      );
      created++;
    }
    console.log(`  [ReviewSeeder] Created ${created} reviews`);
  }
}
