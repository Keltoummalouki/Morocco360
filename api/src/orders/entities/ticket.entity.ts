import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Order } from './order.entity';
import { TicketCategory } from '../../events/entities/ticket-category.entity';

export enum TicketStatus {
  VALID = 'VALID',
  USED = 'USED',
  CANCELLED = 'CANCELLED',
}

@Entity('tickets')
export class Ticket {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  qr_code: string;

  @Column({ type: 'enum', enum: TicketStatus, default: TicketStatus.VALID })
  status: TicketStatus;

  @Column({ nullable: true })
  pdf_url: string;

  @Column({ type: 'timestamp', nullable: true })
  scanned_at: Date;

  @ManyToOne(() => Order, (order) => order.tickets, { onDelete: 'CASCADE' })
  order: Order;

  @ManyToOne(() => TicketCategory, (category) => category.tickets, {
    eager: true,
  })
  category: TicketCategory;
}
