---
name: Morocco360
colors:
  surface: '#f4fafd'
  surface-dim: '#d4dbdd'
  surface-bright: '#f4fafd'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eef5f7'
  surface-container: '#e8eff1'
  surface-container-high: '#e2e9ec'
  surface-container-highest: '#dde4e6'
  on-surface: '#161d1f'
  on-surface-variant: '#424751'
  inverse-surface: '#2b3234'
  inverse-on-surface: '#ebf2f4'
  outline: '#727783'
  outline-variant: '#c2c6d3'
  surface-tint: '#175ead'
  primary: '#003e7a'
  on-primary: '#ffffff'
  primary-container: '#0055a4'
  on-primary-container: '#afccff'
  inverse-primary: '#a8c8ff'
  secondary: '#7b5800'
  on-secondary: '#ffffff'
  secondary-container: '#fdbb24'
  on-secondary-container: '#6c4d00'
  tertiary: '#820011'
  on-tertiary: '#ffffff'
  tertiary-container: '#aa131f'
  on-tertiary-container: '#ffb9b4'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d5e3ff'
  primary-fixed-dim: '#a8c8ff'
  on-primary-fixed: '#001b3c'
  on-primary-fixed-variant: '#004689'
  secondary-fixed: '#ffdea5'
  secondary-fixed-dim: '#fdbb24'
  on-secondary-fixed: '#271900'
  on-secondary-fixed-variant: '#5d4200'
  tertiary-fixed: '#ffdad7'
  tertiary-fixed-dim: '#ffb3ae'
  on-tertiary-fixed: '#410004'
  on-tertiary-fixed-variant: '#930015'
  background: '#f4fafd'
  on-background: '#161d1f'
  surface-variant: '#dde4e6'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Work Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Work Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Work Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  caption:
    fontFamily: Work Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
  section-gap: 80px
---

## Brand & Style
The design system for this platform bridges the gap between ancient heritage and modern digital convenience. The brand personality is **Cultural, Secure, and Vibrant**, aimed at both local explorers and international tourists seeking authentic Moroccan experiences.

The visual style is a **Modern-Ethno Minimalist** hybrid. It utilizes heavy whitespace to allow high-quality photography to breathe, while incorporating geometric precision inspired by Moroccan zellij patterns. Elements are crisp and professional, using subtle glassmorphism for overlays to maintain a sense of fluidity and depth without feeling cluttered. The emotional response should be one of "reliable excitement"—the thrill of discovery backed by the security of a professional booking engine.

## Colors
The palette is grounded in the "Imperial Trinity" of Moroccan landscapes:
- **Atlas Blue (Primary):** A deep, trustworthy blue representing the sky over the Atlas Mountains and the Majorelle Garden. Used for primary actions, navigation, and brand-heavy elements.
- **Sahara Gold (Secondary):** A warm, vibrant gold that evokes the dunes at sunset. Used for highlighting value, premium features, and ratings.
- **Marrakesh Red (Accent):** An earthy, high-energy red used sparingly for urgent notifications, live event indicators, and call-to-action accents.
- **Neutral Grays:** A range of cool grays (from Slate-50 to Slate-900) to maintain a professional, SaaS-like clarity.
- **Semantic Colors:** Standardized Success (Emerald) and Error (Rose) tones adjusted for high contrast against white backgrounds.

## Typography
The system uses a pairing of two modern sans-serifs to balance friendliness with professional rigor. **Plus Jakarta Sans** provides a soft, approachable, yet geometric feel for headlines, echoing the circular motifs often found in Moroccan architecture. **Work Sans** is used for all functional text and UI labels due to its exceptional legibility and stable, grounded character. 

For display text, tight letter spacing and heavy weights are encouraged to create a "bold discovery" feel. Body text maintains a generous line height (1.5x) to ensure readability during long browsing sessions of event descriptions.

## Layout & Spacing
The layout follows a **Fluid Grid** model based on an 8px base unit. 
- **Desktop:** 12-column grid with 24px gutters. Content is centered in a 1280px max-width container to prevent line-lengths from becoming unreadable on ultra-wide monitors.
- **Tablet:** 8-column grid with 24px gutters and 32px side margins.
- **Mobile:** 4-column grid with 16px gutters and 16px side margins.

The spacing philosophy is "Generous & Hierarchical." Large section gaps (80px+) are used to separate different categories of events (e.g., Music vs. Workshops), while related elements (e.g., event title and date) are kept tight within the 8px-16px range.

## Elevation & Depth
Depth is communicated through **Tonal Layering** and **Ambient Shadows**. 
1. **Base Layer:** The canvas is pure white (#FFFFFF) or a very light gray (#F8FAFC).
2. **Surface Layer:** Event cards and navigation bars use a subtle 1px border (#E2E8F0) to define their boundaries.
3. **Elevated State:** On hover or focus, elements transition to a soft, diffused shadow tinted with the Primary (Atlas Blue) color at 5% opacity. This "glow" effect feels modern and tech-forward.
4. **Overlays:** Modals and mobile menus use a high-refraction backdrop blur (12px) with a 70% white tint to maintain context of the background while focusing the user's attention.

## Shapes
The shape language is **"Modern Geometric."** A standard 0.5rem (8px) radius is applied to cards and input fields to ensure the UI feels approachable. For interactive components like buttons and "Price Badges," a more pronounced 1rem (16px) or fully pill-shaped radius is used to signify clickability. Sharp corners are avoided entirely to maintain the "Fluid" brand attribute.

## Components
- **Buttons:** 
  - *Primary:* Solid Atlas Blue with white text. High contrast, slightly rounded (8px). 
  - *Secondary:* Outlined Atlas Blue or Sahara Gold for "View Details" actions.
- **Event Cards:** The core component. Features a 16:9 aspect ratio image, a Sahara Gold "Price Badge" floating in the top-right, and a clean typography stack below for the title and location.
- **Input Fields:** Minimalist style with a 1px slate border. Upon focus, the border thickens and changes to Atlas Blue with a soft blue outer glow.
- **Badges:** Small, pill-shaped indicators for event types (e.g., "Culture," "Food," "Music"). These use high-chroma background tints (10% opacity of the category color) with dark text for accessibility.
- **Booking Bar:** A sticky bottom component for mobile or a sidebar for desktop, using a slight glassmorphic blur to stand out against the page content.
- **Geometric Patterns:** Subtle SVG background patterns inspired by Moroccan mosaics can be used in the footer or header hero sections at 2% opacity to reinforce the "Cultural" attribute.