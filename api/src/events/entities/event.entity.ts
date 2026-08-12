import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { TicketCategory } from './ticket-category.entity';
import { City } from '../../settings/entities/city.entity';
import { EventCategory as EventCategoryEntity } from '../../settings/entities/event-category.entity';

export enum EventCategory {
  MUSIQUE = 'Musique',
  SPORT = 'Sport',
  CULTURE = 'Culture',
  CINEMA = 'Cinema',
  HUMOUR = 'Humour',
  ART = 'Art',
  AUTRE = 'Autre',
}

/**
 * Admin lifecycle status. Coexists with the legacy `is_active` / `is_sold_out`
 * booleans (the public site still filters on those); the admin services keep
 * the two in sync.
 */
export enum EventStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  DRAFT = 'DRAFT',
  SOLD_OUT = 'SOLD_OUT',
  CANCELLED = 'CANCELLED',
}

@Entity('events')
export class Event {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column()
  date_start: Date;

  @Column()
  date_end: Date;

  @Column({ length: 255 })
  location_name: string;

  @Column({ length: 100, nullable: true })
  city: string;

  @Column({ type: 'enum', enum: EventCategory, default: EventCategory.AUTRE })
  category: EventCategory;

  /** Normalized city (admin backoffice); country is derived via city.country. */
  @ManyToOne(() => City, { nullable: true, onDelete: 'SET NULL' })
  cityEntity: City;

  /** Normalized taxonomy (admin backoffice); coexists with the legacy enum. */
  @ManyToOne(() => EventCategoryEntity, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  categoryEntity: EventCategoryEntity;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number;

  @Column({ nullable: true })
  image_url: string;

  @Column({ default: 0 })
  total_stock: number;

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: false })
  is_sold_out: boolean;

  @Column({ type: 'enum', enum: EventStatus, default: EventStatus.ACTIVE })
  status: EventStatus;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => User, (user) => user.events, { nullable: true })
  organizer: User;

  @ManyToMany(() => User, (user) => user.savedEvents)
  savedByUsers: User[];

  @OneToMany(() => TicketCategory, (category) => category.event, {
    cascade: true,
    orphanedRowAction: 'delete',
  })
  categories: TicketCategory[];
}
