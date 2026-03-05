import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../users/entities/user.entity';
import { Role } from '../../users/entities/role.entity';
import { Event } from '../../events/entities/event.entity';
import { TicketCategory } from '../../events/entities/ticket-category.entity';
import { Order } from '../../orders/entities/order.entity';
import { Ticket } from '../../orders/entities/ticket.entity';
import { Payment } from '../../payments/entities/payment.entity';
import { RoleSeeder } from './role.seeder';
import { UserSeeder } from './user.seeder';
import { SeederService } from './seeder.service';

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
        entities: [User, Role, Event, TicketCategory, Order, Ticket, Payment],
        synchronize: false,
      }),
    }),
    TypeOrmModule.forFeature([User, Role]),
  ],
  providers: [RoleSeeder, UserSeeder, SeederService],
})
export class SeederModule {}
