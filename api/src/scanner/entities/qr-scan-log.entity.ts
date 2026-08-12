import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Ticket } from '../../orders/entities/ticket.entity';
import { User } from '../../users/entities/user.entity';

export enum ScanResult {
  SUCCESS = 'SUCCESS',
  ALREADY_USED = 'ALREADY_USED',
  INVALID = 'INVALID',
  WRONG_EVENT = 'WRONG_EVENT',
  EXPIRED = 'EXPIRED',
}

@Entity('qr_scan_logs')
export class QRScanLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  ticket_id: number;

  // The relation reuses the raw FK column above. Without @JoinColumn, TypeORM
  // adds a second NOT NULL "ticketId" column and every insert that only sets
  // ticket_id (i.e. every scan) fails.
  @ManyToOne(() => Ticket, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'ticket_id' })
  ticket: Ticket;

  @Index()
  @Column()
  scanned_by_user_id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'scanned_by_user_id' })
  scanned_by: User;

  @CreateDateColumn()
  scanned_at: Date;

  @Column({ type: 'enum', enum: ScanResult })
  result: ScanResult;

  @Column({ nullable: true, length: 255 })
  device_info: string;
}
