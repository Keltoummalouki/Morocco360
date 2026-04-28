import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizerService } from './organizer.service';
import { OrganizerController } from './organizer.controller';
import { Event } from '../events/entities/event.entity';
import { EventStaff } from '../events/entities/event-staff.entity';
import { Ticket } from '../orders/entities/ticket.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Event, EventStaff, Ticket, User])],
  providers: [OrganizerService],
  controllers: [OrganizerController],
})
export class OrganizerModule {}
