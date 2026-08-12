import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventReview } from './entities/event-review.entity';

/**
 * Event comments & reviews. Admin moderation controllers/services are added in
 * the Bookings/Payments/Reviews phase; this registers the table.
 */
@Module({
  imports: [TypeOrmModule.forFeature([EventReview])],
  exports: [TypeOrmModule],
})
export class ReviewsModule {}
