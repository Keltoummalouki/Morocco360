# Admin Backoffice — Adaptation Design (2026-07-13)

Companion to `docs/ADMIN_BACKOFFICE_IMPLEMENTATION_SPEC.md`. That spec is the
**what**; this doc is the **how** — how the spec maps onto the *existing*
Morocco360 code without rewriting the working public site, user app, or
organizer/staff dashboards.

Two decisions were made up front (both by the user):

1. **Additive / coexist schema** — add new entities and nullable columns; keep
   every existing field working. No destructive migration of `Event.city`
   (free text) or `Event.category` (enum).
2. **Dependency delivery order** — Foundation → Settings → Events → People →
   Bookings/Payments/Reviews → Polish.

---

## 1. Guiding constraints

- One `User` entity + `Role`. No separate Admin/Organizer/Staff entities.
- NestJS + TypeORM patterns already in the repo (module → controller → service →
  entity; DTOs validated with class-validator; guards for authz).
- Every admin list endpoint: `page`, `limit`, `search`, `sortBy`, `sortOrder`
  + entity filters; returns `{ data, meta }`.
- Next.js BFF: browser calls `/api/admin/**` route handlers, never NestJS
  directly; httpOnly cookies preserved.
- Suspend/activate over hard delete for anything referenced by events, orders,
  tickets, payments.
- All admin UI reuses the existing `DashboardShell`, `ConfirmModal`, design
  tokens, dark mode, and RTL. No separate admin visual language.
- `synchronize: true` in dev auto-creates new tables/columns; **enum value
  additions** get an explicit migration (Postgres can't add enum values under
  synchronize reliably), mirroring the existing `AddStaffRoleEnum` migration.

## 2. Additive schema

### New entities

| Entity | Key fields | Relations |
|---|---|---|
| `Country` | name, iso_code, latitude, longitude, status, timestamps | 1—* `City`, *—* `Language` |
| `City` | name, latitude, longitude, status, timestamps | *—1 `Country` |
| `Language` | name, code, status, timestamps | *—* `Country` |
| `EventCategory` (entity) | name, description, status, timestamps | 1—* `Event` (nullable FK) |
| `EventReview` | rating, comment, status (PENDING/APPROVED/UNAPPROVED), timestamps | *—1 `Event`, *—1 `User`, *—1 `approved_by` User |

`Status` (settings entities) = `ACTIVE | SUSPENDED`.

**Name clash:** the legacy `EventCategory` *enum* stays in `event.entity.ts`.
The new `EventCategory` *entity* lives in `settings/entities/event-category.entity.ts`
and is imported **with an alias** (`EventCategory as EventCategoryEntity`) only
where both are needed. Existing importers of the enum are untouched.

### Additive columns (nothing dropped)

- `Event`: `status` enum `EventStatus` (ACTIVE/SUSPENDED/DRAFT/SOLD_OUT/CANCELLED),
  nullable FKs `cityEntity` (City) and `categoryEntity` (EventCategory). Kept in
  sync with the existing `is_active`/`is_sold_out`/`city`/`category` so the
  public grid + user app queries stay correct.
- `User`: nullable `first_name`, `last_name`, `date_of_birth`. `full_name`
  stays. Age is always computed from `date_of_birth`, never stored.
- `Order`, `Ticket`: add `SUSPENDED` to status enum (migration).
- `Payment`: add nullable `invoice_number`, `invoice_pdf_url`; add `PAID`,
  `NOT_PAID` enum values (migration). Legacy `SUCCESS` kept and treated as paid.
- `TicketCategory`: nullable `description`, `status` (ACTIVE/SUSPENDED).

## 3. Shared pagination

`api/src/common/dto/pagination-query.dto.ts` — `PaginationQueryDto`:
`page` (default 1, min 1), `limit` (default 20, min 1, max 100), `search?`,
`sortBy?`, `sortOrder` (`ASC|DESC`, default DESC). Validated + whitelisted.

`api/src/common/pagination.ts` — `paginate(qb, dto, { sortable })` runs a
QueryBuilder with `skip/take`, applies a whitelisted `sortBy`, and returns:

```json
{ "data": [], "meta": { "page", "limit", "total", "totalPages",
  "hasNextPage", "hasPreviousPage" } }
```

Unit-tested against meta math (empty, partial, exact page boundaries).

## 4. Backend module layout

Split the current thin `AdminModule` into focused units:

- `admin/` → `AdminUsersService`, `AdminEventsService`, `AdminBookingsService`,
  `AdminPaymentsService`, `AdminReviewsService`, controllers per domain.
- `settings/` → `SettingsModule` with country/city/language/event-category
  services + controllers under `/admin/settings/**`.

All admin routes guarded by `JwtAuthGuard + RolesGuard('ADMIN')`. Business logic
in services; controllers stay thin.

## 5. Frontend layout

Per domain: `web/src/app/api/admin/**` route handlers → typed helpers in
`web/src/lib/admin/*.ts` → pages under `web/src/app/dashboard/admin/**`.

Every list page includes: page title, search input, relevant filters,
paginated table/dense card list, add button (where creation is supported), row
actions (view/edit/suspend-activate/delete-where-allowed), loading skeleton,
empty state, error state, confirm modal for destructive/status actions,
pagination controls synced to backend query params. Light/dark + RTL verified.

Routes: the full set from the spec under `/dashboard/admin/**`.

## 6. Phase plan (each phase: backend → tests → BFF → helpers → UI)

- **Phase 0 — Foundation:** pagination DTO + helper (+tests); new entities;
  additive columns; enum migrations; register entities; seed a starter set of
  countries/cities/languages/categories.
- **Phase 1 — Settings:** Countries, Cities, Languages, Event Categories CRUD,
  delete-if-safe, country↔language assignment, country→cities/languages
  sub-lists.
- **Phase 2 — Events (admin):** paginated list + filters (status/city/country/
  category/date), create/edit, suspend/activate, assign organizer, assign/remove
  staff, ticket-categories CRUD, bookings sub-list, attendees export, user
  search for pickers.
- **Phase 3 — People:** Users, Organizers, Staff — paginated list/search/filter,
  create/edit, suspend/activate, per-user orders / per-organizer + per-staff
  events. Upgrades the existing admin users code to the paginated contract.
- **Phase 4 — Bookings + Payments + Reviews:** bookings list/detail/status,
  ticket status, payments list/detail/status/invoice (+pdf), reviews
  list/detail/approve/unapprove.
- **Phase 5 — Polish:** admin landing, settings index, sidebar admin nav,
  print/export views, light/dark/desktop/mobile/RTL sweep, `/code-review`.

## 7. Access control & rules

- Admin pages + APIs require authenticated `ADMIN`.
- Organizer/staff assignment endpoints require `ADMIN`.
- Scanner endpoints stay `STAFF`-accessible as designed.
- Suspended users can't log in or perform protected actions (already enforced;
  keep it).
- DTOs strict-whitelisted; pagination input validated; role assignment
  validated; delete-if-safe guards on settings entities.
- Password hashing + refresh-token security unchanged.

## 8. Testing

Backend: service unit tests (pagination meta, search/filter, suspend/activate,
assignment, delete-if-safe guards) + controller/e2e for the important admin
endpoints + role-guard coverage. Frontend: Vitest for typed helpers and key
components where practical; manual verification of every new route's loading/
empty/error/success states.
