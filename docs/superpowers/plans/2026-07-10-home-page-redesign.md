# Home Page Redesign (Imperial Trinity) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the dark `.cinema` 360°-tourism home with a light, events-and-ticketing home built on DESIGN.md's "Imperial Trinity" system, and retoken the whole app to that palette.

**Architecture:** Retoken `globals.css` in place (keep semantic var *names*, change values) so every existing screen inherits Atlas Blue / Sahara Gold / Marrakesh Red for free. Build the new home as focused Server Components under `web/src/components/home/`, using the existing interactive primitives (`PremiumSearch`, `SpotlightCard`, `AnimatedCounter`, `StaggerReveal`) as client children. Content is curated placeholder data; copy flows through the existing `fr`/`ar`/`en` dictionary.

**Tech Stack:** Next.js 16.1.6 (App Router, React 19.2, React Compiler on), Tailwind CSS v4 (no config; tokens in `globals.css`), framer-motion 12 + GSAP 3, `next/font/google`, Vitest (new, for pure helpers only).

## Global Constraints

- **Next.js 16 App Router:** Server Components by default; add `"use client"` only for interactivity/hooks. Keep data/formatting on the server.
- **React Compiler is ON:** do NOT hand-add `useMemo`/`useCallback`/`memo`.
- **Tailwind v4, no config file:** all design tokens are CSS variables in `web/src/app/globals.css`. Never hardcode hex in components — use `var(--…)`.
- **Palette (exact):** Atlas Blue `--primary` `#003e7a`; Sahara Gold `--gold` `#fdbb24`; Marrakesh Red `--accent` `#aa131f`. Keep every existing semantic var name.
- **Fonts:** Plus Jakarta Sans (`--font-jakarta`, display) + Work Sans (`--font-work-sans`, body); Noto Sans Arabic stays for RTL.
- **Both themes required:** every surface works in light (default) and `[data-theme="dark"]`.
- **i18n/RTL:** `fr` default, `ar` RTL, `en`; all user-visible copy via the dictionary in `web/src/lib/i18n.ts`.
- **Reduced motion:** every animation gated on `prefers-reduced-motion` (the reused primitives already do this).
- **No other UI kit** (no MUI/PrimeNG). Reuse hand-built components.
- **Commits:** author as the user only — never add `Co-Authored-By` or any AI signature.
- **Library docs:** pull current docs via `context7` MCP before using an unfamiliar API.
- **Perf:** measure with `/lighthouse` against a production build (`cd web; npm run build; npm run start`), never the dev server.

---

## File Structure

**Modified**
- `web/src/app/globals.css` — retoken `:root` + `[data-theme="dark"]` + `@theme inline`; append Imperial-Trinity home component classes.
- `web/src/app/layout.tsx` — add Jakarta + Work Sans fonts; update metadata to events copy.
- `web/src/app/page.tsx` — assemble the new home (replaces cinema imports).
- `web/src/lib/i18n.ts` — add a `home` section to `fr`/`ar`/`en`.
- `web/src/components/PremiumSearch.tsx` — parametrize (optional props) so it serves events; tourism defaults preserved.
- `web/package.json` — add Vitest scripts + dev deps.

**Created**
- `web/vitest.config.ts` — Vitest config.
- `web/src/lib/home-content.ts` — types + curated `EVENTS`/`CATEGORIES`/`CITIES`/`STATS` + `formatPrice`/`formatEventDate`.
- `web/src/lib/home-content.test.ts` — Vitest tests for the pure helpers.
- `web/src/components/home/CategoryBadge.tsx` — category pill (tinted).
- `web/src/components/home/Zellij.tsx` — subtle SVG zellij motif.
- `web/src/components/home/EventCard.tsx` — core event card.
- `web/src/components/home/HomeNav.tsx` — events top nav (client; glass-on-scroll).
- `web/src/components/home/HomeHero.tsx` — search-first hero.
- `web/src/components/home/CategoryBrowse.tsx` — browse-by-category.
- `web/src/components/home/FeaturedEvents.tsx` — featured events grid.
- `web/src/components/home/CityGrid.tsx` — explore-by-city.
- `web/src/components/home/HowItWorks.tsx` — 3 steps.
- `web/src/components/home/TrustStats.tsx` — trust + animated stats.
- `web/src/components/home/OrganizerCTA.tsx` — organizer panel.
- `web/src/components/home/FinalCTA.tsx` — closing CTA + newsletter.
- `web/src/components/home/HomeFooter.tsx` — events footer.

**Data-flow note:** `page.tsx` (Server Component) reads the locale from `cookies()`, calls `getTranslations(locale)`, and passes the `home` dictionary slice + curated data down to each section (also Server Components). Interactive children (`HomeNav`, `PremiumSearch`, `AnimatedCounter`, `StaggerReveal`, `SpotlightCard`) are the only `"use client"` pieces.

---

### Task 1: Retoken `globals.css` to Imperial Trinity + home classes

**Files:**
- Modify: `web/src/app/globals.css:9-98` (token blocks + theme bridge), append new classes at end of file.

**Interfaces:**
- Produces: the CSS custom properties every component and every existing screen reads (`--primary`, `--gold`, `--accent`, `--on-primary`, `--on-gold`, `--on-accent`, `--surface`, `--foreground`, `--border`, …) and the home classes `.home-section`, `.section-gap`, `.eyebrow`, `.h-display`, `.h-title`, `.h-lead`, `.btn-primary`, `.btn-secondary`, `.price-badge`, `.evt-card`, `.evt-media`, `.evt-body`, `.cat-tile`, `.city-tile`, `.home-nav`, `.glass-panel`.

- [ ] **Step 1: Replace the light `:root` token block** (`globals.css:9-46`) with:

```css
:root {
  --background:        #F4FAFD;
  --surface:           #FFFFFF;
  --surface-2:         #EEF5F7;
  --surface-3:         #E8EFF1;
  --foreground:        #161D1F;
  --foreground-dim:    #424751;
  --primary:           #003E7A;
  --primary-dark:      #00305F;
  --primary-light:     #0055A4;
  --primary-glow:      rgba(0,62,122,0.30);
  --primary-glow-soft: rgba(0,62,122,0.08);
  --on-primary:        #FFFFFF;
  --accent:            #AA131F;
  --accent-dark:       #820011;
  --accent-glow:       rgba(170,19,31,0.28);
  --accent-soft:       rgba(170,19,31,0.08);
  --on-accent:         #FFFFFF;
  --gold:              #FDBB24;
  --gold-strong:       #7B5800;
  --gold-glow:         rgba(253,187,36,0.28);
  --on-gold:           #6C4D00;
  --muted:             #424751;
  --muted-dim:         #727783;
  --border:            #E2E8F0;
  --border-light:      #C2C6D3;
  --shadow:            rgba(0, 62, 122, 0.10);
  --shadow-deep:       rgba(22, 29, 31, 0.18);
  --glass-bg:          rgba(255, 255, 255, 0.70);
  --glass-border:      rgba(0, 62, 122, 0.18);
  --input-bg:          #FFFFFF;
  --input-border:      #C2C6D3;
  --card-inverted-bg:  #003E7A;
  --card-inverted-text:#FFFFFF;
  --card-inverted-muted:#AFCCFF;
  --error:             #BA1A1A;
  --error-bg:          rgba(186,26,26,0.08);
  --success:           #1E6B52;
  --success-bg:        rgba(30,107,82,0.08);
  --sidebar-bg:        #EEF5F7;
  --sidebar-border:    #E2E8F0;
  --sidebar-width:     256px;
}
```

- [ ] **Step 2: Replace the `[data-theme="dark"]` block** (`globals.css:49-85`) with:

```css
[data-theme="dark"] {
  --background:        #0A1017;
  --surface:           #0F1720;
  --surface-2:         #141D27;
  --surface-3:         #1A2531;
  --foreground:        #E6EDF3;
  --foreground-dim:    #B8C4D0;
  --primary:           #7FB0FF;
  --primary-dark:      #4D86E0;
  --primary-light:     #A8C8FF;
  --primary-glow:      rgba(127,176,255,0.32);
  --primary-glow-soft: rgba(127,176,255,0.12);
  --on-primary:        #0A1017;
  --accent:            #FF6B61;
  --accent-dark:       #E0483F;
  --accent-glow:       rgba(255,107,97,0.32);
  --accent-soft:       rgba(255,107,97,0.12);
  --on-accent:         #24060A;
  --gold:              #FDBB24;
  --gold-strong:       #FDD589;
  --gold-glow:         rgba(253,187,36,0.28);
  --on-gold:           #3A2A00;
  --muted:             #9FB0BF;
  --muted-dim:         #6B7D8C;
  --border:            #22303D;
  --border-light:      #2C3D4C;
  --shadow:            rgba(0, 0, 0, 0.5);
  --shadow-deep:       rgba(0, 0, 0, 0.72);
  --glass-bg:          rgba(15, 23, 32, 0.72);
  --glass-border:      rgba(127, 176, 255, 0.18);
  --input-bg:          #0F1720;
  --input-border:      #2C3D4C;
  --card-inverted-bg:  #E6EDF3;
  --card-inverted-text:#0A1017;
  --card-inverted-muted:#4A5B6A;
  --error:             #FF5449;
  --error-bg:          rgba(255,84,73,0.10);
  --success:           #4ADE80;
  --success-bg:        rgba(74,222,128,0.10);
  --sidebar-bg:        #0A1017;
  --sidebar-border:    #1A2531;
}
```

