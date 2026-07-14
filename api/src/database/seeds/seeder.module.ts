import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../users/entities/user.entity';
import { Role } from '../../users/entities/role.entity';
import { Event } from '../../events/entities/event.entity';
import { TicketCategory } from '../../events/entities/ticket-category.entity';
import { EventStaff } from '../../events/entities/event-staff.entity';
import { Order } from '../../orders/entities/order.entity';
import { Ticket } from '../../orders/entities/ticket.entity';
import { Payment } from '../../payments/entities/payment.entity';
import { QRScanLog } from '../../scanner/entities/qr-scan-log.entity';
import { Country } from '../../settings/entities/country.entity';
import { City } from '../../settings/entities/city.entity';
import { Language } from '../../settings/entities/language.entity';
import { EventCategory } from '../../settings/entities/event-category.entity';
import { EventReview } from '../../reviews/entities/event-review.entity';
import { RoleSeeder } from './role.seeder';
import { UserSeeder } from './user.seeder';
import { EventSeeder } from './event.seeder';
import { SettingsSeeder } from './settings.seeder';
import { SeederService } from './seeder.service';

const ALL_ENTITIES = [
  User,
  Role,
  Event,
  TicketCategory,
  EventStaff,
  Order,
  Ticket,
  Payment,
  QRScanLog,
  Country,
  City,
  Language,
  EventCategory,
  EventReview,
];

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get<string>('DB_USER', 'morocco360'),
        password: config.get<string>('DB_PASS', 'morocco360'),
        database: config.get<string>('DB_NAME', 'morocco360'),
        entities: ALL_ENTITIES,
        synchronize: true,
      }),
    }),
    TypeOrmModule.forFeature([
      User,
      Role,
      Event,
      TicketCategory,
      EventStaff,
      Order,
      Ticket,
      Country,
      City,
      Language,
      EventCategory,
      EventReview,
    ]),
  ],
  providers: [
    RoleSeeder,
    UserSeeder,
    EventSeeder,
    SettingsSeeder,
    SeederService,
  ],
})
export class SeederModule {}
