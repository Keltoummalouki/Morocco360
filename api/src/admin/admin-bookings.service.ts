import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Order, OrderStatus } from '../orders/entities/order.entity';
import { Ticket, TicketStatus } from '../orders/entities/ticket.entity';
import { paginate, PaginatedResult } from '../common/pagination';
import { AdminBookingsQueryDto } from './dto/admin-booking.dto';

const SORTABLE = {
  createdAt: 'o.created_at',
  amount: 'o.total_amount',
  status: 'o.status',
};

@Injectable()
export class AdminBookingsService {
  constructor(
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
    @InjectRepository(Ticket) private readonly ticketRepo: Repository<Ticket>,
  ) {}

  async list(query: AdminBookingsQueryDto): Promise<PaginatedResult<unknown>> {
    const qb = this.orderRepo
      .createQueryBuilder('o')
      .leftJoinAndSelect('o.user', 'u')
      .leftJoinAndSelect('o.payment', 'p')
      .loadRelationCountAndMap('o.ticketCount', 'o.tickets');

    if (query.status)
      qb.andWhere('o.status = :status', { status: query.status });
    if (query.userId) qb.andWhere('u.id = :userId', { userId: query.userId });
    if (query.eventId) {
      qb.andWhere(
        'EXISTS (SELECT 1 FROM tickets tk WHERE tk."orderId" = o.id AND tk.event_id = :eventId)',
        { eventId: query.eventId },
      );
    }
    if (query.dateFrom) {
      qb.andWhere('o.created_at >= :df', { df: new Date(query.dateFrom) });
    }
    if (query.dateTo) {
      qb.andWhere('o.created_at <= :dt', { dt: new Date(query.dateTo) });
    }
    if (query.search?.trim()) {
      qb.andWhere(
        `(CAST(o.id AS TEXT) ILIKE :s OR u.full_name ILIKE :s OR u.email ILIKE :s
          OR u.username ILIKE :s OR p.transaction_id ILIKE :s OR o.payment_gateway_ref ILIKE :s)`,
        { s: `%${query.search.trim()}%` },
      );
    }

    const result = await paginate(qb, query, {
      sortable: SORTABLE,
      defaultSort: 'o.created_at',
    });
    return {
      data: result.data.map((o) => this.toSummary(o as OrderWithCount)),
      meta: result.meta,
    };
  }

  async findOne(id: number): Promise<unknown> {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: [
        'user',
        'payment',
        'tickets',
        'tickets.category',
        'tickets.event',
      ],
    });
    if (!order) throw new NotFoundException('Booking not found');
    return {
      id: order.id,
      status: order.status,
      total_amount: order.total_amount,
      payment_gateway_ref: order.payment_gateway_ref,
      created_at: order.created_at,
      user: order.user
        ? {
            id: order.user.id,
            username: order.user.username,
            email: order.user.email,
            full_name: order.user.full_name,
          }
        : null,
      payment: order.payment
        ? {
            id: order.payment.id,
            status: order.payment.status,
            gateway: order.payment.gateway,
            amount: order.payment.amount,
          }
        : null,
      tickets: (order.tickets ?? []).map((t) => this.ticketDto(t)),
    };
  }

  async setStatus(id: number, status: OrderStatus): Promise<unknown> {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: ['tickets'],
    });
    if (!order) throw new NotFoundException('Booking not found');
    order.status = status;
    await this.orderRepo.save(order);
    await this.cascadeToTickets(id, status);
    return this.findOne(id);
  }

  async getTickets(id: number): Promise<unknown[]> {
    const order = await this.orderRepo.findOne({ where: { id } });
    if (!order) throw new NotFoundException('Booking not found');
    const tickets = await this.ticketRepo.find({
      where: { order: { id } },
      relations: ['category', 'event'],
      order: { id: 'ASC' },
    });
    return tickets.map((t) => this.ticketDto(t));
  }

  async setTicketStatus(
    ticketId: number,
    status: TicketStatus,
  ): Promise<unknown> {
    const ticket = await this.ticketRepo.findOne({
      where: { id: ticketId },
      relations: ['category', 'event'],
    });
    if (!ticket) throw new NotFoundException('Ticket not found');
    ticket.status = status;
    await this.ticketRepo.save(ticket);
    return this.ticketDto(ticket);
  }

  // ── Helpers ────────────────────────────────────────────────
  /** Reflect a booking-level status change onto its still-active tickets. */
  private async cascadeToTickets(
    orderId: number,
    status: OrderStatus,
  ): Promise<void> {
    const map: Partial<
      Record<OrderStatus, { from: TicketStatus[]; to: TicketStatus }>
    > = {
      [OrderStatus.SUSPENDED]: {
        from: [TicketStatus.VALID],
        to: TicketStatus.SUSPENDED,
      },
      [OrderStatus.CANCELLED]: {
        from: [TicketStatus.VALID, TicketStatus.SUSPENDED],
        to: TicketStatus.CANCELLED,
      },
      [OrderStatus.REFUNDED]: {
        from: [
          TicketStatus.VALID,
          TicketStatus.CHECKED,
          TicketStatus.SUSPENDED,
        ],
        to: TicketStatus.REFUNDED,
      },
      [OrderStatus.PAID]: {
        from: [TicketStatus.SUSPENDED],
        to: TicketStatus.VALID,
      },
    };
    const rule = map[status];
    if (!rule) return;
    await this.ticketRepo.update(
      { order: { id: orderId }, status: In(rule.from) },
      { status: rule.to },
    );
  }

  private toSummary(o: OrderWithCount) {
    return {
      id: o.id,
      status: o.status,
      total_amount: o.total_amount,
      payment_gateway_ref: o.payment_gateway_ref,
      created_at: o.created_at,
      ticketCount: o.ticketCount ?? 0,
      user: o.user
        ? {
            id: o.user.id,
            username: o.user.username,
            email: o.user.email,
            full_name: o.user.full_name,
          }
        : null,
      payment_status: o.payment?.status ?? null,
    };
  }

  private ticketDto(t: Ticket) {
    return {
      id: t.id,
      status: t.status,
      seat_number: t.seat_number,
      category: t.category?.name ?? null,
      event: t.event ? { id: t.event.id, title: t.event.title } : null,
    };
  }
}

interface OrderWithCount extends Order {
  ticketCount?: number;
}