- [ ] **Step 3: Update the `@theme inline` bridge** (`globals.css:88-98`) to add gold/accent + new fonts:

```css
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary:    var(--primary);
  --color-accent:     var(--accent);
  --color-gold:       var(--gold);
  --color-muted:      var(--muted);
  --color-surface:    var(--surface);
  --color-border:     var(--border);
  --font-sans:        var(--font-work-sans);
  --font-display:     var(--font-jakarta);
}
```

- [ ] **Step 4: Update the base `body` font-family** (`globals.css:107-114`) so the fallback stack points at Work Sans:

```css
body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-work-sans), system-ui, sans-serif;
  transition: background-color 0.3s ease, color 0.3s ease;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

- [ ] **Step 5: Append the home component classes at the end of `globals.css`:**

```css
/* ══════════════════════════════════════════════════════════
   HOME — Imperial Trinity (events landing)
   ══════════════════════════════════════════════════════════ */
.home-section { max-width: 1280px; margin-inline: auto; padding-inline: clamp(16px, 4vw, 40px); }
.section-gap  { padding-block: clamp(56px, 9vw, 96px); }

.eyebrow {
  font: 600 0.8125rem/1 var(--font-work-sans), system-ui;
  letter-spacing: 0.14em; text-transform: uppercase; color: var(--primary);
  display: inline-flex; align-items: center; gap: 10px;
}
.eyebrow::before { content: ""; width: 26px; height: 1.5px; background: currentColor; display: inline-block; }

.h-display { font-family: var(--font-jakarta), system-ui; font-weight: 800; letter-spacing: -0.02em; line-height: 1.04; color: var(--foreground); margin: 0; }
.h-title   { font-family: var(--font-jakarta), system-ui; font-weight: 700; letter-spacing: -0.01em; line-height: 1.1;  color: var(--foreground); margin: 0; }
.h-lead    { font-family: var(--font-work-sans), system-ui; font-size: clamp(1rem, 1.4vw, 1.125rem); line-height: 1.6; color: var(--foreground-dim); max-width: 56ch; }

.btn-primary, .btn-secondary {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  padding: 12px 22px; border-radius: 999px; cursor: pointer;
  font: 600 0.9375rem var(--font-work-sans), system-ui; letter-spacing: 0.01em;
  transition: transform .25s cubic-bezier(.16,1,.3,1), box-shadow .25s ease, background .2s ease;
  text-decoration: none; border: 1.5px solid transparent;
}
.btn-primary { background: var(--primary); color: var(--on-primary); }
.btn-primary:hover { transform: translateY(-1px); box-shadow: 0 12px 30px -10px var(--primary-glow); }
.btn-secondary { background: transparent; color: var(--primary); border-color: var(--primary); }
.btn-secondary:hover { background: var(--primary-glow-soft); }
.btn-primary:focus-visible, .btn-secondary:focus-visible { outline: 2px solid var(--primary); outline-offset: 3px; }

.price-badge {
  position: absolute; top: 12px; inset-inline-end: 12px; z-index: 2;
  background: var(--gold); color: var(--on-gold);
  font: 700 0.8125rem var(--font-work-sans), system-ui;
  padding: 5px 11px; border-radius: 999px; box-shadow: 0 4px 14px -4px var(--gold-glow);
}

.evt-card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; }
.evt-media { position: relative; aspect-ratio: 16 / 9; background: var(--surface-3); overflow: hidden; }
.evt-media img { width: 100%; height: 100%; object-fit: cover; }
.evt-body { padding: 16px; display: flex; flex-direction: column; gap: 8px; }
.evt-title { font: 700 1.0625rem/1.25 var(--font-jakarta), system-ui; color: var(--foreground); }
.evt-meta { display: flex; align-items: center; gap: 8px; font: 500 0.8125rem var(--font-work-sans), system-ui; color: var(--muted); }

.cat-tile {
  display: flex; flex-direction: column; gap: 10px; padding: 18px; border-radius: 12px;
  background: var(--surface); border: 1px solid var(--border);
  transition: transform .25s cubic-bezier(.16,1,.3,1), box-shadow .25s ease; text-decoration: none;
}
.cat-tile:hover { transform: translateY(-3px); box-shadow: 0 14px 34px -14px var(--primary-glow); }
.cat-tile:focus-visible { outline: 2px solid var(--primary); outline-offset: 3px; }

.city-tile { position: relative; aspect-ratio: 4 / 5; border-radius: 14px; overflow: hidden; display: block; }
.city-tile img { width: 100%; height: 100%; object-fit: cover; transition: transform .6s cubic-bezier(.16,1,.3,1); }
.city-tile:hover img { transform: scale(1.05); }
.city-tile::after { content: ""; position: absolute; inset: 0; background: linear-gradient(to top, rgba(10,16,23,0.78), rgba(10,16,23,0.05) 55%); }

.glass-panel { background: var(--glass-bg); -webkit-backdrop-filter: blur(12px); backdrop-filter: blur(12px); border: 1px solid var(--glass-border); }

.home-nav { position: sticky; top: 0; z-index: 50; transition: background .3s ease, border-color .3s ease, box-shadow .3s ease; border-bottom: 1px solid transparent; }
.home-nav.scrolled { background: var(--glass-bg); -webkit-backdrop-filter: blur(12px); backdrop-filter: blur(12px); border-bottom-color: var(--border); box-shadow: 0 4px 24px -16px var(--shadow-deep); }

@media (prefers-reduced-motion: reduce) {
  .btn-primary, .btn-secondary, .cat-tile, .city-tile img { transition: none; }
}
```

- [ ] **Step 6: Verify it builds and existing screens still theme.** Run: `cd web; npm run lint`
Expected: no new errors. Then `npm run dev`, open `http://localhost:4001/login` (or any dashboard) and confirm it now renders in blue/gold (not green) in both light and dark (toggle via the theme control). No layout breakage.

- [ ] **Step 7: Commit**

```bash
git add web/src/app/globals.css
git commit -m "feat(web): retoken design system to Imperial Trinity palette"
```

---

### Task 2: Add Jakarta + Work Sans fonts and events metadata

**Files:**
- Modify: `web/src/app/layout.tsx:1-2` (imports), `:11-47` (font defs), `:49-73` (metadata), `:95-98` (body classes).

**Interfaces:**
- Consumes: the `--font-jakarta` / `--font-work-sans` var names referenced by Task 1's `@theme` and classes.
- Produces: the two font CSS variables on `<body>`.

- [ ] **Step 1: Add the font imports.** In the `next/font/google` import on line 2, add `Plus_Jakarta_Sans, Work_Sans`:

```ts
import { Inter, Playfair_Display, Noto_Sans_Arabic, Fraunces, Geist, Geist_Mono, Plus_Jakarta_Sans, Work_Sans } from 'next/font/google';
```

- [ ] **Step 2: Define the fonts** (add after the `geistMono` definition, ~line 47):

```ts
/* ── Imperial Trinity fonts (events home + app) ───────────── */
const jakarta = Plus_Jakarta_Sans({
  variable: '--font-jakarta',
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
});

const workSans = Work_Sans({
  variable: '--font-work-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
});
```

- [ ] **Step 3: Add the variables to `<body>`.** Update the `className` on line ~97 to include the two new variables:

```tsx
className={`${inter.variable} ${playfair.variable} ${notoArabic.variable} ${fraunces.variable} ${geist.variable} ${geistMono.variable} ${jakarta.variable} ${workSans.variable} antialiased`}
```

- [ ] **Step 4: Replace the metadata** (`layout.tsx:49-73`) with events copy:

```ts
export const metadata: Metadata = {
  metadataBase: new URL('https://morocco360.com'),
  title: {
    default: 'Morocco360 — Discover & book events across Morocco',
    template: '%s · Morocco360',
  },
  description:
    'Discover concerts, festivals, matches and cultural events across Morocco — and book secure tickets in seconds. From the medina to the main stage.',
  keywords: ['Morocco', 'events', 'tickets', 'concerts', 'festivals', 'Marrakech', 'Casablanca', 'booking'],
  openGraph: {
    title: 'Morocco360 — Discover & book events across Morocco',
    description: 'Concerts, festivals, matches and culture across the Kingdom. Book secure tickets in seconds.',
    url: '/',
    siteName: 'Morocco360',
    images: [{ url: '/og/cover.jpg', width: 1200, height: 630, alt: 'Morocco360 — events across Morocco' }],
    locale: 'fr_MA',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Morocco360 — Discover & book events across Morocco',
    description: 'Concerts, festivals, matches and culture across the Kingdom.',
    images: ['/og/cover.jpg'],
  },
};
```

