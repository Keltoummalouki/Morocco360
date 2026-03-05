import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Event } from './event.entity';
import { Ticket } from '../../orders/entities/ticket.entity';

@Entity('ticket_categories')
export class TicketCategory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ default: 0 })
  stock_allocated: number;

  @ManyToOne(() => Event, (event) => event.categories, { onDelete: 'CASCADE' })
  event: Event;

  @OneToMany(() => Ticket, (ticket) => ticket.category)
  tickets: Ticket[];
}
