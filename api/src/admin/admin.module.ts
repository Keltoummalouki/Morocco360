import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Role } from '../users/entities/role.entity';
import { Event } from '../events/entities/event.entity';
import { EventStaff } from '../events/entities/event-staff.entity';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User, Role, Event, EventStaff])],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
