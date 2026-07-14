import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Order } from '../../orders/entities/order.entity';

export enum PaymentGateway {
  STRIPE = 'STRIPE',
  PAYPAL = 'PAYPAL',
  BANK_CARD = 'BANK_CARD',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  /** Legacy "paid" state written by the Stripe flow; treated as PAID by admin. */
  SUCCESS = 'SUCCESS',
  PAID = 'PAID',
  NOT_PAID = 'NOT_PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: PaymentGateway })
  gateway: PaymentGateway;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ length: 10, default: 'MAD' })
  currency: string;

  @Column({ nullable: true })
  transaction_id: string;

  @Column({ nullable: true })
  invoice_number: string;

  @Column({ nullable: true })
  invoice_pdf_url: string;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @CreateDateColumn()
  created_at: Date;

  @OneToOne(() => Order, (order) => order.payment, { onDelete: 'CASCADE' })
  @JoinColumn()
  order: Order;
}
