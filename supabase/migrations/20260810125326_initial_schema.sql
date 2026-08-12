-- Morocco360 initial schema for Supabase Postgres.
--
-- The NestJS API connects as a trusted database client. Browser access through
-- the Supabase Data API is intentionally disabled: every table has RLS enabled
-- and anon/authenticated receive no table or sequence privileges.

create type public.roles_name_enum as enum (
  'ADMIN', 'ORGANIZER', 'USER', 'STAFF'
);
create type public.setting_status_enum as enum ('ACTIVE', 'SUSPENDED');
create type public.users_status_enum as enum ('ACTIVE', 'SUSPENDED');
create type public.events_category_enum as enum (
  'Musique', 'Sport', 'Culture', 'Cinema', 'Humour', 'Art', 'Autre'
);
create type public.events_status_enum as enum (
  'ACTIVE', 'SUSPENDED', 'DRAFT', 'SOLD_OUT', 'CANCELLED'
);
create type public.orders_status_enum as enum (
  'PENDING', 'PAID', 'CANCELLED', 'REFUNDED', 'SUSPENDED'
);
create type public.tickets_status_enum as enum (
  'PENDING', 'VALID', 'CHECKED', 'CANCELLED', 'REFUNDED', 'SUSPENDED'
);
create type public.payments_gateway_enum as enum (
  'STRIPE', 'PAYPAL', 'BANK_CARD'
);
create type public.payments_status_enum as enum (
  'PENDING', 'SUCCESS', 'PAID', 'NOT_PAID', 'FAILED', 'REFUNDED'
);
create type public.qr_scan_logs_result_enum as enum (
  'SUCCESS', 'ALREADY_USED', 'INVALID', 'WRONG_EVENT', 'EXPIRED'
);
create type public.event_reviews_status_enum as enum (
  'PENDING', 'APPROVED', 'UNAPPROVED'
);
create type public.event_staff_staff_role_enum as enum ('ORGANIZER', 'STAFF');

create table public.roles (
  id serial primary key,
  name public.roles_name_enum not null unique
);

create table public.languages (
  id serial primary key,
  name character varying(80) not null,
  code character varying(10) not null,
  status public.setting_status_enum not null default 'ACTIVE',
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now()
);

create table public.countries (
  id serial primary key,
  name character varying(120) not null,
  iso_code character varying(3),
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  status public.setting_status_enum not null default 'ACTIVE',
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now()
);

create table public.cities (
  id serial primary key,
  name character varying(120) not null,
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  status public.setting_status_enum not null default 'ACTIVE',
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now(),
  "countryId" integer references public.countries(id) on delete set null
);

create table public.event_categories (
  id serial primary key,
  name character varying(100) not null,
  description text,
  status public.setting_status_enum not null default 'ACTIVE',
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now()
);

create table public.users (
  id serial primary key,
  username character varying(100) not null,
  email character varying(150) not null unique,
  password character varying not null,
  first_name character varying(100),
  last_name character varying(100),
  full_name character varying(150),
  date_of_birth date,
  phone_number character varying(20),
  refresh_token_hash text,
  status public.users_status_enum not null default 'ACTIVE',
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now(),
  "roleId" integer references public.roles(id)
);

create table public.events (
  id serial primary key,
  title character varying(200) not null,
  description text not null,
  date_start timestamp without time zone not null,
  date_end timestamp without time zone not null,
  location_name character varying(255) not null,
  city character varying(100),
  category public.events_category_enum not null default 'Autre',
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  image_url character varying,
  total_stock integer not null default 0,
  is_active boolean not null default true,
  is_sold_out boolean not null default false,
  status public.events_status_enum not null default 'ACTIVE',
  created_at timestamp without time zone not null default now(),
  "cityEntityId" integer references public.cities(id) on delete set null,
  "categoryEntityId" integer references public.event_categories(id) on delete set null,
  "organizerId" integer references public.users(id)
);

create table public.ticket_categories (
  id serial primary key,
  name character varying(100) not null,
  description text,
  status public.setting_status_enum not null default 'ACTIVE',
  price numeric(10, 2) not null,
  stock_allocated integer not null default 0,
  stock_remaining integer not null default 0,
  "eventId" integer references public.events(id) on delete cascade,
  constraint ticket_categories_stock_nonnegative
    check (stock_allocated >= 0 and stock_remaining >= 0)
);

create table public.orders (
  id serial primary key,
  total_amount numeric(10, 2) not null default 0,
  status public.orders_status_enum not null default 'PENDING',
  payment_gateway_ref character varying,
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now(),
  "userId" integer references public.users(id) on delete cascade
);

