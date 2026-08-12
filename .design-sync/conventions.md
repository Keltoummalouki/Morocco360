# Morocco360 — Cinema design kit

A **class-vocabulary** design system (no bundled components — style with these CSS classes and the tokens they read). Derived from the app's `.cinema` system. Cinematic, media-led, dark by default: warm near-black base, terracotta + gold accents, editorial serif display.

## Setup (required)

1. **Wrap all UI in `class="cinema"`.** Every token (`--c-*`) is defined on `.cinema`; without the wrapper, classes render unstyled.
2. **Theme:** put `data-theme="dark"` (default look) or `data-theme="light"` (warm daylight variant) on a parent element. Dark is the intended, cinematic default.
3. **Fonts** (Fraunces, Geist, Geist Mono) load automatically via `styles.css`'s `@import` — do not add your own.

```html
<body class="cinema" data-theme="dark">
  <section style="padding: 96px 24px; max-width: 1440px; margin: 0 auto;">
    <div class="c-eyebrow">360° immersive journeys · Morocco</div>
    <h1 class="c-display c-giant c-text-glow">Morocco</h1>
    <p class="c-lead">Step inside the medinas of Fez, from anywhere.</p>
    <a class="c-btn" href="#">Start the journey <span class="arrow">→</span></a>
  </section>
</body>
```

## The class vocabulary (real names — use these, don't invent)

**Type**
- `c-display` — Fraunces display serif. Add `c-giant` for hero scale, `c-display-italic` for italic, `c-text-glow` for the terracotta→gold gradient fill.
- `c-eyebrow` — mono uppercase kicker with a leading rule (terracotta). `c-kicker` for a quieter muted variant.
- `c-lead` — intro paragraph (max ~46ch). `c-mono` — Geist Mono, tabular figures, for labels/coordinates/counts.

**Actions**
- `c-btn` — primary (terracotta gradient pill). `c-btn-ghost` — outline pill. Put a `<span class="arrow">→</span>` inside for the animated arrow. `:disabled` supported.
- `c-play` — round play button (pairs with `c-aperture-ring`). `c-nav-link` — mono nav link with terracotta underline.

**Forms**
- `c-input` — pill text input with terracotta focus ring.

**Surfaces**
- `c-glass` — soft-glass panel (overlays, popovers). `c-feat-row` (+ `c-feat-idx`, `c-feat-title`) — editorial numbered list row.
- `c-dest` — destination tile: put a `.c-media` (with `.c-media-ph` placeholder + `c-media-scrim`) as the background and a `.c-dest-body` on top; `.c-dest-explore` reveals on hover.

**Media & motif**
- `c-media` — media wrapper; always include a `<div class="c-media-ph"></div>` (branded gradient shown until a real image/video loads). Overlays: `c-media-scrim`, `c-media-vignette`.
- `c-portal` — the signature circular aperture; layer `c-aperture-ring` (and `.reverse`) inside.
- `c-stat-num` (wrap the unit in `<span class="unit">`), `c-marquee` + `c-marquee-item` (+ `.dot`).

## Where the truth lives

Read **`styles.css`** before styling — it is the complete source for every class and token above. Use the `--c-*` custom properties (e.g. `var(--c-terra)`, `var(--c-line)`, `var(--c-radius)`) for any custom layout glue rather than hardcoding hex values, so light/dark theming keeps working.

## Rules of the look

- Dark, filmic, spacious. Let media go full-bleed; keep large section padding (96px+).
- One accent story: terracotta + gold. Green is a supporting tone only.
- Serif (`c-display`) for expression; mono (`c-mono`) for the technical/immersive texture; Geist sans for body.
