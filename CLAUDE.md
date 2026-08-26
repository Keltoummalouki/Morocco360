# CLAUDE.md — EventHub

Guidance for Claude Code when working in this repository. These instructions
override default behavior — follow them exactly.

EventHub is a centralized platform to discover, book, and manage events across
Morocco (locals + tourists). Ticketing with signed QR codes, Stripe payments,
role-based dashboards, and a secure QR-scanning system.

---

## Architecture

Monorepo with two apps and a Dockerized Postgres:

```
EventHub/
├── api/        NestJS 11 backend (TypeORM 0.3 + PostgreSQL 16)
├── web/        Next.js 16 frontend (App Router, React 19)
├── docs/       Design docs (QR system, install, production checklist)
├── docker-compose.yml   local PostgreSQL
└── dev.ps1     unified dev starter (lint → test → seed → start both apps)
```

### Backend — `api/` ([README](api/README.md))
- **NestJS 11** + **TypeORM 0.3** + **PostgreSQL 16** (Docker), **rxjs 7**.
- Auth: **JWT** access (15 min) + refresh (7 d, rotated) via **Passport** (`local`, `jwt`, `jwt-refresh` strategies). Refresh tokens stored **bcrypt-hashed** only.
- Validation: **class-validator** / **class-transformer** DTOs with strict whitelist. Config validated at boot with **Joi**.
- Modules: `auth`, `users`, `events`, `orders`, `payments` (**Stripe**), `tickets`, `scanner`, `organizer`, `admin`, `mail` (**nodemailer**), `health` (**@nestjs/terminus**). Rate limiting via **@nestjs/throttler**, docs via **@nestjs/swagger**, QR via **qrcode**/**pdfkit**.
- Each feature is a Nest module: `*.controller.ts` → `*.service.ts` → TypeORM `entities/`. **Services and their entities are the source of truth** — put business logic in services, not controllers.

### Frontend — `web/` ([README](web/README.md))
- **Next.js 16.1.6** (App Router) + **React 19.2.3**. **React Compiler is on** (`reactCompiler: true` in [next.config.ts](web/next.config.ts)) — do **not** hand-add `useMemo`/`useCallback`/`memo` noise; let the compiler handle it.
- **Tailwind CSS v4** (`@import "tailwindcss"` + `@theme inline`, PostCSS). No config file — theme lives in [globals.css](web/src/app/globals.css).
- Motion: **framer-motion 12** + **GSAP 3** (helpers in [web/src/lib/gsap.ts](web/src/lib/gsap.ts)). Maps: **leaflet** / **react-leaflet 5**. QR camera: **@zxing/browser**.
- **UI kit: shadcn/ui** (Radix primitives + Tailwind v4, themed via CSS variables — the same mechanism this repo already uses). **Not installed yet** — run `npx shadcn@latest init`, point it at [web/src/app/globals.css](web/src/app/globals.css) and keep `cssVariables: true`, then map shadcn's token names to the existing ones. Alongside it, the hand-built components in [web/src/components/](web/src/components/) and the scoped **`.cinema`** filmic system in [web/src/components/cinema/](web/src/components/cinema/) stay — reuse them. Don't add any other UI kit (no PrimeNG/MUI).
- **Design tokens** are CSS variables in [globals.css](web/src/app/globals.css) (deep Moroccan green × terracotta × gold). Light is default; dark mode is `[data-theme="dark"]` driven by `ThemeProvider` + `ThemeToggle`. Always theme both modes.
- Media: Higgsfield asset slots declared in [web/src/lib/media.ts](web/src/lib/media.ts) and rendered through the `<Media>` component (filmic placeholder until a real file lands in `/public`).
- i18n: `fr` (default), `ar` (RTL), `en` — dictionary + `isRTL` in [web/src/lib/i18n.ts](web/src/lib/i18n.ts), wired through `LocaleProvider` / `LocaleSwitcher` and the `locale` cookie.

### How web talks to the API (BFF proxy)
The browser never calls NestJS directly. It calls **same-origin Next.js route
handlers** in [web/src/app/api/](web/src/app/api/), which forward to the NestJS
backend and manage the httpOnly auth cookies. Client fetch helpers live in
[web/src/lib/auth.ts](web/src/lib/auth.ts) (e.g. `apiLogin` → `POST /api/auth/login`).
When adding a backend call from the UI, follow that pattern: add/extend a route
handler under `web/src/app/api/**`, then call it via a typed `fetch` helper in `lib/`.

### Roles & dashboards
`ADMIN` · `ORGANIZER` · `STAFF` (QR scanning) · `USER`. Role → landing route is
mapped in `ROLE_HOME` ([web/src/lib/auth.ts](web/src/lib/auth.ts)); [middleware.ts](web/src/middleware.ts)
guards access.

### Commands
| Task | Command |
|------|---------|
| Everything (lint + test + seed + start both) | `.\dev.ps1` (root, PowerShell) — flags: `-SkipLint`, `-SkipTest`, `-SkipSeed`, `-ServersOnly` |
| Start Postgres | `docker compose up -d` |
| API dev | `cd api; npm run start:dev` → http://localhost:4000 |
| Web dev | `cd web; npm run dev` → http://localhost:4001 |
| Seed users | `cd api; npm run seed` |
| API tests | `cd api; npm run test` · `npm run test:cov` · `npm run test:e2e` |
| Production web build (for Lighthouse) | `cd web; npm run build; npm run start` |

---

## Working agreements

- **Commits:** Never add a `Co-Authored-By` line or any "contributor"/AI signature to commits. Author the commit as the user only.
- **Design & styling:** For any UI, design, or styling task, use the UI/UX design skills — **`/ui-ux-pro-max`** (design intelligence: layout, color palettes, typography, spacing, accessibility; includes **shadcn/ui MCP** for component search) and **`/ui-designer`** (component and screen design). Build UI with **shadcn/ui** components and prefer the **latest** shadcn CLI/API: add a component with `npx shadcn@latest add <component>`, then style it through the **CSS-variable design tokens** in [globals.css](web/src/app/globals.css) rather than hardcoding colors — never edit files inside a generated `ui/` folder by hand where you can theme via tokens. Reuse the existing hand-built components ([web/src/components/](web/src/components/)) and the scoped **`.cinema`** system a file already uses; animate with **framer-motion** / **GSAP**. Don't mix in another UI kit (no PrimeNG/MUI/etc.). Every new surface must work in **light and dark** and respect **RTL** (`ar`). For heavier redesign work, `design-taste-frontend`, `impeccable`, and `component-polish` are also available.
- **Up-to-date library docs:** Before writing or changing code that uses a library, framework, or API (Next.js, React, Tailwind, shadcn/ui, Radix, framer-motion, GSAP, react-leaflet, @zxing/browser, NestJS, TypeORM, class-validator, Passport/JWT, Stripe, etc.), pull current docs with the **`context7`** MCP (`resolve-library-id` → `query-docs`) instead of relying on memory — versions move and training data lags. Match the versions this repo actually pins (**Next.js 16.1.6, React 19.2, Tailwind v4, NestJS 11, TypeORM 0.3**).
- **Best practices:** Apply current best practices on every task — idiomatic **App Router Next.js 16**: Server Components by default, add `"use client"` only when a component needs interactivity/hooks; keep data fetching on the server; strong TypeScript typing end to end. On the API, idiomatic **NestJS**: DI, one module per feature, DTOs validated with class-validator, guards for authz, business logic in services. Follow the existing patterns (Next route-handler BFF + `fetch` helpers in `lib/`; Nest `service` + TypeORM `entity` as source of truth). Don't leak rxjs subscriptions where used.
- **Code quality:** Keep code **simple but high quality** — small, readable, no needless abstraction or duplication. Prefer the clearest solution over the clever one.
- **Performance & security come first:** Treat performance, security, and code quality as required, non-negotiable goals on every change — not afterthoughts. Never log or commit secrets; keep them in env (`api/.env`, see [.env.example](.env.example)). Preserve the existing security posture (strict DTO whitelist, bcrypt, JWT rotation, throttling, signed QR / HMAC).
- **Performance checks:** For perf-sensitive work (new pages, heavy components, bundle or load-time changes), measure with the **`/lighthouse`** skill. Audit a **production build served locally** (`cd web; npm run build; npm run start`), never the dev server — `localhost:4001` is an unminified Turbopack dev build and reports fake-bad FCP/LCP. Compare before/after and confirm Core Web Vitals (LCP, TBT/INP, CLS) didn't regress.
- **Testing:** Test the code you write. The **API** uses **Jest** (`*.spec.ts` unit + `test/` e2e) — cover the meaningful paths (happy path, edge cases, error handling) and confirm tests pass before calling work done. The **web** app has no test runner configured yet; if a web change needs coverage, add Vitest or Jest + Testing Library rather than skipping it, and say so. If a change is genuinely untestable, say so and why.
- **Self-review before done:** Before calling a change finished, run the **`/code-review`** skill on the diff and fix what it flags. Treat it as a required gate next to tests, not an optional extra.
- **Explanations:** Explain changes in **simple, plain language with simple words** — short sentences, no jargon dump. Assume the reader wants the gist fast.
- **Suggestions:** After finishing a task, proactively propose ideas or improvements for a better result (better delivery, cleaner code, performance/security wins) — as optional suggestions, not unrequested changes.
