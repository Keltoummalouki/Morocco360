import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
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

  @ManyToOne(() => Ticket, { onDelete: 'CASCADE', nullable: false })
  ticket: Ticket;

  @Index()
  @Column()
  scanned_by_user_id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  scanned_by: User;

  @CreateDateColumn()
  scanned_at: Date;

  @Column({ type: 'enum', enum: ScanResult })
  result: ScanResult;

  @Column({ nullable: true, length: 255 })
  device_info: string;
}
