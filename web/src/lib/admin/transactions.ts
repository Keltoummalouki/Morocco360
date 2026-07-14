import {
  jsonInit,
  readJson,
  toQuery,
  type Paginated,
} from './http';

// ── Bookings ───────────────────────────────────────────────
export type OrderStatus =
  | 'PENDING'
  | 'PAID'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'SUSPENDED';
export type TicketStatus =
  | 'PENDING'
  | 'VALID'
  | 'CHECKED'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'SUSPENDED';

export interface BookingSummary {
  id: number;
  status: OrderStatus;
  total_amount: number | string;
  payment_gateway_ref: string | null;
  created_at: string;
  ticketCount: number;
  user: { id: number; username: string; email: string; full_name: string | null } | null;
  payment_status: string | null;
}

export interface BookingTicket {
  id: number;
  status: TicketStatus;
  seat_number: string | null;
  category: string | null;
  event: { id: number; title: string } | null;
}

export interface BookingDetail {
  id: number;
  status: OrderStatus;
  total_amount: number | string;
  payment_gateway_ref: string | null;
  created_at: string;
  user: { id: number; username: string; email: string; full_name: string | null } | null;
  payment: { id: number; status: string; gateway: string; amount: number | string } | null;
  tickets: BookingTicket[];
}

export interface BookingListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: OrderStatus | '';
  eventId?: number;
  userId?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export function listBookings(p: BookingListParams): Promise<Paginated<BookingSummary>> {
  return fetch(`/api/admin/bookings${toQuery(p)}`).then(readJson<Paginated<BookingSummary>>);
}
export function getBooking(id: number): Promise<BookingDetail> {
  return fetch(`/api/admin/bookings/${id}`).then(readJson<BookingDetail>);
}
export function setBookingStatus(id: number, status: OrderStatus): Promise<BookingDetail> {
  return fetch(`/api/admin/bookings/${id}/status`, jsonInit('PATCH', { status })).then(
    readJson<BookingDetail>,
  );
}
export function setTicketStatus(id: number, status: TicketStatus): Promise<BookingTicket> {
  return fetch(`/api/admin/tickets/${id}/status`, jsonInit('PATCH', { status })).then(
    readJson<BookingTicket>,
  );
}

// ── Payments ───────────────────────────────────────────────
export type PaymentStatus =
  | 'PENDING'
  | 'SUCCESS'
  | 'PAID'
  | 'NOT_PAID'
  | 'FAILED'
  | 'REFUNDED';
export type PaymentGateway = 'STRIPE' | 'PAYPAL' | 'BANK_CARD';

export interface PaymentSummary {
  id: number;
  status: PaymentStatus;
  gateway: PaymentGateway;
  amount: number | string;
  currency: string;
  transaction_id: string | null;
  invoice_number: string | null;
  created_at: string;
  order_id: number | null;
  customer: { id: number; full_name: string | null; email: string } | null;
}

export interface InvoiceLine {
  description: string;
  unitPrice: number;
  quantity: number;
  total: number;
}
export interface Invoice {
  invoiceNumber: string;
  issuedAt: string;
  status: PaymentStatus;
  gateway: string;
  currency: string;
  customer: { name: string; email: string };
  event: { title: string; date: string | null } | null;
  lines: InvoiceLine[];
  subtotal: number;
  total: number;
}

export interface PaymentListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: PaymentStatus | '';
  gateway?: PaymentGateway | '';
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export function listPayments(p: PaymentListParams): Promise<Paginated<PaymentSummary>> {
  return fetch(`/api/admin/payments${toQuery(p)}`).then(readJson<Paginated<PaymentSummary>>);
}
export function setPaymentStatus(id: number, status: PaymentStatus): Promise<PaymentSummary> {
  return fetch(`/api/admin/payments/${id}/status`, jsonInit('PATCH', { status })).then(
    readJson<PaymentSummary>,
  );
}
export function getInvoice(id: number): Promise<Invoice> {
  return fetch(`/api/admin/payments/${id}/invoice`).then(readJson<Invoice>);
}
export function invoicePdfUrl(id: number): string {
  return `/api/admin/payments/${id}/invoice-pdf`;
}

// ── Reviews ────────────────────────────────────────────────
export type ReviewStatus = 'PENDING' | 'APPROVED' | 'UNAPPROVED';

export interface AdminReview {
  id: number;
  rating: number;
  comment: string | null;
  status: ReviewStatus;
  created_at: string;
  event: { id: number; title: string } | null;
  user: { id: number; username: string; email: string; full_name: string | null } | null;
}

export interface ReviewListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: ReviewStatus | '';
  rating?: number;
  eventId?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export function listReviews(p: ReviewListParams): Promise<Paginated<AdminReview>> {
  return fetch(`/api/admin/reviews${toQuery(p)}`).then(readJson<Paginated<AdminReview>>);
}
export function setReviewStatus(id: number, status: ReviewStatus): Promise<AdminReview> {
  return fetch(`/api/admin/reviews/${id}/status`, jsonInit('PATCH', { status })).then(
    readJson<AdminReview>,
  );
}
