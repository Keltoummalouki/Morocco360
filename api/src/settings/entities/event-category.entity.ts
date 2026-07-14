import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SettingStatus } from '../../common/enums/status.enum';

/**
 * Admin-managed event taxonomy (music, sport, culture, …).
 *
 * NOTE: distinct from the legacy `EventCategory` *enum* in `event.entity.ts`,
 * which still backs the public site. Import this class with an alias
 * (`EventCategory as EventCategoryEntity`) wherever the enum is also in scope.
 */
@Entity('event_categories')
export class EventCategory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: SettingStatus, default: SettingStatus.ACTIVE })
  status: SettingStatus;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
