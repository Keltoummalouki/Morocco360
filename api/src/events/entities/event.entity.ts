import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { TicketCategory } from './ticket-category.entity';

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

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => User, (user) => user.events, { nullable: true })
  organizer: User;

  @OneToMany(() => TicketCategory, (category) => category.event, {
    cascade: true,
  })
  categories: TicketCategory[];
}
