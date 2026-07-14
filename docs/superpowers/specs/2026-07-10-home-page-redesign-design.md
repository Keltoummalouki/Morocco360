# Home Page Redesign — Imperial Trinity (events + ticketing)

**Date:** 2026-07-10
**Status:** Approved design · ready for implementation plan
**Scope of this deliverable:** App-wide palette retoken + a new light, events-focused home page. Dashboards/auth inherit the new palette but keep their current layouts (redesigned in later passes).

---

## 1. Context & problem

The live home page is a scoped `.cinema` system: dark, near-black, terracotta + gold, Fraunces serif, film grain, telling a **360° virtual-tourism** story ("Step inside Morocco in full 360°", "240 panoramas"). That narrative does not match the actual product described in `README.md`, `CLAUDE.md`, and the backend: **Morocco360 is an events discovery + ticketing platform** (multi-ticket booking, Stripe, signed QR tickets, role dashboards).

The user attached `DESIGN.md`, a formal design system that *does* describe the real product. Three design languages currently coexist in the repo:

| Source | Look | Story |
|---|---|---|
| Live `.cinema` home | Dark, terracotta + gold, Fraunces | 360° tourism |
| `ds-bundle/` (synced to Claude Design project) | Derived from `.cinema` (same dark look) | — |
| `DESIGN.md` | **Light, Atlas Blue + Sahara Gold + Marrakesh Red, Plus Jakarta Sans + Work Sans** | **Events + ticketing SaaS** |

### Decisions (locked with the user)

1. **North-star:** `DESIGN.md` "Imperial Trinity" (light events SaaS). The dark `.cinema` home is retired.
2. **Palette scope:** Retoken **app-wide** — swap the global tokens in `globals.css` from green to Imperial Trinity, keeping semantic var *names* so every screen adopts it for free.
3. **Events data:** Curated **placeholder** content for this first pass (no backend dependency); wire to the real API later.
4. **Home structure:** Approach 1 — **search-first discovery** (hero centers search + category chips, then featured events).

---

## 2. Design system application (from DESIGN.md)

### 2.1 Color — "Imperial Trinity"

Retoken `web/src/app/globals.css`. Keep existing semantic variable **names** (`--primary`, `--accent`, `--gold`, `--background`, `--surface`, `--foreground`, `--border`, `--muted`, etc.) so dashboards/auth re-skin without markup changes. Only the *values* change.

