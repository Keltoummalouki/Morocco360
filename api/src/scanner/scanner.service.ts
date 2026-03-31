import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { QRCodeService } from '../tickets/qr-code.service';
import { Ticket, TicketStatus } from '../orders/entities/ticket.entity';
import { QRScanLog, ScanResult } from './entities/qr-scan-log.entity';
import { EventStaff } from '../events/entities/event-staff.entity';
import { ScanTicketDto } from './dto/scan-ticket.dto';
import { ScanResultDto } from './dto/scan-result.dto';

interface ScannerUser {
  id: number;
  email: string;
  role: string;
}

@Injectable()
export class ScannerService {
  private readonly logger = new Logger(ScannerService.name);

  constructor(
    private readonly qrCodeService: QRCodeService,
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(QRScanLog)
    private readonly scanLogRepo: Repository<QRScanLog>,
    @InjectRepository(EventStaff)
    private readonly eventStaffRepo: Repository<EventStaff>,
  ) {}

  async scanTicket(
    dto: ScanTicketDto,
    scanner: ScannerUser,
  ): Promise<ScanResultDto> {
    // 1. Verify HMAC signature — no DB call on failure
    const payload = this.qrCodeService.verifyQRPayload(dto.qrCode);
    if (!payload) {
      await this.log(null, scanner.id, ScanResult.INVALID, dto.deviceInfo);
      return { result: ScanResult.INVALID, message: 'QR code invalide' };
    }

    const ticketId = parseInt(payload.ticketId, 10);
    const payloadEventId = parseInt(payload.eventId, 10);
    const requestedEventId = parseInt(dto.eventId, 10);

    // 2. Check event match before hitting DB
    if (payloadEventId !== requestedEventId) {
      await this.log(
        ticketId,
        scanner.id,
        ScanResult.WRONG_EVENT,
        dto.deviceInfo,
      );
      return {
        result: ScanResult.WRONG_EVENT,
        message: 'Billet pour un autre événement',
      };
    }

    // 3–9. Transaction with pessimistic write lock
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      // 4. Load with FOR UPDATE OF tickets to prevent concurrent double-scan.
      // Specifying tables: ['tickets'] avoids the PostgreSQL restriction that
      // FOR UPDATE cannot be applied to the nullable side of an outer join.
      const ticket = await qr.manager.findOne(Ticket, {
        where: { id: ticketId },
        relations: ['order', 'order.user', 'category', 'category.event'],
        lock: { mode: 'pessimistic_write', tables: ['tickets'] },
      });

      if (!ticket) {
        await qr.rollbackTransaction();
        await this.log(
          ticketId,
          scanner.id,
          ScanResult.INVALID,
          dto.deviceInfo,
        );
        return { result: ScanResult.INVALID, message: 'Billet introuvable' };
      }

      // 6. Status switch
      switch (ticket.status) {
        case TicketStatus.CHECKED:
          await qr.rollbackTransaction();
          await this.log(
            ticket.id,
            scanner.id,
            ScanResult.ALREADY_USED,
            dto.deviceInfo,
          );
          return {
            result: ScanResult.ALREADY_USED,
            message: 'Billet déjà utilisé',
            checkedAt: ticket.checked_at,
          };

        case TicketStatus.CANCELLED:
        case TicketStatus.REFUNDED:
        case TicketStatus.PENDING:
          await qr.rollbackTransaction();
          await this.log(
            ticket.id,
            scanner.id,
            ScanResult.INVALID,
            dto.deviceInfo,
          );
          return {
            result: ScanResult.INVALID,
            message: `Billet ${ticket.status.toLowerCase()}`,
          };

        case TicketStatus.VALID:
          break;
      }

      // 7. Check event expiry
      const event = ticket.category?.event;
      if (event && event.date_end < new Date()) {
        await qr.rollbackTransaction();
        await this.log(
          ticket.id,
          scanner.id,
          ScanResult.EXPIRED,
          dto.deviceInfo,
        );
        return {
          result: ScanResult.EXPIRED,
          message: "L'événement est terminé",
        };
      }

      // 8. Mark as checked
      await qr.manager.update(Ticket, ticket.id, {
        status: TicketStatus.CHECKED,
        checked_at: new Date(),
        checked_by_user_id: scanner.id,
      });

      // 9. Commit
      await qr.commitTransaction();

      // 10. Async audit log (fire-and-forget, never throws)
      await this.log(ticket.id, scanner.id, ScanResult.SUCCESS, dto.deviceInfo);

      this.logger.log(`SCAN SUCCESS ticket=${ticket.id} by user=${scanner.id}`);

      // 11. Return enriched result
      return {
        result: ScanResult.SUCCESS,
        holderName: ticket.order?.user?.full_name ?? ticket.order?.user?.email,
        category: ticket.category?.name,
        eventName: event?.title,
        seat: ticket.seat_number ?? null,
      };
    } catch (err) {
      await qr.rollbackTransaction();
      this.logger.error(`Scan failed ticket=${ticketId}`, err);
      throw err;
    } finally {
      await qr.release();
    }
  }

  async getAssignedEvents(userId: number): Promise<unknown[]> {
    const assignments = await this.eventStaffRepo.find({
      where: { user_id: userId },
      relations: ['event'],
    });

    return assignments.map((a) => ({
      id: a.event.id,
      title: a.event.title,
      date_start: a.event.date_start,
      date_end: a.event.date_end,
      city: a.event.city,
      location_name: a.event.location_name,
    }));
  }

  private async log(
    ticketId: number | null,
    scannedByUserId: number,
    result: ScanResult,
    deviceInfo?: string,
  ): Promise<void> {
    if (ticketId === null) return;
    try {
      await this.scanLogRepo.save(
        this.scanLogRepo.create({
          ticket_id: ticketId,
          scanned_by_user_id: scannedByUserId,
          result,
          device_info: deviceInfo,
        }),
      );
    } catch (err) {
      // Audit logging must never crash the scan flow
      this.logger.warn(`Failed to write scan log: ${String(err)}`);
    }
  }
}
