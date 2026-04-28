import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScannerService } from './scanner.service';
import { ScannerController } from './scanner.controller';
import { QRScanLog } from './entities/qr-scan-log.entity';
import { EventStaff } from '../events/entities/event-staff.entity';
import { Ticket } from '../orders/entities/ticket.entity';
import { TicketsModule } from '../tickets/tickets.module';
import { EventAccessGuard } from './guards/event-access.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([QRScanLog, EventStaff, Ticket]),
    TicketsModule,
  ],
  providers: [ScannerService, EventAccessGuard],
  controllers: [ScannerController],
})
export class ScannerModule {}