**Light (default):**
- `--background` `#f4fafd` (surface) · `--surface` `#ffffff` (container-lowest) · `--surface-2` `#eef5f7` · `--surface-3` `#e8eff1`
- `--foreground` `#161d1f` (on-surface) · `--foreground-dim` / `--muted` `#424751` (on-surface-variant) · `--muted-dim` `#727783` (outline)
- `--primary` **Atlas Blue `#003e7a`** · `--primary-dark` `#00305f` · `--primary-light` `#0055a4` (primary-container) · `--primary-glow` `rgba(0,62,122,0.05)` (DESIGN.md's 5% hover glow)
- `--gold` **Sahara Gold `#fdbb24`** (secondary-container; value/premium/ratings/price badges) · on-gold text `#6c4d00`
- `--accent` **Marrakesh Red `#aa131f`** (tertiary-container; live/urgent/CTA accents, used sparingly) · `--accent-dark` `#820011`
- `--border` `#e2e8f0` (1px card borders) · `--border-light` `#c2c6d3` (outline-variant)
- `--error` `#ba1a1a` · `--success` emerald `#1e6b52`-class (keep an emerald success)
- `--glass-bg` `rgba(255,255,255,0.70)` · glass blur `12px` (DESIGN.md overlays)

**Dark (derived — DESIGN.md is light-only; we derive it because CLAUDE.md requires both themes):**
- Deep navy ink surfaces: `--background` `#0a1017`, `--surface` `#0f1720`, `--surface-2` `#141d27`, `--surface-3` `#1a2531`
- `--foreground` `#e6edf3` · `--muted` `#9fb0bf`
- `--primary` lightened for contrast on dark: **`#7fb0ff`** (approx primary-fixed-dim `#a8c8ff` family) · `--gold` `#fdbb24` (pops on dark) · `--accent` `#ff5a52`-class red for dark legibility
- `--border` `#22303d` · glass `rgba(15,23,32,0.72)`

Update the Tailwind v4 `@theme inline` bridge accordingly (add `--color-gold`, `--color-accent` if referenced).

### 2.2 Typography

- Add **Plus Jakarta Sans** (display) and **Work Sans** (body/UI) via `next/font/google` in `layout.tsx`. Map `--font-display` → Plus Jakarta Sans, `--font-sans` → Work Sans. Keep **Noto Sans Arabic** for RTL.
- Scale per DESIGN.md: display-lg 48/56 800 -0.02em, headline-lg 32/40 700, headline-md 24/32 600, body-lg 18/28, body-md 16/24, label-md 14 600 0.05em, caption 12.
- Body line-height 1.5 for readability.
- The old Inter/Playfair and cinema Fraunces/Geist fonts: Playfair/Inter can be removed once no surface references them; **cinema fonts (Fraunces/Geist/Geist Mono) become unused** when the cinema home is retired — leave loading in place this pass, drop in cleanup.

### 2.3 Shape, elevation, motion

- Radii: 8px cards/inputs, **pill** (or 16px) for buttons and price badges. No sharp corners.
- Elevation: white/tonal base → 1px `--border` on cards → hover lifts to a soft diffused shadow tinted `--primary` at 5% (`--primary-glow`). Overlays/modals: 12px backdrop blur, ~70% surface tint.
- Motion: reuse framer-motion + GSAP helpers (`web/src/lib/gsap.ts`) for reveals/counters. Calmer than the cinema film-grain. All motion gated on `prefers-reduced-motion`.
- **Zellij motif:** a subtle SVG geometric pattern at ~2% opacity in hero backdrop and footer (DESIGN.md "Cultural" attribute).

---

## 3. Home page — section map (search-first discovery)

All sections are Server Components by default; add `"use client"` only where interaction/hooks are needed (search, counters, reveals). Content flows through the `fr`/`ar`/`en` dictionary (`web/src/lib/i18n.ts`); `fr` is the default locale.

1. **Nav** — `Morocco360` wordmark · links: Events / Categories / Cities / For organizers · `LocaleSwitcher` + `ThemeToggle` · Sign in · **Explore events** (primary). Glass-on-scroll. *(adapt `PremiumNav`)*
2. **Hero** — Headline ("Morocco's events — from the medina to the main stage"), subhead, **search** (keyword · city · date), category quick-chips, editorial light image with zellij motif + a glass stat sliver. Heavy whitespace. *(reuse `PremiumSearch`, `MagneticButton`)*
3. **Browse by category** — 8 categories (Music, Festivals, Sports, Culture & Arts, Food, Nightlife, Workshops, Family) as tinted pill/tiles (10% category-color bg + dark text per DESIGN.md badges).
4. **Featured & trending events** — the core **Event Card** grid: 16:9 image, **Sahara-Gold price badge** (top-right), category badge, title, city + date. Curated placeholders (Mawazine/Rabat, Gnaoua/Essaouira, Marrakech du Rire, Raja–Wydad/Casablanca, Fes Sacred Music, Jazzablanca, …). "View all events" CTA. *(reuse `SpotlightCard`, `StaggerReveal`)*
5. **Explore by city** — image tiles + event counts: Marrakech, Casablanca, Rabat, Fès, Tanger, Essaouira.
6. **How it works** — 3 steps reinforcing "secure": **Discover → Book securely (Stripe) → Scan your QR ticket.**
7. **Trust + stats** — secure payments · instant e-tickets · verified organizers, with animated counters (240+ events · 18 cities · 50K tickets · 4.9★). *(reuse `AnimatedCounter`)*
8. **For organizers** — accent panel: "Sell tickets, scan at the door, track sales live." → organizer sign-up.
9. **Final CTA + newsletter** — "Your next experience is one tap away."
10. **Footer** — Discover / Company / Support / Legal, newsletter, socials, 2% zellij pattern.

### Component inventory

**Reuse:** `PremiumNav`, `PremiumSearch`, `SpotlightCard`, `StaggerReveal`, `RevealSection`, `AnimatedCounter`, `MagneticButton`, `ThemeToggle`, `LocaleSwitcher`.
**New (small, focused, one purpose each):**
- `EventCard` — the core card (image slot, gold price badge, category badge, title, city+date). If `SpotlightCard` fits as the shell, `EventCard` composes it.
- `CategoryTile`, `CityTile`, `HowItWorksStep`, `StatBand`, `OrganizerCTA`, `HomeFooter` (events-oriented; distinct from the cinema footer).
- `home/` data module — typed curated `EVENTS`, `CATEGORIES`, `CITIES`, `STATS` placeholder content.
- Media: reuse the `<Media>` component pattern with branded gradient placeholders (no real files required to look finished).

### Content / data

Curated placeholder module (typed). Event shape: `{ id, title, category, city, date, priceFrom, currency, image, badge? }`. Images use `<Media>` placeholders until real assets land.

---

## 4. Accessibility, i18n, performance

- **Contrast:** Atlas Blue `#003e7a` on white passes AA for text; Sahara Gold only with **dark** text on it; Marrakesh Red reserved for accents/urgent, not body text. Verify all pairings.
- **Keyboard/focus:** visible focus rings (`--primary`), full keyboard nav for search + chips; search has proper labels.
- **Reduced motion:** every animation gated; no essential info conveyed by motion alone.
- **RTL:** verify the full page in `ar` (logical properties, mirrored chevrons/arrows).
- **Perf:** hero image `priority`; below-fold lazy. Measure with `/lighthouse` against a **production build** (`cd web; npm run build; npm run start`) — confirm LCP/TBT/CLS don't regress vs current home.

---

## 5. Out of scope (later passes)

- Redesigning dashboard/auth **layouts** (they only inherit the new palette here).
- Wiring the home to **real event data** via the BFF proxy.
- Removing dead `.cinema` files, `media.ts` tourism manifest, and unused fonts (cleanup pass).
- **Phase 2 — design-sync:** re-derive `ds-bundle/` from the Imperial Trinity system and re-sync to the Claude Design project `Morocco360 Design System`. This is an outward push that requires `/design-consent`; ask before pushing.

---

## 6. Testing & verification

- The web app has no test runner yet. For this UI change, verification is: production build passes, `/lighthouse` before/after on the home route, manual pass in light + dark + RTL, and `/code-review` on the diff.
- If any extractable non-UI logic emerges (e.g. price/date formatting helpers), add Vitest + Testing Library for it rather than skipping.

---

## 7. Risks

- **Global retoken blast radius:** dashboards were designed around green; switching `--primary` to blue is generally safe (semantic tokens) but every screen should get a quick visual smoke check in light + dark.
- **Two footers/navs:** ensure the new events footer/nav don't collide with cinema ones; the home imports the new set, cinema files stay dormant.
- **Gold legibility:** easy to misuse Sahara Gold as a text color — keep it to badges/fills with dark text.
