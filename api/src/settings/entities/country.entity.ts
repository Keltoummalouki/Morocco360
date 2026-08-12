import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SettingStatus } from '../../common/enums/status.enum';
import { City } from './city.entity';
import { Language } from './language.entity';

@Entity('countries')
export class Country {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 120 })
  name: string;

  @Column({ length: 3, nullable: true })
  iso_code: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number;

  @Column({ type: 'enum', enum: SettingStatus, default: SettingStatus.ACTIVE })
  status: SettingStatus;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => City, (city) => city.country)
  cities: City[];

  @ManyToMany(() => Language, (language) => language.countries)
  @JoinTable({ name: 'country_languages' })
  languages: Language[];
}