create table public.tickets (
  id serial primary key,
  qr_code character varying unique,
  status public.tickets_status_enum not null default 'VALID',
  pdf_url character varying,
  seat_number character varying(50),
  scanned_at timestamp without time zone,
  checked_at timestamp without time zone,
  checked_by_user_id integer references public.users(id) on delete set null,
  event_id integer references public.events(id) on delete cascade,
  "orderId" integer references public.orders(id) on delete cascade,
  "categoryId" integer references public.ticket_categories(id) on delete cascade
);

create table public.payments (
  id serial primary key,
  gateway public.payments_gateway_enum not null,
  amount numeric(10, 2) not null,
  currency character varying(10) not null default 'MAD',
  transaction_id character varying,
  invoice_number character varying,
  invoice_pdf_url character varying,
  status public.payments_status_enum not null default 'PENDING',
  created_at timestamp without time zone not null default now(),
  "orderId" integer unique references public.orders(id) on delete cascade
);

create table public.qr_scan_logs (
  id uuid primary key default gen_random_uuid(),
  ticket_id integer not null references public.tickets(id) on delete cascade,
  scanned_by_user_id integer not null references public.users(id) on delete cascade,
  scanned_at timestamp without time zone not null default now(),
  result public.qr_scan_logs_result_enum not null,
  device_info character varying(255)
);

create table public.event_reviews (
  id serial primary key,
  rating integer not null check (rating between 1 and 5),
  comment text,
  status public.event_reviews_status_enum not null default 'PENDING',
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now(),
  "eventId" integer not null references public.events(id) on delete cascade,
  "userId" integer not null references public.users(id) on delete cascade,
  "approvedById" integer references public.users(id) on delete set null
);

create table public.event_staff (
  id uuid primary key default gen_random_uuid(),
  staff_role public.event_staff_staff_role_enum not null,
  assigned_at timestamp without time zone not null default now(),
  "eventId" integer not null references public.events(id) on delete cascade,
  "userId" integer not null references public.users(id) on delete cascade,
  "assignedById" integer references public.users(id) on delete set null,
  unique ("eventId", "userId")
);

create table public.country_languages (
  "countriesId" integer not null references public.countries(id) on delete cascade,
  "languagesId" integer not null references public.languages(id),
  primary key ("countriesId", "languagesId")
);

create table public.user_saved_events (
  "usersId" integer not null references public.users(id) on delete cascade,
  "eventsId" integer not null references public.events(id),
  primary key ("usersId", "eventsId")
);

-- Foreign-key and application lookup indexes.
create index idx_cities_country on public.cities ("countryId");
create index idx_users_role on public.users ("roleId");
create index idx_events_start_status on public.events (date_start, status);
create index idx_events_city_entity on public.events ("cityEntityId");
create index idx_events_category_entity on public.events ("categoryEntityId");
create index idx_events_organizer on public.events ("organizerId");
create index idx_ticket_categories_event on public.ticket_categories ("eventId");
create index idx_orders_user on public.orders ("userId");
create index idx_tickets_event on public.tickets (event_id);
create index idx_tickets_order on public.tickets ("orderId");
create index idx_tickets_category on public.tickets ("categoryId");
create index idx_tickets_checked_by on public.tickets (checked_by_user_id);
create index idx_qr_scan_logs_ticket on public.qr_scan_logs (ticket_id);
create index idx_qr_scan_logs_scanner on public.qr_scan_logs (scanned_by_user_id);
create index idx_event_reviews_event on public.event_reviews ("eventId");
create index idx_event_reviews_user on public.event_reviews ("userId");
create index idx_event_staff_event on public.event_staff ("eventId");
create index idx_event_staff_user on public.event_staff ("userId");
create index idx_country_languages_language on public.country_languages ("languagesId");
create index idx_user_saved_events_event on public.user_saved_events ("eventsId");

insert into public.roles (name)
values ('ADMIN'), ('ORGANIZER'), ('USER'), ('STAFF')
on conflict (name) do nothing;

-- These tables are server-only. Keep the Data API closed even if project-wide
-- auto-exposure is enabled later.
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
alter default privileges in schema public
  revoke all on tables from anon, authenticated;
alter default privileges in schema public
  revoke all on sequences from anon, authenticated;

alter table public.roles enable row level security;
alter table public.languages enable row level security;
alter table public.countries enable row level security;
alter table public.cities enable row level security;
alter table public.event_categories enable row level security;
alter table public.users enable row level security;
alter table public.events enable row level security;
alter table public.ticket_categories enable row level security;
alter table public.orders enable row level security;
alter table public.tickets enable row level security;
alter table public.payments enable row level security;
alter table public.qr_scan_logs enable row level security;
alter table public.event_reviews enable row level security;
alter table public.event_staff enable row level security;
alter table public.country_languages enable row level security;
alter table public.user_saved_events enable row level security;
