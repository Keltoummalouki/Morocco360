import {
  jsonInit,
  readJson,
  toQuery,
  type Paginated,
} from './http';

export type PeopleResource = 'users' | 'organizers' | 'staff';
export type UserStatus = 'ACTIVE' | 'SUSPENDED';
export type Role = 'ADMIN' | 'ORGANIZER' | 'STAFF' | 'USER';

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  phone_number: string | null;
  date_of_birth: string | null;
  status: UserStatus;
  role: Role | null;
  created_at: string;
}

export interface UserOrder {
  id: number;
  total_amount: number | string;
  status: string;
  created_at: string;
  payment_status: string | null;
}

export interface RelatedEvent {
  id: number;
  title: string;
  date_start: string;
  city: string | null;
  status: string;
  source?: string;
  staffRole?: string;
}

export interface PeopleListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: UserStatus | '';
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface CreatePersonPayload {
  username: string;
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  phone_number?: string;
  date_of_birth?: string;
}

export type UpdatePersonPayload = Partial<Omit<CreatePersonPayload, 'password'>>;

const base = (resource: PeopleResource) => `/api/admin/${resource}`;

export function listPeople(
  resource: PeopleResource,
  params: PeopleListParams,
): Promise<Paginated<AdminUser>> {
  return fetch(`${base(resource)}${toQuery(params)}`).then(
    readJson<Paginated<AdminUser>>,
  );
}

export function getPerson(
  resource: PeopleResource,
  id: number,
): Promise<AdminUser> {
  return fetch(`${base(resource)}/${id}`).then(readJson<AdminUser>);
}

export function createPerson(
  resource: PeopleResource,
  body: CreatePersonPayload,
): Promise<AdminUser> {
  return fetch(base(resource), jsonInit('POST', body)).then(readJson<AdminUser>);
}

export function updatePerson(
  resource: PeopleResource,
  id: number,
  body: UpdatePersonPayload,
): Promise<AdminUser> {
  return fetch(`${base(resource)}/${id}`, jsonInit('PATCH', body)).then(
    readJson<AdminUser>,
  );
}

export function setPersonStatus(
  resource: PeopleResource,
  id: number,
  status: UserStatus,
): Promise<AdminUser> {
  return fetch(
    `${base(resource)}/${id}/status`,
    jsonInit('PATCH', { status }),
  ).then(readJson<AdminUser>);
}

export function getUserOrders(
  id: number,
  params: { page?: number; limit?: number },
): Promise<Paginated<UserOrder>> {
  return fetch(`/api/admin/users/${id}/orders${toQuery(params)}`).then(
    readJson<Paginated<UserOrder>>,
  );
}

export function getOrganizerEvents(id: number): Promise<RelatedEvent[]> {
  return fetch(`/api/admin/organizers/${id}/events`).then(
    readJson<RelatedEvent[]>,
  );
}

export function getStaffEvents(id: number): Promise<RelatedEvent[]> {
  return fetch(`/api/admin/staff/${id}/events`).then(readJson<RelatedEvent[]>);
}
