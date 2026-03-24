import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Event } from './entities/event.entity';
import { User } from '../users/entities/user.entity';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Event, User])],
  providers: [EventsService],
  controllers: [EventsController],
})
export class EventsModule {}
