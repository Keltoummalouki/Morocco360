import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, EntityManager, QueryRunner, Repository } from 'typeorm';
import { ScannerService } from './scanner.service';
import { QRCodeService } from '../tickets/qr-code.service';
import { Ticket, TicketStatus } from '../orders/entities/ticket.entity';
import { QRScanLog, ScanResult } from './entities/qr-scan-log.entity';
import { EventStaff } from '../events/entities/event-staff.entity';
import { ScanTicketDto } from './dto/scan-ticket.dto';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeTicket(overrides: Partial<Ticket> = {}): Ticket {
  const event = {
    id: 42,
    title: 'Test Event',
    date_end: new Date(Date.now() + 86_400_000),
  } as Ticket['event'];

  return {
    id: 1,
    qr_code: 'valid-qr',
    status: TicketStatus.VALID,
    pdf_url: null,
    seat_number: null,
    scanned_at: null,
    checked_at: null,
    checked_by_user_id: null,
    checked_by: null,
    event_id: 42,
    event,
    order: {
      user: { id: 99, full_name: 'Test User', email: 'user@test.com' },
    } as Ticket['order'],
    category: { id: 1, name: 'VIP', event } as Ticket['category'],
    ...overrides,
  } as unknown as Ticket;
}

function makeQueryRunner(ticket: Ticket | null): QueryRunner {
  return {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      findOne: jest.fn().mockResolvedValue(ticket),
      update: jest.fn().mockResolvedValue(undefined),
    } as unknown as EntityManager,
  } as unknown as QueryRunner;
}

