import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SettingStatus } from '../../common/enums/status.enum';
import { Country } from './country.entity';

@Entity('languages')
export class Language {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 80 })
  name: string;

  @Column({ length: 10 })
  code: string;

  @Column({ type: 'enum', enum: SettingStatus, default: SettingStatus.ACTIVE })
  status: SettingStatus;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToMany(() => Country, (country) => country.languages)
  countries: Country[];
}
