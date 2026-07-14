# Morocco360 — Imperial Trinity Redesign (session log, 2026-07-13)

A condensed record of the full redesign session: what was decided, what shipped,
what broke, and what is still open. Written so a future session can pick this up
without re-deriving anything.

---

## 1. Context — why this happened

The app had **three competing design languages** at once:

| Source | Look | Story |
|---|---|---|
| Live `.cinema` home | Dark, terracotta + gold, Fraunces serif, film grain | 360° virtual tourism |
| `ds-bundle/` (synced to a Claude Design project) | Derived from `.cinema` | — |
| `DESIGN.md` (Google Stitch export) | **Light, Atlas Blue + Sahara Gold + Marrakesh Red, Plus Jakarta Sans + Work Sans** | **Events + ticketing** |

The home page sold *360° panoramas* while the backend (README, NestJS API) is an
**events + ticketing platform** (Stripe, signed QR tickets, role dashboards).

**Decision (user):** `DESIGN.md` "Imperial Trinity" is the single source of truth.
The `.cinema` concept was dropped (it had already been reverted in-repo mid-session).
A private **Google Stitch** project is the visual reference; `DESIGN.md` is its export.

---

## 2. Design system

**Palette (retokened app-wide in `web/src/app/globals.css`)** — semantic var *names*
were kept so every existing screen re-skinned for free:

- Atlas Blue `--primary: #003E7A` (dark: `#7FB0FF`)
- Sahara Gold `--gold: #FDBB24`
- Marrakesh Red `--accent: #AA131F`
- Added `--on-primary`, `--on-gold`, `--on-accent`, `--inverse-surface`, `--primary-fixed`, `--radius`
- Light is default; a **dark variant was derived** (DESIGN.md is light-only) — deep navy surfaces.

**Type:** Plus Jakarta Sans (`--font-jakarta`, display) + Work Sans (`--font-work-sans`, body),
Noto Sans Arabic for RTL. Loaded in `layout.tsx`.

**Namespacing:** all new public/app styles are prefixed **`.ev-*`** so they never
collide with the pre-existing app-wide kit (`.btn-primary`, `.feature-card`,
`.search-input`, …) still used by the admin/organizer/staff dashboards.

### shadcn/ui integration — the tricky part

`shadcn init` was **deliberately NOT run** — it injects its own `:root` tokens and
would have clobbered the Imperial Trinity palette. Instead `components.json` was
hand-authored and the tokens were bridged in `@theme inline`.

Two real conflicts had to be resolved:

1. **`muted` / `accent` mean different things.** shadcn treats them as *backgrounds*
   with the readable colour in `*-foreground`; our `--muted` is a *text* colour and
   `--accent` is Marrakesh Red. Mapping: `muted → surface-2`, `muted-foreground → our --muted`,
   `accent → surface-3`, and the brand red moved to `--color-brand`.
2. **shadcn emits `dark:` utilities**, which default to `prefers-color-scheme`. This app
   themes via a `[data-theme="dark"]` attribute (ThemeProvider). Without a fix every
   shadcn component would follow the OS instead of the toggle. Fixed with:
   ```css
   @custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));
   ```

Also: shadcn's installer **under-installed** — it created components but not
`lib/utils.ts` (`cn`) nor `clsx` / `class-variance-authority` / `tailwind-merge` /
`lucide-react`. Those were added manually.

**Components added:** button, input, label, card, badge, select, separator, sheet,
popover, calendar, dropdown-menu, avatar, pagination, tabs, skeleton.

---

## 3. What shipped

### Public surfaces
- **`/` home** — rebuilt to match the Stitch screen: nav, photo hero + 4-field booking
  search (shadcn `Select` + `Popover`/`Calendar`), **Trending bento grid** (3 card
  variants: image-fill / stacked / split), "Experience Morocco with Confidence" 3-up,
  dark organizer panel, minimal footer.
- **`/events`** — photo hero header; grid rebuilt on shadcn (Input/Select/Button/Card)
  with search, category chips, city/date/price filters, sort, and a "from" date picker.
