/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminPaymentsService } from './admin-payments.service';
import {
  Payment,
  PaymentStatus,
} from '../payments/entities/payment.entity';
import { Order, OrderStatus } from '../orders/entities/order.entity';

describe('AdminPaymentsService', () => {
  let service: AdminPaymentsService;
  let paymentRepo: jest.Mocked<Repository<Payment>>;
  let orderRepo: jest.Mocked<Repository<Order>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminPaymentsService,
        {
          provide: getRepositoryToken(Payment),
          useValue: {
            createQueryBuilder: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn((v) => Promise.resolve(v)),
          },
        },
        {
          provide: getRepositoryToken(Order),
          useValue: { save: jest.fn((v) => Promise.resolve(v)) },
        },
      ],
    }).compile();

    service = module.get(AdminPaymentsService);
    paymentRepo = module.get(getRepositoryToken(Payment));
    orderRepo = module.get(getRepositoryToken(Order));
  });

  describe('setStatus', () => {
    it('marks the order PAID when the payment is set to PAID', async () => {
      const order = { id: 1, status: OrderStatus.PENDING } as Order;
      paymentRepo.findOne.mockResolvedValueOnce({
        id: 7,
        status: PaymentStatus.PENDING,
        order,
      } as Payment);
      // second findOne (via findOne detail)
      paymentRepo.findOne.mockResolvedValueOnce({ id: 7, order } as Payment);

      await service.setStatus(7, PaymentStatus.PAID);

      expect(orderRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: OrderStatus.PAID }),
      );
    });
  });

  describe('getInvoice', () => {
    it('groups tickets into invoice lines by category', async () => {
      paymentRepo.findOne.mockResolvedValue({
        id: 9,
        amount: 400,
        currency: 'MAD',
        status: PaymentStatus.SUCCESS,
        gateway: 'STRIPE',
        created_at: new Date('2026-01-01'),
        invoice_number: null,
        order: {
          id: 3,
          user: { full_name: 'Ali', email: 'ali@x.ma', username: 'ali' },
          tickets: [
            { category: { name: 'VIP', price: 150 }, event: { title: 'Jazz', date_start: new Date() } },
            { category: { name: 'VIP', price: 150 }, event: { title: 'Jazz' } },
            { category: { name: 'Standard', price: 100 }, event: { title: 'Jazz' } },
          ],
        },
      } as unknown as Payment);

      // getInvoice already returns InvoiceData — no assertion needed.
      const invoice = await service.getInvoice(9);

      expect(invoice.lines).toHaveLength(2);
      const vip = invoice.lines.find((l) => l.description === 'VIP');
      expect(vip?.quantity).toBe(2);
      expect(vip?.total).toBe(300);
      expect(invoice.invoiceNumber).toMatch(/^INV-2026-/);
      expect(invoice.total).toBe(400);
    });
  });
});
