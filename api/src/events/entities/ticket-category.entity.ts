import {
  BeforeInsert,
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

  /** Places restantes après ventes — initialisé à stock_allocated à la création */
  @Column({ default: 0 })
  stock_remaining: number;

  @BeforeInsert()
  initStockRemaining() {
    if (!this.stock_remaining) {
      this.stock_remaining = this.stock_allocated;
    }
  }

  @ManyToOne(() => Event, (event) => event.categories, { onDelete: 'CASCADE' })
  event: Event;

  @OneToMany(() => Ticket, (ticket) => ticket.category)
  tickets: Ticket[];
}
