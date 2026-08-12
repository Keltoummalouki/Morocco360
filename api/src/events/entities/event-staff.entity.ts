import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Event } from './event.entity';
import { User } from '../../users/entities/user.entity';

export enum EventStaffRole {
  ORGANIZER = 'ORGANIZER',
  STAFF = 'STAFF',
}

@Entity('event_staff')
@Unique(['event', 'user'])
export class EventStaff {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Event, { onDelete: 'CASCADE', nullable: false })
  event: Event;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  user: User;

  @Column({ type: 'enum', enum: EventStaffRole })
  staff_role: EventStaffRole;

  @CreateDateColumn()
  assigned_at: Date;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  assigned_by: User;
}
