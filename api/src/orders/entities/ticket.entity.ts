import {
  Column,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Order } from './order.entity';
import { TicketCategory } from '../../events/entities/ticket-category.entity';
import { Event } from '../../events/entities/event.entity';
import { User } from '../../users/entities/user.entity';

export enum TicketStatus {
  PENDING = 'PENDING',
  VALID = 'VALID',
  CHECKED = 'CHECKED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

@Entity('tickets')
export class Ticket {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, nullable: true, select: false })
  qr_code: string;

  @Column({ type: 'enum', enum: TicketStatus, default: TicketStatus.VALID })
  status: TicketStatus;

  @Column({ nullable: true })
  pdf_url: string;

  @Column({ nullable: true, length: 50 })
  seat_number: string;

  @Column({ type: 'timestamp', nullable: true })
  scanned_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  checked_at: Date;

  @Column({ nullable: true })
  checked_by_user_id: number;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  checked_by: User;

  /** Denormalized FK for fast scanner lookup — avoids joining order→category→event */
  @Index()
  @Column({ nullable: true })
  event_id: number;

  @ManyToOne(() => Event, { nullable: true, onDelete: 'CASCADE' })
  event: Event;

  @ManyToOne(() => Order, (order) => order.tickets, { onDelete: 'CASCADE' })
  order: Order;

  @ManyToOne(() => TicketCategory, (category) => category.tickets, {
    eager: true,
  })
  category: TicketCategory;
}