- **`/login` + `/register`** — shared `AuthShell` (photo aside, dropped below `lg`),
  forms on shadcn. Old 360°-tour copy replaced with the events narrative.
- **`/about`, `/support`, `/privacy`, `/terms`** — created because the footer linked to
  them and they 404'd. Privacy/Terms **say plainly they are placeholders** (no invented
  legal text).
- **Logo** — new inline SVG mark (Moroccan horseshoe archway) + wordmark, themeable via
  `--primary` / `--on-primary`. Used in nav, footer, auth.
- **Nav items** are now only real pages: **Discover (`/`) · Events (`/events`) · About (`/about`)**.

### The user "app" (was the USER dashboard)
Routes moved **`/dashboard/user/*` → `/user/*`** (USER only; admin/organizer/staff keep
their dashboards). Middleware protects `/user`; `ROLE_HOME.USER = /user/events`.

- **Shell** — top app-bar (logo · tabs · locale · theme · avatar menu w/ logout) on desktop,
  **fixed bottom tab bar** with safe-area padding on mobile.
- **`/user/events`** — search, chips, filters, sort, **Grid ⇄ Map toggle** (leaflet),
  save-toggle on cards, client pagination.
- **`/user/events/[id]`** — hero, details, save toggle, booking panel (category → quantity → Pay/Stripe).
- **`/user/saved`** — unsave with optimistic rollback.
- **`/user/history`** — upcoming/past tickets + **Télécharger PDF**.
- **`/user/profile`** — **email now editable**, country-code phone input (libphonenumber),
  per-field uniqueness errors, password change.

### Backend (`api/`)
`UsersService.updateProfile` previously did a blind `Object.assign` + save with **no
uniqueness checks**, and email was not editable. Now:
- `UpdateProfileDto` gained `email` (`@IsEmail`); `full_name` is `@Length(0,150)` so it can be **cleared**.
- Uniqueness enforced against other users (`Not(userId)`) → `ConflictException` for
  username / email / phone.
- Phone validated + normalised to **E.164** via `libphonenumber-js`; invalid → `BadRequestException`.
- Uniqueness is **app-level** (safe with existing seed data). A DB partial-unique index on
  `username`/`phone_number` remains an optional hardening follow-up.
- **Caveat:** the JWT carries `email`, so after an email change it is stale until the next
  refresh (≤15 min). No re-verification flow was built.

### Shared modules created
`lib/event-filters.ts` (categories, colours, filter/sort — shared by the public grid **and**
the user browser), `lib/user-events.ts` (types + date formatting), `lib/pagination.ts`
(`buildRange`, `pageCountFor`), `lib/utils.ts` (`cn`, `selectContentFit`, `selectItemWrap`).

---

## 4. Bugs found and fixed (the gates earned their keep)

**Lighthouse** (production build) caught two that would have shipped:
- **Category badges failed contrast in dark mode** (1.92:1). Badge hues are now passed to CSS
  as custom properties so the stylesheet swaps to lightened variants under `[data-theme="dark"]`.
- **Every home event card 404'd** — they linked to `/events/<id>`, which does not exist.

**`/code-review`** across two passes found, among others:
- **The user map would have rendered zero pins** — the marker effect ran before the async
  leaflet import resolved, bailed on a null map, and never re-ran. Fixed with a `ready` flag.
- **Any user without a `full_name` got a 400 on every profile save** — `@IsOptional()` does not
  skip `''`, so `@Length(1,150)` rejected it.
- `PhoneInput` kept a stale number after Cancel (seeded once, never re-synced).
- Sold-out ticket categories stayed selectable with Pay enabled (`??` does not treat `0` as missing).
- LTR `→` arrows broke RTL; nav links vanished on mobile with no menu; a dead notification button.
- The **city dropdown blew out its width** on a long name — shadcn's `SelectContent` defaults to
  `position="item-aligned"`, which sizes to the *widest item*; `--radix-select-trigger-width` only
  exists in **popper** mode.

