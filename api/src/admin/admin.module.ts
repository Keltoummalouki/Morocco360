import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Role } from '../users/entities/role.entity';
import { Event } from '../events/entities/event.entity';
import { EventStaff } from '../events/entities/event-staff.entity';
import { TicketCategory } from '../events/entities/ticket-category.entity';
import { Order } from '../orders/entities/order.entity';
import { Ticket } from '../orders/entities/ticket.entity';
import { Payment } from '../payments/entities/payment.entity';
import { City } from '../settings/entities/city.entity';
import { EventCategory } from '../settings/entities/event-category.entity';
import { EventReview } from '../reviews/entities/event-review.entity';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { AdminEventsService } from './admin-events.service';
import { AdminEventsController } from './admin-events.controller';
import { AdminUsersService } from './admin-users.service';
import { AdminUsersController } from './admin-users.controller';
import { AdminOrganizersController } from './admin-organizers.controller';
import { AdminStaffController } from './admin-staff.controller';
import { AdminBookingsService } from './admin-bookings.service';
import { AdminBookingsController } from './admin-bookings.controller';
import { AdminPaymentsService } from './admin-payments.service';
import { AdminPaymentsController } from './admin-payments.controller';
import { AdminReviewsService } from './admin-reviews.service';
import { AdminReviewsController } from './admin-reviews.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Role,
      Event,
      EventStaff,
      TicketCategory,
      Order,
      Ticket,
      Payment,
      City,
      EventCategory,
      EventReview,
    ]),
  ],
  controllers: [
    AdminController,
    AdminEventsController,
    AdminUsersController,
    AdminOrganizersController,
    AdminStaffController,
    AdminBookingsController,
    AdminPaymentsController,
    AdminReviewsController,
  ],
  providers: [
    AdminService,
    AdminEventsService,
    AdminUsersService,
    AdminBookingsService,
    AdminPaymentsService,
    AdminReviewsService,
  ],
})
export class AdminModule {}