- [ ] **Step 5: Verify.** Run: `cd web; npm run lint`
Expected: no errors. `npm run dev` and confirm no font-loading console errors.

- [ ] **Step 6: Commit**

```bash
git add web/src/app/layout.tsx
git commit -m "feat(web): load Plus Jakarta Sans + Work Sans, update home metadata"
```

---

### Task 3: Vitest + curated content data module + helper tests

**Files:**
- Create: `web/vitest.config.ts`, `web/src/lib/home-content.ts`, `web/src/lib/home-content.test.ts`
- Modify: `web/package.json` (scripts + devDependencies)

**Interfaces:**
- Produces:
  - Types `EventItem`, `Category`, `City`, `Stat`.
  - Data `EVENTS: EventItem[]`, `CATEGORIES: Category[]`, `CITIES: City[]`, `STATS: Stat[]`.
  - Helpers `formatPrice(from: number | null, currency: string, locale: string): string` and `formatEventDate(iso: string, locale: string): string`.

- [ ] **Step 1: Install Vitest.** Run: `cd web; npm install -D vitest@^3`
Expected: added to devDependencies.

- [ ] **Step 2: Add scripts to `web/package.json`** (in `"scripts"`):

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 3: Create `web/vitest.config.ts`:**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
```

- [ ] **Step 4: Write the failing test** `web/src/lib/home-content.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { formatPrice, formatEventDate, EVENTS, CATEGORIES, CITIES } from './home-content';

describe('formatPrice', () => {
  it('renders a "from" price with the currency', () => {
    expect(formatPrice(150, 'MAD', 'en')).toBe('From 150 MAD');
  });
  it('renders free events as "Free"', () => {
    expect(formatPrice(0, 'MAD', 'en')).toBe('Free');
    expect(formatPrice(null, 'MAD', 'en')).toBe('Free');
  });
  it('localizes the "from" label in French', () => {
    expect(formatPrice(150, 'MAD', 'fr')).toBe('Dès 150 MAD');
  });
});

describe('formatEventDate', () => {
  it('formats an ISO date for the given locale', () => {
    expect(formatEventDate('2026-09-12', 'en')).toBe('Sep 12, 2026');
  });
});

describe('curated data integrity', () => {
  it('every event has a category that exists in CATEGORIES', () => {
    const keys = new Set(CATEGORIES.map((c) => c.key));
    for (const e of EVENTS) expect(keys.has(e.category)).toBe(true);
  });
  it('every event has a city that exists in CITIES', () => {
    const keys = new Set(CITIES.map((c) => c.key));
    for (const e of EVENTS) expect(keys.has(e.city)).toBe(true);
  });
});
```

- [ ] **Step 5: Run it to verify it fails.** Run: `cd web; npm run test`
Expected: FAIL — `home-content` module not found.

- [ ] **Step 6: Create `web/src/lib/home-content.ts`:**

```ts
/**
 * Curated placeholder content for the events home page.
 * Swap for real API data (BFF proxy) in a later pass — the shapes below
 * are the contract the home sections render against.
 */

export type CategoryKey =
  | 'music' | 'festivals' | 'sports' | 'culture' | 'food' | 'nightlife' | 'workshops' | 'family';

export type CityKey =
  | 'marrakech' | 'casablanca' | 'rabat' | 'fes' | 'tanger' | 'essaouira';

export interface Category { key: CategoryKey; /** hue used for the tinted badge */ color: string; }
export interface City { key: CityKey; name: string; nameAr: string; eventCount: number; }
export interface EventItem {
  id: string;
  title: string;
  category: CategoryKey;
  city: CityKey;
  /** ISO date (YYYY-MM-DD) */
  date: string;
  /** lowest ticket price; 0 or null = free */
  priceFrom: number | null;
  currency: string;
  /** placeholder tint token consumed by <Media>; real image path later */
  tint: 'blue' | 'gold' | 'red' | 'sand' | 'night';
  featured?: boolean;
}

export interface Stat { key: string; to: number; suffix: string; }

export const CATEGORIES: Category[] = [
  { key: 'music',     color: '#0055A4' },
  { key: 'festivals', color: '#AA131F' },
  { key: 'sports',    color: '#1E6B52' },
  { key: 'culture',   color: '#7B5800' },
  { key: 'food',      color: '#B84A00' },
  { key: 'nightlife', color: '#5B21B6' },
  { key: 'workshops', color: '#0E7490' },
  { key: 'family',    color: '#9D174D' },
];

export const CITIES: City[] = [
  { key: 'marrakech',  name: 'Marrakech',  nameAr: 'مراكش',    eventCount: 68 },
  { key: 'casablanca', name: 'Casablanca', nameAr: 'الدار البيضاء', eventCount: 74 },
  { key: 'rabat',      name: 'Rabat',      nameAr: 'الرباط',    eventCount: 41 },
  { key: 'fes',        name: 'Fès',        nameAr: 'فاس',       eventCount: 33 },
  { key: 'tanger',     name: 'Tanger',     nameAr: 'طنجة',      eventCount: 29 },
  { key: 'essaouira',  name: 'Essaouira',  nameAr: 'الصويرة',   eventCount: 18 },
];

export const EVENTS: EventItem[] = [
  { id: 'mawazine',   title: 'Mawazine — Rhythms of the World', category: 'festivals', city: 'rabat',      date: '2026-06-19', priceFrom: 0,   currency: 'MAD', tint: 'red',   featured: true },
  { id: 'gnaoua',     title: 'Gnaoua World Music Festival',      category: 'music',     city: 'essaouira',  date: '2026-06-25', priceFrom: 0,   currency: 'MAD', tint: 'blue',  featured: true },
  { id: 'jazzablanca',title: 'Jazzablanca',                      category: 'music',     city: 'casablanca', date: '2026-07-03', priceFrom: 250, currency: 'MAD', tint: 'night', featured: true },
  { id: 'rire',       title: 'Marrakech du Rire',                category: 'culture',   city: 'marrakech',  date: '2026-06-14', priceFrom: 180, currency: 'MAD', tint: 'sand',  featured: true },
  { id: 'derby',      title: 'Botola Derby — Raja vs Wydad',     category: 'sports',    city: 'casablanca', date: '2026-05-30', priceFrom: 120, currency: 'MAD', tint: 'blue',  featured: true },
  { id: 'sacred',     title: 'Fès Festival of Sacred Music',     category: 'culture',   city: 'fes',        date: '2026-05-16', priceFrom: 200, currency: 'MAD', tint: 'gold',  featured: true },
  { id: 'lboulevard', title: "L'Boulevard Festival",             category: 'music',     city: 'casablanca', date: '2026-09-12', priceFrom: 150, currency: 'MAD', tint: 'night' },
  { id: 'tanjazz',    title: 'Tanjazz — Tangier Jazz Festival',  category: 'music',     city: 'tanger',     date: '2026-09-19', priceFrom: 200, currency: 'MAD', tint: 'blue'  },
];

export const STATS: Stat[] = [
  { key: 'events',  to: 240, suffix: '+' },
  { key: 'cities',  to: 18,  suffix: ''  },
  { key: 'tickets', to: 50,  suffix: 'K' },
  { key: 'rating',  to: 4.9, suffix: ''  },
];

const FROM_LABEL: Record<string, string> = { fr: 'Dès', ar: 'من', en: 'From' };
const FREE_LABEL: Record<string, string> = { fr: 'Gratuit', ar: 'مجاني', en: 'Free' };

export function formatPrice(from: number | null, currency: string, locale: string): string {
  if (from === null || from === 0) return FREE_LABEL[locale] ?? FREE_LABEL.en;
  const label = FROM_LABEL[locale] ?? FROM_LABEL.en;
  return `${label} ${from} ${currency}`;
}