const SCANNER = { id: 10, email: 'staff@test.com', role: 'STAFF' };
const DTO: ScanTicketDto = { qrCode: 'some-qr', eventId: '42' };

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('ScannerService.scanTicket', () => {
  let service: ScannerService;
  let qrCode: jest.Mocked<QRCodeService>;
  let dataSource: jest.Mocked<Pick<DataSource, 'createQueryRunner'>>;
  let scanLogRepo: jest.Mocked<Pick<Repository<QRScanLog>, 'create' | 'save'>>;

  beforeEach(async () => {
    qrCode = {
      verifyQRPayload: jest.fn(),
      generateQRPayload: jest.fn(),
      generateQRImage: jest.fn(),
    } as unknown as jest.Mocked<QRCodeService>;
    scanLogRepo = {
      create: jest.fn().mockReturnValue({}),
      save: jest.fn().mockResolvedValue({}),
    } as unknown as typeof scanLogRepo;
    dataSource = {
      createQueryRunner: jest.fn(),
    } as unknown as typeof dataSource;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScannerService,
        { provide: QRCodeService, useValue: qrCode },
        { provide: getRepositoryToken(QRScanLog), useValue: scanLogRepo },
        { provide: getRepositoryToken(EventStaff), useValue: {} },
        { provide: getDataSourceToken(), useValue: dataSource },
      ],
    }).compile();

    service = module.get(ScannerService);
  });

  it('1. SUCCESS — valid HMAC + VALID ticket', async () => {
    qrCode.verifyQRPayload.mockReturnValue({ ticketId: '1', eventId: '42' });
    const qr = makeQueryRunner(makeTicket());
    (dataSource.createQueryRunner as jest.Mock).mockReturnValue(qr);

    const res = await service.scanTicket(DTO, SCANNER);

    expect(res.result).toBe(ScanResult.SUCCESS);
    expect(res.holderName).toBe('Test User');
    expect(res.category).toBe('VIP');
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(qr.commitTransaction).toHaveBeenCalledTimes(1);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(qr.rollbackTransaction).not.toHaveBeenCalled();
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(qr.release).toHaveBeenCalledTimes(1);
  });

  it('2. INVALID — bad HMAC (no DB call)', async () => {
    qrCode.verifyQRPayload.mockReturnValue(null);

    const res = await service.scanTicket(DTO, SCANNER);

    expect(res.result).toBe(ScanResult.INVALID);

    expect(dataSource.createQueryRunner).not.toHaveBeenCalled();
  });

  it('3. WRONG_EVENT — payload eventId differs from request', async () => {
    qrCode.verifyQRPayload.mockReturnValue({ ticketId: '1', eventId: '99' });

    const res = await service.scanTicket(DTO, SCANNER);

    expect(res.result).toBe(ScanResult.WRONG_EVENT);

    expect(dataSource.createQueryRunner).not.toHaveBeenCalled();
  });

  it('4. ALREADY_USED — ticket status CHECKED', async () => {
    qrCode.verifyQRPayload.mockReturnValue({ ticketId: '1', eventId: '42' });
    const qr = makeQueryRunner(
      makeTicket({
        status: TicketStatus.CHECKED,
        checked_at: new Date('2026-03-01T10:00:00Z'),
      }),
    );
    (dataSource.createQueryRunner as jest.Mock).mockReturnValue(qr);

    const res = await service.scanTicket(DTO, SCANNER);

    expect(res.result).toBe(ScanResult.ALREADY_USED);
    expect(res.checkedAt).toEqual(new Date('2026-03-01T10:00:00Z'));
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(qr.rollbackTransaction).toHaveBeenCalledTimes(1);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(qr.commitTransaction).not.toHaveBeenCalled();
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(qr.release).toHaveBeenCalledTimes(1);
  });

  it('5. INVALID — ticket status CANCELLED', async () => {
    qrCode.verifyQRPayload.mockReturnValue({ ticketId: '1', eventId: '42' });
    const qr = makeQueryRunner(makeTicket({ status: TicketStatus.CANCELLED }));
    (dataSource.createQueryRunner as jest.Mock).mockReturnValue(qr);

    const res = await service.scanTicket(DTO, SCANNER);

    expect(res.result).toBe(ScanResult.INVALID);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(qr.rollbackTransaction).toHaveBeenCalledTimes(1);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(qr.release).toHaveBeenCalledTimes(1);
  });

  it('6. INVALID — ticket status PENDING', async () => {
    qrCode.verifyQRPayload.mockReturnValue({ ticketId: '1', eventId: '42' });
    const qr = makeQueryRunner(makeTicket({ status: TicketStatus.PENDING }));
    (dataSource.createQueryRunner as jest.Mock).mockReturnValue(qr);

    expect((await service.scanTicket(DTO, SCANNER)).result).toBe(
      ScanResult.INVALID,
    );
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(qr.release).toHaveBeenCalledTimes(1);
  });

  it('7. EXPIRED — event ended in the past', async () => {
    qrCode.verifyQRPayload.mockReturnValue({ ticketId: '1', eventId: '42' });
    const expiredEvent = {
      id: 42,
      title: 'Old',
      date_end: new Date('2020-01-01'),
    } as Ticket['event'];
    const ticket = makeTicket({
      event: expiredEvent,
      category: {
        id: 1,
        name: 'VIP',
        event: expiredEvent,
      } as Ticket['category'],
    });
    const qr = makeQueryRunner(ticket);
    (dataSource.createQueryRunner as jest.Mock).mockReturnValue(qr);

    expect((await service.scanTicket(DTO, SCANNER)).result).toBe(
      ScanResult.EXPIRED,
    );
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(qr.rollbackTransaction).toHaveBeenCalledTimes(1);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(qr.release).toHaveBeenCalledTimes(1);
  });

  it('8. Concurrent scans — only one SUCCESS', async () => {
    qrCode.verifyQRPayload.mockReturnValue({ ticketId: '1', eventId: '42' });
    const qr1 = makeQueryRunner(makeTicket({ status: TicketStatus.VALID }));
    const qr2 = makeQueryRunner(
      makeTicket({ status: TicketStatus.CHECKED, checked_at: new Date() }),
    );
    let call = 0;
    (dataSource.createQueryRunner as jest.Mock).mockImplementation(() =>
      call++ === 0 ? qr1 : qr2,
    );

    const [r1, r2] = await Promise.all([
      service.scanTicket(DTO, SCANNER),
      service.scanTicket(DTO, SCANNER),
    ]);

    const results = [r1.result, r2.result].sort();
    expect(results).toEqual(
      [ScanResult.ALREADY_USED, ScanResult.SUCCESS].sort(),
    );
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(qr1.release).toHaveBeenCalledTimes(1);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(qr2.release).toHaveBeenCalledTimes(1);
  });
});
