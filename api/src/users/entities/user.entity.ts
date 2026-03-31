import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Role } from './role.entity';
import { Order } from '../../orders/entities/order.entity';
import { Event } from '../../events/entities/event.entity';

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  username: string;

  @Column({ unique: true, length: 150 })
  email: string;

  @Exclude()
  @Column()
  password: string;

  @Column({ length: 150, nullable: true })
  full_name: string;

  @Column({ length: 20, nullable: true })
  phone_number: string;

  @Exclude()
  @Column({ type: 'text', nullable: true })
  refresh_token_hash: string | null;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE })
  status: UserStatus;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Role, (role) => role.users, { eager: true, nullable: true })
  role: Role;

  @OneToMany(() => Order, (order) => order.user)
  orders: Order[];

  @OneToMany(() => Event, (event) => event.organizer)
  events: Event[];

  @ManyToMany(() => Event, (event) => event.savedByUsers, { cascade: false })
  @JoinTable({ name: 'user_saved_events' })
  savedEvents: Event[];
}
