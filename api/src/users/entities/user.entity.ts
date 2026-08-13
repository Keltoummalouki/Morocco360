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

  /**
   * Null for accounts created through a social provider (Google / Facebook).
   * The type is explicit: TypeORM cannot infer a column type from a
   * `string | null` union, which reflects as `Object`.
   */
  @Exclude()
  @Column({ type: 'varchar', nullable: true })
  password: string | null;

  @Column({ length: 100, nullable: true })
  first_name: string;

  @Column({ length: 100, nullable: true })
  last_name: string;

  @Column({ length: 150, nullable: true })
  full_name: string;

  @Column({ type: 'date', nullable: true })
  date_of_birth: string | null;

  @Column({ length: 20, nullable: true })
  phone_number: string;

  @Exclude()
  @Column({ type: 'text', nullable: true })
  refresh_token_hash: string | null;

  // ── Social identities ────────────────────────────────────
  // One column per provider so a single account can be linked to both.
  // Nullable + unique: PostgreSQL allows many NULLs in a unique index.

  @Column({ type: 'varchar', length: 64, unique: true, nullable: true })
  google_id: string | null;

  @Column({ type: 'varchar', length: 64, unique: true, nullable: true })
  facebook_id: string | null;

  @Column({ type: 'text', nullable: true })
  avatar_url: string | null;

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