export function formatEventDate(iso: string, locale: string): string {
  const bcp = locale === 'ar' ? 'ar-MA' : locale === 'fr' ? 'fr-MA' : 'en-US';
  return new Intl.DateTimeFormat(bcp, { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(`${iso}T00:00:00`));
}
```

- [ ] **Step 7: Run the tests to verify they pass.** Run: `cd web; npm run test`
Expected: PASS (all suites). If `formatEventDate` locale output differs by ICU version, assert with a regex `/Sep 12, 2026/` — but the fixed `en-US` short format is stable.

- [ ] **Step 8: Commit**

```bash
git add web/package.json web/package-lock.json web/vitest.config.ts web/src/lib/home-content.ts web/src/lib/home-content.test.ts
git commit -m "feat(web): add curated home content module + Vitest helpers"
```

---

### Task 4: Add the `home` dictionary to i18n

**Files:**
- Modify: `web/src/lib/i18n.ts` — add a `home` object to each of `fr`, `ar`, `en` inside `translations`.

**Interfaces:**
- Consumes: existing `translations` shape (`nav`, `events`, `dates`).
- Produces: `t.home.*` keys used by every section. Because `Translations` is typed from `translations.fr`, add the SAME keys to all three locales.

- [ ] **Step 1: Add this `home` block to `translations.fr`** (after the `dates` object, before the closing `},` of `fr`):

```ts
    home: {
      navEvents: 'Événements', navCategories: 'Catégories', navCities: 'Villes', navOrganizers: 'Organisateurs',
      signIn: 'Connexion', explore: 'Explorer les événements',
      heroEyebrow: 'Billetterie · Maroc',
      heroTitle: 'Les événements du Maroc —', heroTitleAccent: 'de la médina à la grande scène',
      heroLead: 'Découvrez concerts, festivals, matchs et culture à travers le Royaume. Réservez des billets sécurisés en quelques secondes.',
      searchPlaceholder: 'Rechercher un événement, une ville…',
      catTitle: 'Parcourir par catégorie', catLead: 'Trouvez votre prochaine sortie par envie.',
      cat_music: 'Musique', cat_festivals: 'Festivals', cat_sports: 'Sport', cat_culture: 'Culture & Arts',
      cat_food: 'Gastronomie', cat_nightlife: 'Vie nocturne', cat_workshops: 'Ateliers', cat_family: 'Famille',
      featEyebrow: 'À la une', featTitle: 'Événements à ne pas manquer', viewAll: 'Voir tout',
      cityEyebrow: 'Destinations', cityTitle: 'Explorez par ville', cityCount: 'événements',
      howEyebrow: 'Simple et sûr', howTitle: 'Comment ça marche',
      how1Title: 'Découvrez', how1Body: 'Filtrez par ville, date, catégorie et prix pour trouver l’événement idéal.',
      how2Title: 'Réservez en sécurité', how2Body: 'Paiement protégé par Stripe, cartes et PayPal. Reçu envoyé par e-mail.',
      how3Title: 'Scannez votre billet', how3Body: 'Un QR code signé, scanné à l’entrée. Rapide, sans fraude, sans papier.',
      trustEyebrow: 'Pourquoi Morocco360', trustTitle: 'La confiance, à chaque étape',
      trustSecure: 'Paiements sécurisés', trustInstant: 'Billets instantanés', trustVerified: 'Organisateurs vérifiés',
      statEvents: 'Événements', statCities: 'Villes', statTickets: 'Billets réservés', statRating: 'Note moyenne',
      orgEyebrow: 'Pour les organisateurs', orgTitle: 'Vendez vos billets sur Morocco360',
      orgBody: 'Publiez votre événement, vendez en ligne, scannez à l’entrée et suivez vos ventes en temps réel.',
      orgCta: 'Devenir organisateur',
      ctaTitle: 'Votre prochaine expérience est à un clic',
      ctaBody: 'Créez un compte gratuit et réservez vos billets partout au Maroc.',
      ctaPrimary: 'Créer un compte', ctaSecondary: 'Parcourir les événements',
      newsletterLabel: 'Recevez les meilleurs événements chaque semaine', newsletterPlaceholder: 'Votre e-mail', newsletterCta: 'S’abonner',
      footDiscover: 'Découvrir', footCompany: 'Entreprise', footSupport: 'Support', footLegal: 'Légal',
      footTagline: 'La billetterie des événements au Maroc.', footRights: 'Tous droits réservés.',
    },
```

- [ ] **Step 2: Add the same block to `translations.ar`** (Arabic; have a native speaker verify before launch):

```ts
    home: {
      navEvents: 'الفعاليات', navCategories: 'الفئات', navCities: 'المدن', navOrganizers: 'المنظمون',
      signIn: 'تسجيل الدخول', explore: 'استكشف الفعاليات',
      heroEyebrow: 'التذاكر · المغرب',
      heroTitle: 'فعاليات المغرب —', heroTitleAccent: 'من المدينة العتيقة إلى المسرح الكبير',
      heroLead: 'اكتشف الحفلات والمهرجانات والمباريات والثقافة في جميع أنحاء المملكة. احجز تذاكر آمنة في ثوانٍ.',
      searchPlaceholder: 'ابحث عن فعالية أو مدينة…',
      catTitle: 'تصفح حسب الفئة', catLead: 'اعثر على وجهتك القادمة حسب رغبتك.',
      cat_music: 'موسيقى', cat_festivals: 'مهرجانات', cat_sports: 'رياضة', cat_culture: 'ثقافة وفنون',
      cat_food: 'طعام', cat_nightlife: 'الحياة الليلية', cat_workshops: 'ورشات', cat_family: 'عائلة',
      featEyebrow: 'المميزة', featTitle: 'فعاليات لا تفوّتها', viewAll: 'عرض الكل',
      cityEyebrow: 'الوجهات', cityTitle: 'استكشف حسب المدينة', cityCount: 'فعاليات',
      howEyebrow: 'بسيط وآمن', howTitle: 'كيف تعمل',
      how1Title: 'اكتشف', how1Body: 'صفِّ حسب المدينة والتاريخ والفئة والسعر للعثور على الفعالية المناسبة.',
      how2Title: 'احجز بأمان', how2Body: 'دفع محمي عبر Stripe والبطاقات وPayPal. يصلك الإيصال بالبريد الإلكتروني.',
      how3Title: 'امسح تذكرتك', how3Body: 'رمز QR موقّع يُمسح عند المدخل. سريع، بلا تزوير، وبلا ورق.',
      trustEyebrow: 'لماذا Morocco360', trustTitle: 'الثقة في كل خطوة',
      trustSecure: 'مدفوعات آمنة', trustInstant: 'تذاكر فورية', trustVerified: 'منظمون موثوقون',
      statEvents: 'فعاليات', statCities: 'مدن', statTickets: 'تذاكر محجوزة', statRating: 'متوسط التقييم',
      orgEyebrow: 'للمنظمين', orgTitle: 'بع تذاكرك على Morocco360',
      orgBody: 'انشر فعاليتك، بِع عبر الإنترنت، امسح عند المدخل وتابع مبيعاتك في الوقت الفعلي.',
      orgCta: 'كن منظمًا',
      ctaTitle: 'تجربتك القادمة على بُعد نقرة',
      ctaBody: 'أنشئ حسابًا مجانيًا واحجز تذاكرك في كل أنحاء المغرب.',
      ctaPrimary: 'إنشاء حساب', ctaSecondary: 'تصفح الفعاليات',
      newsletterLabel: 'استقبل أفضل الفعاليات كل أسبوع', newsletterPlaceholder: 'بريدك الإلكتروني', newsletterCta: 'اشترك',
      footDiscover: 'اكتشف', footCompany: 'الشركة', footSupport: 'الدعم', footLegal: 'قانوني',
      footTagline: 'منصة تذاكر الفعاليات في المغرب.', footRights: 'جميع الحقوق محفوظة.',
    },
```

- [ ] **Step 3: Add the same block to `translations.en`:**

```ts
    home: {
      navEvents: 'Events', navCategories: 'Categories', navCities: 'Cities', navOrganizers: 'Organizers',
      signIn: 'Sign in', explore: 'Explore events',
      heroEyebrow: 'Ticketing · Morocco',
      heroTitle: 'Morocco’s events —', heroTitleAccent: 'from the medina to the main stage',
      heroLead: 'Discover concerts, festivals, matches and culture across the Kingdom. Book secure tickets in seconds.',
      searchPlaceholder: 'Search for an event, a city…',
      catTitle: 'Browse by category', catLead: 'Find your next outing by mood.',
      cat_music: 'Music', cat_festivals: 'Festivals', cat_sports: 'Sports', cat_culture: 'Culture & Arts',
      cat_food: 'Food', cat_nightlife: 'Nightlife', cat_workshops: 'Workshops', cat_family: 'Family',
      featEyebrow: 'Featured', featTitle: 'Events you can’t miss', viewAll: 'View all',
      cityEyebrow: 'Destinations', cityTitle: 'Explore by city', cityCount: 'events',
      howEyebrow: 'Simple & secure', howTitle: 'How it works',
      how1Title: 'Discover', how1Body: 'Filter by city, date, category and price to find the perfect event.',
      how2Title: 'Book securely', how2Body: 'Payments protected by Stripe, cards and PayPal. Receipt emailed instantly.',
      how3Title: 'Scan your ticket', how3Body: 'A signed QR code, scanned at the gate. Fast, fraud-proof, paperless.',
      trustEyebrow: 'Why Morocco360', trustTitle: 'Trust at every step',
      trustSecure: 'Secure payments', trustInstant: 'Instant tickets', trustVerified: 'Verified organizers',
      statEvents: 'Events', statCities: 'Cities', statTickets: 'Tickets booked', statRating: 'Average rating',
      orgEyebrow: 'For organizers', orgTitle: 'Sell your tickets on Morocco360',
      orgBody: 'Publish your event, sell online, scan at the door and track sales in real time.',
      orgCta: 'Become an organizer',
      ctaTitle: 'Your next experience is one tap away',
      ctaBody: 'Create a free account and book tickets anywhere in Morocco.',
      ctaPrimary: 'Create an account', ctaSecondary: 'Browse events',
      newsletterLabel: 'Get the best events every week', newsletterPlaceholder: 'Your email', newsletterCta: 'Subscribe',
      footDiscover: 'Discover', footCompany: 'Company', footSupport: 'Support', footLegal: 'Legal',
      footTagline: 'The events ticketing platform for Morocco.', footRights: 'All rights reserved.',
    },
