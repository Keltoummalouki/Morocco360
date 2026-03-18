import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { Payment } from './entities/payment.entity';
import { Order } from '../orders/entities/order.entity';
import { Ticket } from '../orders/entities/ticket.entity';
import { TicketCategory } from '../events/entities/ticket-category.entity';
import { Event } from '../events/entities/event.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, Order, Ticket, TicketCategory, Event, User]),
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
