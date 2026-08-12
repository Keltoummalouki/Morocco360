import {
  jsonInit,
  readJson,
  expectOk,
  toQuery,
  type Paginated,
} from './http';

export type EventStatus =
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'DRAFT'
  | 'SOLD_OUT'
  | 'CANCELLED';

export interface AdminEventOrganizer {
  id: number;
  username: string;
  email: string;
  full_name: string | null;
}

export interface AdminEventCity {
  id: number;
  name: string;
  country?: { id: number; name: string } | null;
}

export interface AdminTicketCategory {
  id: number;
  name: string;
  description: string | null;
  price: number | string;
  stock_allocated: number;
  stock_remaining: number;
  status: 'ACTIVE' | 'SUSPENDED';
}

export interface AdminEvent {
  id: number;
  title: string;
  description: string;
  date_start: string;
  date_end: string;
  location_name: string;
  city: string | null;
  category: string | null;
  image_url: string | null;
  latitude: number | null;
  longitude: number | null;
  total_stock: number;
  is_active: boolean;
  is_sold_out: boolean;
  status: EventStatus;
  created_at: string;
  organizer?: AdminEventOrganizer | null;
  cityEntity?: AdminEventCity | null;
  categoryEntity?: { id: number; name: string } | null;
  categories?: AdminTicketCategory[];
}

export interface AdminEventStaff {
  id: string;
  staffRole: 'ORGANIZER' | 'STAFF';
  assignedAt: string;
  user: {
    id: number;
    username: string;
    email: string;
    full_name: string | null;
    role: string | null;
  };
}

export interface AdminBooking {
  id: number;
  total_amount: number | string;
  status: string;
  created_at: string;
  user?: { id: number; username: string; email: string; full_name: string | null } | null;
  payment?: { id: number; status: string } | null;
}

export interface UserSearchResult {
  id: number;
  username: string;
  email: string;
  full_name: string | null;
}

export interface AdminEventsListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: EventStatus | '';
  cityId?: number;
  countryId?: number;
  categoryId?: number;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface EventPayload {
  title: string;
  description: string;
  date_start: string;
  date_end: string;
  location_name: string;
  cityId?: number;
  categoryId?: number;
  organizerId?: number;
  latitude?: number;
  longitude?: number;
  image_url?: string;
  total_stock?: number;
  status?: EventStatus;
}

export interface TicketCategoryPayload {
  name: string;
  description?: string;
  price: number;
  stock_allocated: number;
  status?: 'ACTIVE' | 'SUSPENDED';
}

const BASE = '/api/admin/events';

export function listAdminEvents(
  p: AdminEventsListParams,
): Promise<Paginated<AdminEvent>> {
  return fetch(`${BASE}${toQuery(p)}`).then(readJson<Paginated<AdminEvent>>);
}
export function getAdminEvent(id: number): Promise<AdminEvent> {
  return fetch(`${BASE}/${id}`).then(readJson<AdminEvent>);
}
export function createAdminEvent(body: EventPayload): Promise<AdminEvent> {
  return fetch(BASE, jsonInit('POST', body)).then(readJson<AdminEvent>);
}
export function updateAdminEvent(
  id: number,
  body: Partial<EventPayload>,
): Promise<AdminEvent> {
  return fetch(`${BASE}/${id}`, jsonInit('PATCH', body)).then(readJson<AdminEvent>);
}
export function setEventStatus(
  id: number,
  status: EventStatus,
): Promise<AdminEvent> {
  return fetch(`${BASE}/${id}/status`, jsonInit('PATCH', { status })).then(
    readJson<AdminEvent>,
  );
}
export function assignOrganizer(
  id: number,
  organizerId: number,
): Promise<AdminEvent> {
  return fetch(
    `${BASE}/${id}/organizer`,
    jsonInit('PATCH', { organizerId }),
  ).then(readJson<AdminEvent>);
}

export function listEventStaff(id: number): Promise<AdminEventStaff[]> {
  return fetch(`${BASE}/${id}/staff`).then(readJson<AdminEventStaff[]>);
}
export function addEventStaff(
  id: number,
  userId: number,
): Promise<AdminEventStaff[]> {
  return fetch(`${BASE}/${id}/staff`, jsonInit('POST', { userId })).then(
    readJson<AdminEventStaff[]>,
  );
}
export function removeEventStaff(id: number, userId: number): Promise<void> {
  return fetch(`${BASE}/${id}/staff/${userId}`, { method: 'DELETE' }).then(
    expectOk,
  );
}

export function addTicketCategory(
  id: number,
  body: TicketCategoryPayload,
): Promise<AdminTicketCategory> {
  return fetch(
    `${BASE}/${id}/ticket-categories`,
    jsonInit('POST', body),
  ).then(readJson<AdminTicketCategory>);
}
export function updateTicketCategory(
  id: number,
  categoryId: number,
  body: TicketCategoryPayload,
): Promise<AdminTicketCategory> {
  return fetch(
    `${BASE}/${id}/ticket-categories/${categoryId}`,
    jsonInit('PATCH', body),
  ).then(readJson<AdminTicketCategory>);
}
export function deleteTicketCategory(
  id: number,
  categoryId: number,
): Promise<void> {
  return fetch(`${BASE}/${id}/ticket-categories/${categoryId}`, {
    method: 'DELETE',
  }).then(expectOk);
}

export function listEventBookings(
  id: number,
  p: { page?: number; limit?: number; search?: string },
): Promise<Paginated<AdminBooking>> {
  return fetch(`${BASE}/${id}/bookings${toQuery(p)}`).then(
    readJson<Paginated<AdminBooking>>,
  );
}

export function searchUsers(
  role: string,
  search?: string,
): Promise<UserSearchResult[]> {
  return fetch(`/api/admin/users/search${toQuery({ role, search })}`).then(
    readJson<UserSearchResult[]>,
  );
}

export function attendeesCsvUrl(id: number): string {
  return `${BASE}/${id}/attendees/export?format=csv`;
}