```

- [ ] **Step 4: Verify types line up.** Run: `cd web; npx tsc --noEmit`
Expected: no errors (all three locales share the same `home` keys, so `Translations` stays consistent).

- [ ] **Step 5: Commit**

```bash
git add web/src/lib/i18n.ts
git commit -m "feat(web): add home dictionary (fr/ar/en)"
```

---

### Task 5: Parametrize `PremiumSearch` for events (keep tourism defaults)

**Files:**
- Modify: `web/src/components/PremiumSearch.tsx`

**Interfaces:**
- Produces: `PremiumSearch` now accepts optional props `{ placeholder?: string; categories?: string[]; suggestions?: string[] }`. Existing call sites keep working (defaults = current tourism arrays).

- [ ] **Step 1: Replace the top-of-file constants + signature.** Change lines 5-21 so the hardcoded arrays become defaults and the component takes props:

```tsx
const DEFAULT_CATEGORIES = ['All', 'Medinas', 'Desert', 'Coasts', 'Mountains', 'Cities'];

const DEFAULT_SUGGESTIONS = [
  'Marrakech medina at sunset',
  'Sahara desert panorama',
  'Chefchaouen blue streets',
  'Fez ancient tanneries',
  'Atlas Mountains peaks',
  'Essaouira coastal breeze',
  'Ouarzazate kasbahs',
];

interface Props {
  placeholder?: string;
  categories?: string[];
  suggestions?: string[];
}