**Security review** caught a **real stored XSS** (HIGH):
- `EventsMap` built Leaflet popup HTML by string interpolation of `event.title` / `city` —
  **organizer-supplied, DB-persisted** values. An event titled `<img src=x onerror=…>` would have
  executed in every viewer's browser. (This flaw **pre-existed** in the old dashboard map; it was
  carried forward, then removed.)
- Fixed by building **real DOM nodes with `textContent`** — safe by construction, not by
  remembering to escape.

---

## 5. Operational gotchas (read before touching deps)

### Docker: a host `npm install` does NOT reach the containers
- `package.json` is **not bind-mounted** (only `src/`, `next.config.ts`, `public/`).
- `web_node_modules` / `api_node_modules` are **named volumes**; Docker seeds them from the image
  **only on first creation** — an existing volume keeps stale contents forever.

To add a dependency:
```bash
cd web && npm install <pkg>
cd .. && docker compose stop web && docker compose rm -f web
docker volume rm morocco360_web_node_modules      # MUST remove, or it stays stale
docker compose up -d --build web
```
**NEVER `docker compose down -v`** — it also destroys `morocco360_postgres_data`.

### Other
- The web container runs Next with **`--webpack`** (Turbopack's watcher can't see edits across the
  Windows/OneDrive bind mount); hot reload relies on polling.
- `next build` can fail with **`EPERM: unlink .next/...`** — a OneDrive file lock, not a code error.
  Delete `.next` and rebuild.
- **Higgsfield**: 5 images were generated for the home page (hero + 4 cards, 2 credits each) and live
  in `web/public/events/`. The MCP later **disconnected** and the balance is **0** — no further
  generation is possible until it is reconnected and topped up. The logo was therefore made as an
  **SVG** (the correct choice for a nav mark anyway).

---

## 6. Verification status

- **Web:** 32 tests passing (`vitest`, newly introduced), lint clean, production build green.
- **API:** 15 `users.service` tests passing (uniqueness + phone validation added).
- **Lighthouse** (prod build, desktop): `/`, `/events`, `/login`, `/register` all **99 / 100 / 100 / 100**.
- **Live E2E in Docker:** logged in as the dev user; all `/user/*` pages + booking page render;
  unauth `/user/events` → **307** to login; duplicate email → **409**; invalid phone → **400**;
  valid phone → **200** normalised to `+212612345678`.

---

## 7. Known issues / open items

1. **`api/src/events/events.service.spec.ts` — 4 failing tests, PRE-EXISTING.**
   `EventsService` gained an `EventStaffRepository` constructor dep and the spec never mocked it,
   so it fails at DI setup. Unrelated to this work; ~3-line fix.
2. **No public `/events/[id]` route.** Home cards deep-link to `/events?event=<id>` as a fallback.
   Build the detail page and point them properly.
3. **Privacy / Terms are placeholders** — they need real legal copy before launch.
4. **Arabic copy is best-effort** — worth a native review.
5. **Design-sync (Phase 2) not done.** `ds-bundle/` + `.design-sync/config.json` still point at a
   Claude Design project derived from the **retired `.cinema`** system. It needs re-deriving from
   Imperial Trinity and re-syncing — an outward push that requires `/design-consent`.
6. **Organizer / admin / staff dashboards** still use the old layouts (they inherited the new palette
   but were not redesigned).
7. `middleware.ts` triggers a Next 16 deprecation warning — rename to `proxy.ts` eventually.
8. Optional hardening: DB unique constraints on `username` / `phone_number` (needs a migration + dedup).

---

## 8. Related documents

- `DESIGN.md` — the Imperial Trinity design system (Stitch export; source of truth).
- `docs/superpowers/specs/2026-07-10-home-page-redesign-design.md` — approved home spec.
- `docs/superpowers/plans/2026-07-10-home-page-redesign.md` — home implementation plan.
- `~/.claude/plans/i-don-t-want-a-serialized-dawn.md` — approved plan for the user app.

> Note: the spec/plan above were written **before** the Stitch screenshot arrived; the final home
> follows the 6-section Stitch composition, not the 10-section structure they describe.

---

**Status:** all work is **uncommitted** on the `dev` branch.
