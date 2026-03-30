import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
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
@Unique(['event_id', 'user_id'])
export class EventStaff {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  event_id: number;

  @ManyToOne(() => Event, { onDelete: 'CASCADE', nullable: false })
  event: Event;

  @Index()
  @Column()
  user_id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  user: User;

  @Column({ type: 'enum', enum: EventStaffRole })
  staff_role: EventStaffRole;

  @CreateDateColumn()
  assigned_at: Date;

  @Column({ nullable: true })
  assigned_by_user_id: number;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  assigned_by: User;
}