export default function PremiumSearch({
  placeholder = 'Search destinations, experiences… ⌘K',
  categories = DEFAULT_CATEGORIES,
  suggestions = DEFAULT_SUGGESTIONS,
}: Props = {}) {
  const [focused, setFocused] = useState(false);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(categories[0] ?? 'All');
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const filtered = query.length > 0
    ? suggestions.filter((s) => s.toLowerCase().includes(query.toLowerCase()))
    : suggestions.slice(0, 4);
```

- [ ] **Step 2: Use the `placeholder` prop** on the `<input>` (line ~97): change `placeholder="Search destinations, experiences… ⌘K"` to `placeholder={placeholder}`.

- [ ] **Step 3: Use `categories` in the pill map** (line ~149): change `{CATEGORIES.map((cat) => (` to `{categories.map((cat) => (`.

- [ ] **Step 4: Use `filtered` (already switched to `suggestions`)** — no further change; verify no remaining references to the old `CATEGORIES`/`SUGGESTIONS` names. Run: `cd web; npx tsc --noEmit`
Expected: no "cannot find name CATEGORIES/SUGGESTIONS" errors.

- [ ] **Step 5: Commit**

```bash
git add web/src/components/PremiumSearch.tsx
git commit -m "refactor(web): make PremiumSearch configurable via props"
```

---

### Task 6: CategoryBadge + Zellij primitives

**Files:**
- Create: `web/src/components/home/CategoryBadge.tsx`, `web/src/components/home/Zellij.tsx`

**Interfaces:**
- Produces:
  - `CategoryBadge({ label, color }: { label: string; color: string })` — a tinted pill (10% bg of `color`, `color` text).
  - `Zellij({ className, style })` — decorative SVG (`aria-hidden`), tiles an 8-point Moroccan star; inherits `currentColor`.

- [ ] **Step 1: Create `CategoryBadge.tsx`** (Server Component — no interactivity):

```tsx
export default function CategoryBadge({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="cat-badge"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 10px',
        borderRadius: 999,
        fontFamily: 'var(--font-work-sans), system-ui',
        fontWeight: 600,
        fontSize: '0.6875rem',
        letterSpacing: '0.03em',
        // 10% tint background of the category color, full-strength text (DESIGN.md badges)
        background: `color-mix(in srgb, ${color} 12%, transparent)`,
        color,
      }}
    >
      {label}
    </span>
  );
}
```

- [ ] **Step 2: Create `Zellij.tsx`** (decorative SVG motif, tiled via a pattern):

```tsx
export default function Zellij({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} aria-hidden="true" focusable="false" width="100%" height="100%">
      <defs>
        <pattern id="zellij" width="48" height="48" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <path
            d="M24 4 L30 18 L44 24 L30 30 L24 44 L18 30 L4 24 L18 18 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          />
          <circle cx="24" cy="24" r="3" fill="none" stroke="currentColor" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#zellij)" />
    </svg>
  );
}
```

- [ ] **Step 3: Verify.** Run: `cd web; npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add web/src/components/home/CategoryBadge.tsx web/src/components/home/Zellij.tsx
git commit -m "feat(web): add CategoryBadge + Zellij motif primitives"
```

---

### Task 7: EventCard

**Files:**
- Create: `web/src/components/home/EventCard.tsx`

**Interfaces:**
- Consumes: `EventItem` (Task 3), `formatPrice`/`formatEventDate` (Task 3), `CategoryBadge` (Task 6), `SpotlightCard` (existing), the `<Media>` component pattern (existing `web/src/components/cinema/Media.tsx`).
- Produces: `EventCard({ event, categoryLabel, cityName, locale }: { event: EventItem; categoryLabel: string; cityName: string; locale: string })`.

- [ ] **Step 1: Create `EventCard.tsx`.** Uses the existing `SpotlightCard` shell for hover, `.evt-*` classes for chrome, and a branded gradient placeholder for media (real images later). No `"use client"` here — `SpotlightCard` is the only client piece and is imported as a child:

```tsx
import Link from 'next/link';
import SpotlightCard from '@/components/SpotlightCard';
import CategoryBadge from './CategoryBadge';
import { formatPrice, formatEventDate, type EventItem } from '@/lib/home-content';

const TINT: Record<EventItem['tint'], string> = {
  blue:  'linear-gradient(135deg, #003E7A, #0055A4)',
  gold:  'linear-gradient(135deg, #7B5800, #FDBB24)',
  red:   'linear-gradient(135deg, #820011, #AA131F)',
  sand:  'linear-gradient(135deg, #B84A00, #E08A3C)',
  night: 'linear-gradient(135deg, #0A1017, #22303D)',
};

export default function EventCard({
  event, categoryLabel, cityName, locale,
}: { event: EventItem; categoryLabel: string; cityName: string; locale: string }) {
  const category = CATEGORY_COLOR[event.category];
  return (
    <SpotlightCard className="evt-card" style={{ display: 'flex', flexDirection: 'column' }}>
      <Link href={`/events/${event.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div className="evt-media" style={{ background: TINT[event.tint] }}>
          <span className="price-badge">{formatPrice(event.priceFrom, event.currency, locale)}</span>
        </div>
        <div className="evt-body">
          <CategoryBadge label={categoryLabel} color={category} />
          <h3 className="evt-title">{event.title}</h3>
          <div className="evt-meta">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11Z"/><circle cx="12" cy="10" r="2.5"/></svg>
            <span>{cityName}</span>
            <span aria-hidden="true">·</span>
            <span>{formatEventDate(event.date, locale)}</span>
          </div>
        </div>
      </Link>
    </SpotlightCard>
  );
}

const CATEGORY_COLOR: Record<EventItem['category'], string> = {
  music: '#0055A4', festivals: '#AA131F', sports: '#1E6B52', culture: '#7B5800',
  food: '#B84A00', nightlife: '#5B21B6', workshops: '#0E7490', family: '#9D174D',
};
```

- [ ] **Step 2: Verify.** Run: `cd web; npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add web/src/components/home/EventCard.tsx
git commit -m "feat(web): add EventCard"
```

---

### Task 8: HomeNav (client, glass-on-scroll)

**Files:**
- Create: `web/src/components/home/HomeNav.tsx`

**Interfaces:**
- Consumes: `useLocale` (existing), `ThemeToggle` + `LocaleSwitcher` (existing).
- Produces: `HomeNav()` — sticky nav; toggles `.scrolled` past 24px.

- [ ] **Step 1: Create `HomeNav.tsx`:**

```tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLocale } from '@/components/LocaleProvider';
import ThemeToggle from '@/components/ThemeToggle';
import LocaleSwitcher from '@/components/LocaleSwitcher';

export default function HomeNav() {
  const { t } = useLocale();
  const h = t.home;
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`home-nav${scrolled ? ' scrolled' : ''}`}>
      <nav className="home-section" style={{ display: 'flex', alignItems: 'center', gap: 24, height: 68 }}>
        <Link href="/" style={{ fontFamily: 'var(--font-jakarta), system-ui', fontWeight: 800, fontSize: '1.15rem', letterSpacing: '-0.02em', color: 'var(--foreground)', textDecoration: 'none' }}>
          Morocco<span style={{ color: 'var(--primary)' }}>360</span>
        </Link>
        <div style={{ display: 'flex', gap: 22, marginInlineStart: 12 }} className="home-nav-links">
          {[['/events', h.navEvents], ['#categories', h.navCategories], ['#cities', h.navCities], ['#organizers', h.navOrganizers]].map(([href, label]) => (
            <Link key={href} href={href} style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--foreground-dim)', textDecoration: 'none' }}>{label}</Link>
          ))}
        </div>
        <div style={{ marginInlineStart: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <LocaleSwitcher />
          <ThemeToggle />
          <Link href="/login" style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--foreground)', textDecoration: 'none' }}>{h.signIn}</Link>
          <Link href="/register" className="btn-primary" style={{ padding: '9px 18px' }}>{h.explore}</Link>
        </div>
      </nav>
    </header>
  );
}
```

- [ ] **Step 2: Add a responsive rule** to hide the middle links on small screens — append to `globals.css`:

```css
@media (max-width: 860px) { .home-nav-links { display: none !important; } }
```

- [ ] **Step 3: Verify.** Run: `cd web; npx tsc --noEmit`
Expected: no errors. (Confirm `ThemeToggle`/`LocaleSwitcher` default-export names match; if a named export, adjust the import.)

- [ ] **Step 4: Commit**

```bash
git add web/src/components/home/HomeNav.tsx web/src/app/globals.css
git commit -m "feat(web): add events HomeNav"
```

---

### Task 9: HomeHero (search-first)

**Files:**
- Create: `web/src/components/home/HomeHero.tsx`

**Interfaces:**
- Consumes: `getTranslations` (existing), `PremiumSearch` (Task 5), `Zellij` (Task 6), curated `CATEGORIES` + dictionary labels.
- Produces: `HomeHero({ locale }: { locale: Locale })` — Server Component; renders `PremiumSearch` (client) as a child.

- [ ] **Step 1: Create `HomeHero.tsx`:**

```tsx
import PremiumSearch from '@/components/PremiumSearch';
import Zellij from './Zellij';
import { getTranslations, type Locale } from '@/lib/i18n';
import { CATEGORIES } from '@/lib/home-content';

export default function HomeHero({ locale }: { locale: Locale }) {
  const t = getTranslations(locale);
  const h = t.home;
  const catLabel = (key: string) => (h as Record<string, string>)[`cat_${key}`];
  const chips = CATEGORIES.slice(0, 6).map((c) => catLabel(c.key));

  return (
    <section style={{ position: 'relative', overflow: 'hidden' }}>
      <Zellij style={{ position: 'absolute', inset: 0, color: 'var(--primary)', opacity: 0.04, pointerEvents: 'none' }} />
      <div className="home-section" style={{ position: 'relative', paddingBlock: 'clamp(56px, 11vh, 128px)', textAlign: 'center' }}>
        <div className="eyebrow" style={{ justifyContent: 'center', marginBottom: 22 }}>{h.heroEyebrow}</div>
        <h1 className="h-display" style={{ fontSize: 'clamp(2.2rem, 6vw, 4.25rem)', maxWidth: '18ch', marginInline: 'auto' }}>
          {h.heroTitle}{' '}
          <span style={{ color: 'var(--primary)' }}>{h.heroTitleAccent}</span>
        </h1>
        <p className="h-lead" style={{ marginInline: 'auto', marginTop: 22, textAlign: 'center' }}>{h.heroLead}</p>

        <div style={{ marginTop: 38 }}>
          <PremiumSearch placeholder={`${h.searchPlaceholder}  ⌘K`} categories={[t.events.allCategories, ...chips]} suggestions={[]} />
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginTop: 24 }}>
          {chips.map((label) => (
            <span key={label} style={{ padding: '7px 14px', borderRadius: 999, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--foreground-dim)' }}>{label}</span>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify.** Run: `cd web; npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add web/src/components/home/HomeHero.tsx
git commit -m "feat(web): add search-first HomeHero"
```

---

### Task 10: CategoryBrowse

**Files:**
- Create: `web/src/components/home/CategoryBrowse.tsx`

**Interfaces:**
- Consumes: `getTranslations`, `CATEGORIES`, `StaggerReveal` (existing), category icons.
- Produces: `CategoryBrowse({ locale }: { locale: Locale })`.

- [ ] **Step 1: Create `CategoryBrowse.tsx`:**

```tsx
import Link from 'next/link';
import StaggerReveal from '@/components/StaggerReveal';
import { getTranslations, type Locale } from '@/lib/i18n';
import { CATEGORIES } from '@/lib/home-content';

const ICON: Record<string, string> = {
  music: 'M9 18V5l12-2v13', festivals: 'M3 21h18M6 21V8l6-4 6 4v13',
  sports: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z', culture: 'M4 20h16M6 20V9l6-5 6 5v11',
  food: 'M4 3v7a3 3 0 0 0 6 0V3M7 3v18M17 3c-2 0-3 2-3 5s1 5 3 5', nightlife: 'M12 3a9 9 0 1 0 9 9 7 7 0 0 1-9-9Z',
  workshops: 'M3 21l3-8 8-8 5 5-8 8-8 3Z', family: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21a8 8 0 0 1 16 0',
};

export default function CategoryBrowse({ locale }: { locale: Locale }) {
  const h = getTranslations(locale).home;
  const label = (key: string) => (h as Record<string, string>)[`cat_${key}`];
  return (
    <section id="categories" className="home-section section-gap">
      <div className="eyebrow" style={{ marginBottom: 14 }}>{h.navCategories}</div>
      <h2 className="h-title" style={{ fontSize: 'clamp(1.6rem, 3.4vw, 2.4rem)', marginBottom: 8 }}>{h.catTitle}</h2>
      <p className="h-lead" style={{ marginBottom: 30 }}>{h.catLead}</p>
      <StaggerReveal
        itemSelector=".cat-tile"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 14 }}
      >
        {CATEGORIES.map((c) => (
          <Link key={c.key} href={`/events?category=${c.key}`} className="cat-tile">
            <span style={{ width: 40, height: 40, borderRadius: 10, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: `color-mix(in srgb, ${c.color} 12%, transparent)`, color: c.color }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d={ICON[c.key]} /></svg>
            </span>
            <span style={{ fontFamily: 'var(--font-jakarta), system-ui', fontWeight: 700, fontSize: '0.95rem', color: 'var(--foreground)' }}>{label(c.key)}</span>
          </Link>
        ))}
      </StaggerReveal>
    </section>
  );
}
```

- [ ] **Step 2: Verify.** Run: `cd web; npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add web/src/components/home/CategoryBrowse.tsx
git commit -m "feat(web): add CategoryBrowse section"
```

---

### Task 11: FeaturedEvents

**Files:**
- Create: `web/src/components/home/FeaturedEvents.tsx`

**Interfaces:**
- Consumes: `getTranslations`, `EVENTS`/`CITIES`, `EventCard` (Task 7), `StaggerReveal`.
- Produces: `FeaturedEvents({ locale }: { locale: Locale })`.

- [ ] **Step 1: Create `FeaturedEvents.tsx`:**

```tsx
import Link from 'next/link';
import StaggerReveal from '@/components/StaggerReveal';
import EventCard from './EventCard';
import { getTranslations, type Locale } from '@/lib/i18n';
import { EVENTS, CITIES } from '@/lib/home-content';

export default function FeaturedEvents({ locale }: { locale: Locale }) {
  const h = getTranslations(locale).home;
  const catLabel = (key: string) => (h as Record<string, string>)[`cat_${key}`];
  const cityName = (key: string) => {
    const c = CITIES.find((x) => x.key === key)!;
    return locale === 'ar' ? c.nameAr : c.name;
  };
  const featured = EVENTS.filter((e) => e.featured);

  return (
    <section className="home-section section-gap">
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 14 }}>{h.featEyebrow}</div>
          <h2 className="h-title" style={{ fontSize: 'clamp(1.6rem, 3.4vw, 2.4rem)' }}>{h.featTitle}</h2>
        </div>
        <Link href="/events" className="btn-secondary">{h.viewAll} →</Link>
      </div>
      <StaggerReveal
        itemSelector=".evt-card"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}
      >
        {featured.map((e) => (
          <EventCard key={e.id} event={e} categoryLabel={catLabel(e.category)} cityName={cityName(e.city)} locale={locale} />
        ))}
      </StaggerReveal>
    </section>
  );
}
```

- [ ] **Step 2: Verify.** Run: `cd web; npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add web/src/components/home/FeaturedEvents.tsx
git commit -m "feat(web): add FeaturedEvents grid"
```

---

### Task 12: CityGrid

**Files:**
- Create: `web/src/components/home/CityGrid.tsx`

**Interfaces:**
- Consumes: `getTranslations`, `CITIES`, `StaggerReveal`.
- Produces: `CityGrid({ locale }: { locale: Locale })`.

- [ ] **Step 1: Create `CityGrid.tsx`** (branded gradient placeholders per city until real photos land):

```tsx
import Link from 'next/link';
import StaggerReveal from '@/components/StaggerReveal';
import { getTranslations, type Locale } from '@/lib/i18n';
import { CITIES, type CityKey } from '@/lib/home-content';

const CITY_TINT: Record<CityKey, string> = {
  marrakech: 'linear-gradient(135deg, #B84A00, #E08A3C)',
  casablanca: 'linear-gradient(135deg, #003E7A, #0055A4)',
  rabat: 'linear-gradient(135deg, #1E6B52, #2A8060)',
  fes: 'linear-gradient(135deg, #7B5800, #FDBB24)',
  tanger: 'linear-gradient(135deg, #0E7490, #22A5C0)',
  essaouira: 'linear-gradient(135deg, #22303D, #4A6072)',
};

export default function CityGrid({ locale }: { locale: Locale }) {
  const h = getTranslations(locale).home;
  return (
    <section id="cities" className="home-section section-gap">
      <div className="eyebrow" style={{ marginBottom: 14 }}>{h.cityEyebrow}</div>
      <h2 className="h-title" style={{ fontSize: 'clamp(1.6rem, 3.4vw, 2.4rem)', marginBottom: 30 }}>{h.cityTitle}</h2>
      <StaggerReveal
        itemSelector=".city-tile"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}
      >
        {CITIES.map((c) => (
          <Link key={c.key} href={`/events?city=${c.key}`} className="city-tile" style={{ background: CITY_TINT[c.key] }} aria-label={`${locale === 'ar' ? c.nameAr : c.name} — ${c.eventCount} ${h.cityCount}`}>
            <div style={{ position: 'absolute', insetInline: 16, bottom: 14, zIndex: 1, color: '#fff' }}>
              <div style={{ fontFamily: 'var(--font-jakarta), system-ui', fontWeight: 700, fontSize: '1.15rem' }}>{locale === 'ar' ? c.nameAr : c.name}</div>
              <div style={{ fontSize: '0.8125rem', opacity: 0.85 }}>{c.eventCount} {h.cityCount}</div>
            </div>
          </Link>
        ))}
      </StaggerReveal>
    </section>
  );
}
```

- [ ] **Step 2: Verify.** Run: `cd web; npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add web/src/components/home/CityGrid.tsx
git commit -m "feat(web): add CityGrid section"
```

---

### Task 13: HowItWorks

**Files:**
- Create: `web/src/components/home/HowItWorks.tsx`

**Interfaces:**
- Consumes: `getTranslations`, `StaggerReveal`.
- Produces: `HowItWorks({ locale }: { locale: Locale })`.

- [ ] **Step 1: Create `HowItWorks.tsx`:**

```tsx
import StaggerReveal from '@/components/StaggerReveal';
import { getTranslations, type Locale } from '@/lib/i18n';

export default function HowItWorks({ locale }: { locale: Locale }) {
  const h = getTranslations(locale).home;
  const steps = [
    { n: '01', title: h.how1Title, body: h.how1Body },
    { n: '02', title: h.how2Title, body: h.how2Body },
    { n: '03', title: h.how3Title, body: h.how3Body },
  ];
  return (
    <section style={{ background: 'var(--surface-2)' }}>
      <div className="home-section section-gap">
        <div className="eyebrow" style={{ marginBottom: 14 }}>{h.howEyebrow}</div>
        <h2 className="h-title" style={{ fontSize: 'clamp(1.6rem, 3.4vw, 2.4rem)', marginBottom: 30 }}>{h.howTitle}</h2>
        <StaggerReveal itemSelector=".how-step" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
          {steps.map((s) => (
            <div key={s.n} className="how-step" style={{ padding: 24, borderRadius: 14, background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div style={{ fontFamily: 'var(--font-jakarta), system-ui', fontWeight: 800, fontSize: '1.4rem', color: 'var(--primary)', marginBottom: 12 }}>{s.n}</div>
              <h3 className="h-title" style={{ fontSize: '1.15rem', marginBottom: 8 }}>{s.title}</h3>
              <p style={{ fontSize: '0.95rem', lineHeight: 1.6, color: 'var(--foreground-dim)' }}>{s.body}</p>
            </div>
          ))}
        </StaggerReveal>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify.** Run: `cd web; npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add web/src/components/home/HowItWorks.tsx
git commit -m "feat(web): add HowItWorks section"
```

---

### Task 14: TrustStats

**Files:**
- Create: `web/src/components/home/TrustStats.tsx`

**Interfaces:**
- Consumes: `getTranslations`, `STATS`, `AnimatedCounter` (existing).
- Produces: `TrustStats({ locale }: { locale: Locale })`.

- [ ] **Step 1: Create `TrustStats.tsx`:**

```tsx
import AnimatedCounter from '@/components/AnimatedCounter';
import { getTranslations, type Locale } from '@/lib/i18n';
import { STATS } from '@/lib/home-content';

export default function TrustStats({ locale }: { locale: Locale }) {
  const h = getTranslations(locale).home;
  const labels: Record<string, string> = { events: h.statEvents, cities: h.statCities, tickets: h.statTickets, rating: h.statRating };
  const trust = [h.trustSecure, h.trustInstant, h.trustVerified];

  return (
    <section className="home-section section-gap">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 20, marginBottom: 32 }}>
        {STATS.map((s) => (
          <div key={s.key} style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-jakarta), system-ui', fontWeight: 800, fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', color: 'var(--foreground)' }}>
              <AnimatedCounter to={s.to} suffix={s.suffix} decimals={s.key === 'rating' ? 1 : 0} />
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: 4 }}>{labels[s.key]}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center' }}>
        {trust.map((label) => (
          <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 999, background: 'var(--success-bg)', color: 'var(--success)', fontSize: '0.85rem', fontWeight: 600 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>
            {label}
          </span>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify.** Run: `cd web; npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add web/src/components/home/TrustStats.tsx
git commit -m "feat(web): add TrustStats band"
```

---

### Task 15: OrganizerCTA + FinalCTA

**Files:**
- Create: `web/src/components/home/OrganizerCTA.tsx`, `web/src/components/home/FinalCTA.tsx`

**Interfaces:**
- Consumes: `getTranslations`, `Zellij` (Task 6).
- Produces: `OrganizerCTA({ locale })`, `FinalCTA({ locale })`.

- [ ] **Step 1: Create `OrganizerCTA.tsx`:**

```tsx
import Link from 'next/link';
import { getTranslations, type Locale } from '@/lib/i18n';

export default function OrganizerCTA({ locale }: { locale: Locale }) {
  const h = getTranslations(locale).home;
  return (
    <section id="organizers" className="home-section section-gap">
      <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'minmax(0,1fr)', alignItems: 'center', padding: 'clamp(28px, 5vw, 56px)', borderRadius: 20, background: 'var(--card-inverted-bg)', color: 'var(--card-inverted-text)' }}>
        <div className="eyebrow" style={{ color: 'var(--gold)' }}>{h.orgEyebrow}</div>
        <h2 className="h-title" style={{ color: 'var(--card-inverted-text)', fontSize: 'clamp(1.6rem, 3.6vw, 2.4rem)', maxWidth: '18ch' }}>{h.orgTitle}</h2>
        <p style={{ color: 'var(--card-inverted-muted)', fontSize: '1.02rem', lineHeight: 1.6, maxWidth: '52ch' }}>{h.orgBody}</p>
        <div><Link href="/register?role=organizer" className="btn-primary" style={{ background: 'var(--gold)', color: 'var(--on-gold)' }}>{h.orgCta} →</Link></div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Create `FinalCTA.tsx`** (includes newsletter capture; the form is inert placeholder — wire later):

```tsx
import Link from 'next/link';
import Zellij from './Zellij';
import { getTranslations, type Locale } from '@/lib/i18n';

export default function FinalCTA({ locale }: { locale: Locale }) {
  const h = getTranslations(locale).home;
  return (
    <section style={{ position: 'relative', overflow: 'hidden', background: 'var(--surface-2)' }}>
      <Zellij style={{ position: 'absolute', inset: 0, color: 'var(--primary)', opacity: 0.04, pointerEvents: 'none' }} />
      <div className="home-section section-gap" style={{ position: 'relative', textAlign: 'center' }}>
        <h2 className="h-display" style={{ fontSize: 'clamp(1.9rem, 5vw, 3.2rem)', maxWidth: '20ch', marginInline: 'auto' }}>{h.ctaTitle}</h2>
        <p className="h-lead" style={{ marginInline: 'auto', marginTop: 18, textAlign: 'center' }}>{h.ctaBody}</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginTop: 28 }}>
          <Link href="/register" className="btn-primary">{h.ctaPrimary}</Link>
          <Link href="/events" className="btn-secondary">{h.ctaSecondary}</Link>
        </div>
        <form aria-label={h.newsletterLabel} style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginTop: 34 }} onSubmit={(e) => e.preventDefault()}>
          <input type="email" required placeholder={h.newsletterPlaceholder} aria-label={h.newsletterLabel}
            style={{ padding: '12px 18px', borderRadius: 999, border: '1.5px solid var(--input-border)', background: 'var(--input-bg)', color: 'var(--foreground)', minWidth: 260, fontFamily: 'var(--font-work-sans), system-ui' }} />
          <button type="submit" className="btn-primary">{h.newsletterCta}</button>
        </form>
      </div>
    </section>
  );
}
```

> Note: `FinalCTA` uses an `onSubmit` handler, so it needs `"use client"` at the top. Add `'use client';` as the first line of `FinalCTA.tsx`.

- [ ] **Step 3: Add `'use client';`** as the first line of `FinalCTA.tsx` (it has an event handler). `OrganizerCTA.tsx` stays a Server Component.

- [ ] **Step 4: Verify.** Run: `cd web; npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add web/src/components/home/OrganizerCTA.tsx web/src/components/home/FinalCTA.tsx
git commit -m "feat(web): add OrganizerCTA + FinalCTA"
```

---

### Task 16: HomeFooter

**Files:**
- Create: `web/src/components/home/HomeFooter.tsx`

**Interfaces:**
- Consumes: `getTranslations`, `Zellij`.
- Produces: `HomeFooter({ locale }: { locale: Locale })`.

- [ ] **Step 1: Create `HomeFooter.tsx`:**

```tsx
import Link from 'next/link';
import Zellij from './Zellij';
import { getTranslations, type Locale } from '@/lib/i18n';

export default function HomeFooter({ locale }: { locale: Locale }) {
  const h = getTranslations(locale).home;
  const cols: Array<[string, Array<[string, string]>]> = [
    [h.footDiscover, [[h.navEvents, '/events'], [h.navCategories, '#categories'], [h.navCities, '#cities']]],
    [h.footCompany, [['About', '/about'], [h.navOrganizers, '#organizers'], ['Careers', '/careers']]],
    [h.footSupport, [['Help', '/help'], ['Contact', '/contact'], ['Status', '/status']]],
    [h.footLegal, [['Terms', '/terms'], ['Privacy', '/privacy'], ['Cookies', '/cookies']]],
  ];
  return (
    <footer style={{ position: 'relative', overflow: 'hidden', background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
      <Zellij style={{ position: 'absolute', inset: 0, color: 'var(--foreground)', opacity: 0.02, pointerEvents: 'none' }} />
      <div className="home-section" style={{ position: 'relative', paddingBlock: 56, display: 'grid', gap: 40, gridTemplateColumns: 'minmax(220px, 1.4fr) repeat(4, minmax(120px, 1fr))' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-jakarta), system-ui', fontWeight: 800, fontSize: '1.15rem', color: 'var(--foreground)' }}>Morocco<span style={{ color: 'var(--primary)' }}>360</span></div>
          <p style={{ marginTop: 12, fontSize: '0.9rem', color: 'var(--muted)', maxWidth: '32ch' }}>{h.footTagline}</p>
        </div>
        {cols.map(([title, links]) => (
          <div key={title}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--foreground)', marginBottom: 14 }}>{title}</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 10 }}>
              {links.map(([label, href]) => (
                <li key={label}><Link href={href} style={{ fontSize: '0.875rem', color: 'var(--foreground-dim)', textDecoration: 'none' }}>{label}</Link></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="home-section" style={{ position: 'relative', paddingBottom: 32, fontSize: '0.8125rem', color: 'var(--muted)', borderTop: '1px solid var(--border)', paddingTop: 20 }}>
        © {new Date().getFullYear()} Morocco360. {h.footRights}
      </div>
    </footer>
  );
}
```

- [ ] **Step 2: Add a footer responsive rule** to `globals.css`:

```css
@media (max-width: 720px) { footer .home-section[style*="grid-template-columns"] { grid-template-columns: 1fr 1fr !important; } }
```

- [ ] **Step 3: Verify.** Run: `cd web; npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add web/src/components/home/HomeFooter.tsx web/src/app/globals.css
git commit -m "feat(web): add events HomeFooter"
```

---

### Task 17: Assemble `page.tsx` + retire cinema home + full verification

**Files:**
- Modify: `web/src/app/page.tsx` (full replace)

**Interfaces:**
- Consumes: every section (Tasks 8–16), `cookies` + i18n locale resolution.

- [ ] **Step 1: Replace `web/src/app/page.tsx` entirely:**

```tsx
import { cookies } from 'next/headers';
import { DEFAULT_LOCALE, LOCALES, LOCALE_COOKIE, type Locale } from '@/lib/i18n';
import HomeNav from '@/components/home/HomeNav';
import HomeHero from '@/components/home/HomeHero';
import CategoryBrowse from '@/components/home/CategoryBrowse';
import FeaturedEvents from '@/components/home/FeaturedEvents';
import CityGrid from '@/components/home/CityGrid';
import HowItWorks from '@/components/home/HowItWorks';
import TrustStats from '@/components/home/TrustStats';
import OrganizerCTA from '@/components/home/OrganizerCTA';
import FinalCTA from '@/components/home/FinalCTA';
import HomeFooter from '@/components/home/HomeFooter';

export default async function Home() {
  const raw = (await cookies()).get(LOCALE_COOKIE)?.value;
  const locale: Locale = LOCALES.includes(raw as Locale) ? (raw as Locale) : DEFAULT_LOCALE;

  return (
    <div>
      <HomeNav />
      <main>
        <HomeHero locale={locale} />
        <CategoryBrowse locale={locale} />
        <FeaturedEvents locale={locale} />
        <CityGrid locale={locale} />
        <HowItWorks locale={locale} />
        <TrustStats locale={locale} />
        <OrganizerCTA locale={locale} />
        <FinalCTA locale={locale} />
      </main>
      <HomeFooter locale={locale} />
    </div>
  );
}
```

- [ ] **Step 2: Confirm the cinema home is no longer referenced.** Run: `cd web; npx tsc --noEmit`
Expected: no errors. The `web/src/components/cinema/**` files are now unused (dead code, removed in a later cleanup pass — do NOT delete here).

- [ ] **Step 3: Run the full test + lint + build.** Run: `cd web; npm run test; npm run lint; npm run build`
Expected: tests PASS, lint clean, production build succeeds.

- [ ] **Step 4: Manual verification (all required).** Run: `cd web; npm run start` then open `http://localhost:4001/`:
  - Light mode: all 10 sections render; blue/gold/red palette; search opens; hover lifts on cards.
  - Toggle dark: everything legible, no green remnants, gold badges still readable.
  - Set locale to `ar` (LocaleSwitcher): page mirrors to RTL — chevrons/price badge flip to the correct side, Arabic copy shows.
  - Keyboard: Tab through nav → search → chips → cards; visible focus rings; ⌘K focuses search.

- [ ] **Step 5: Lighthouse (perf gate).** Use the `/lighthouse` skill against the running production build at `http://localhost:4001/`. Confirm LCP/TBT/CLS are healthy and not regressed versus the previous home. Record the numbers in the PR description.

- [ ] **Step 6: `/code-review`** the full diff; fix anything it flags (treat as a required gate).

- [ ] **Step 7: Commit**

```bash
git add web/src/app/page.tsx
git commit -m "feat(web): ship Imperial Trinity events home page"
```

---

## Phase 2 (separate, not in this plan): design-sync

Once the home + palette are merged, re-derive `ds-bundle/` from the Imperial Trinity system (colors, typography, buttons, inputs, event card, badges) and re-sync it to the Claude Design project `Morocco360 Design System` (`.design-sync/config.json`). This is an **outward push** requiring `/design-consent`; do not run it without explicit go-ahead. Track as its own spec/plan.

---

## Self-Review

**Spec coverage:**
- Retoken app-wide (light + derived dark), keep var names → Task 1. ✓
- Plus Jakarta Sans + Work Sans → Task 2. ✓
- Curated placeholder events → Task 3. ✓
- 10 sections (Nav, Hero, Categories, Featured, Cities, HowItWorks, Trust+Stats, Organizer, FinalCTA, Footer) → Tasks 8–16 + assembly 17. ✓
- Reuse PremiumSearch/SpotlightCard/AnimatedCounter/StaggerReveal → Tasks 5,7,11,14. ✓
- Zellij motif → Task 6 (used in Hero/FinalCTA/Footer). ✓
- Sahara-Gold price badge, tinted category badges, 8px/pill radii, 5% hover glow, glass → Tasks 1,6,7. ✓
- i18n fr/ar/en + RTL check → Tasks 4,17. ✓
- Both themes → Tasks 1,17. ✓
- a11y (focus, keyboard, reduced-motion) → Tasks 1,17. ✓
- Perf via Lighthouse on prod build → Task 17. ✓
- Metadata updated → Task 2. ✓
- Cinema retired (not deleted) → Task 17. ✓
- Design-sync deferred to Phase 2 with consent gate → noted. ✓

**Placeholder scan:** No TBD/TODO; every code step has complete code. Newsletter form is intentionally inert (documented), not a placeholder for missing logic.

**Type consistency:** `EventItem`/`Category`/`City`/`Stat`, `formatPrice`/`formatEventDate`, `CategoryKey`/`CityKey` names are used identically across Tasks 3, 7, 11, 12. Section components all share the `({ locale }: { locale: Locale })` signature (except `EventCard`, `CategoryBadge`, `HomeNav` which have their own documented props). Dictionary `home.*` keys added to all three locales in Task 4 match every `h.<key>` reference in Tasks 8–16.

**Risks flagged in spec addressed:** global retoken smoke check (Task 1 Step 6), gold legibility (dark text `--on-gold` in `.price-badge`), two-nav/footer collision avoided (home imports its own set; cinema untouched).
