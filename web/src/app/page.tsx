import Link from "next/link";
import PremiumNav    from "@/components/PremiumNav";
import HeroSection   from "@/components/HeroSection";
import PremiumSearch from "@/components/PremiumSearch";
import CursorGlow    from "@/components/CursorGlow";
import ScrollProgress from "@/components/ScrollProgress";
import BottomNav     from "@/components/BottomNav";
import RevealSection from "@/components/RevealSection";
import SpotlightCard from "@/components/SpotlightCard";
import StaggerReveal from "@/components/StaggerReveal";
import AnimatedCounter from "@/components/AnimatedCounter";

/* ── Static data ────────────────────────────────────────── */
const FEATURES = [
  {
    symbol: "◎",
    title: "Immersive 360°",
    desc: "Full spherical panoramas captured with professional equipment across Morocco's most breathtaking locations.",
  },
  {
    symbol: "◈",
    title: "Curated Routes",
    desc: "Expert-designed virtual tours connecting medinas, kasbahs, and natural landscapes in meaningful sequences.",
  },
  {
    symbol: "◇",
    title: "Live Guides",
    desc: "Join live sessions with local Moroccan guides who share stories, history, and hidden secrets of each place.",
  },
];

const MARQUEE_CITIES = [
  "MARRAKECH", "FEZ", "CHEFCHAOUEN", "SAHARA DESERT",
  "ATLAS MOUNTAINS", "ESSAOUIRA", "CASABLANCA", "RABAT",
  "MEKNES", "AGADIR", "OUARZAZATE", "TANGIER",
];

const DESTINATIONS = [
  { name: "Marrakech",  count: "240 panoramas", desc: "The Red City"          },
  { name: "Fez Medina", count: "118 panoramas", desc: "Ancient Imperial City" },
  { name: "Sahara Erg", count: "96 panoramas",  desc: "Golden Dunes"          },
  { name: "Essaouira",  count: "74 panoramas",  desc: "Wind City of Africa"   },
];

const STATS = [
  { to: 240, suffix: '+',  label: 'Panoramas', desc: 'Across Morocco'      },
  { to: 18,  suffix: '',   label: 'Cities',    desc: 'Fully mapped'        },
  { to: 50,  suffix: 'K+', label: 'Explorers', desc: 'From 80 countries'   },
  { to: 4.9, suffix: '',   label: 'Rating',    desc: 'App store average', decimals: 1 },
];

/* ── Page ───────────────────────────────────────────────── */
export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <CursorGlow />
      <ScrollProgress />
      <PremiumNav />
      <HeroSection />

      {/* ── Marquee strip ──────────────────────────────── */}
      <div style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '14px 0', overflow: 'hidden', background: 'var(--surface)' }}>
        <div className="marquee-track flex whitespace-nowrap w-max">
          {[...MARQUEE_CITIES, ...MARQUEE_CITIES].map((city, i) => (
            <span key={i} className="marquee-item">
              {city}
              <span style={{ color: 'var(--primary)', marginLeft: '24px' }}>·</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── Search ─────────────────────────────────────── */}
      <RevealSection variant="blurUp">
        <section style={{ padding: 'clamp(48px,7vw,80px) 16px', background: 'var(--background)' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-8">
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <p style={{ fontSize: '0.6875rem', letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--primary)', fontWeight: 600, marginBottom: '12px' }}>
                Find Your Journey
              </p>
              <h2 className="font-playfair" style={{ fontSize: 'clamp(1.5rem,3vw,2.5rem)', lineHeight: 1.2, letterSpacing: '-0.01em' }}>
                Where do you want to explore?
              </h2>
            </div>
            <PremiumSearch />
          </div>
        </section>
      </RevealSection>

      {/* ── Features ───────────────────────────────────── */}
      <RevealSection variant="fadeUp">
        <section id="experiences" style={{ padding: 'clamp(64px,8vw,128px) 0' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-8">
            <RevealSection variant="fadeUp">
              <div style={{ marginBottom: 'clamp(48px,6vw,64px)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div className="section-divider" />
                <p style={{ fontSize: '0.6875rem', letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--primary)', fontWeight: 600 }}>
                  Why Morocco360
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h2 className="font-playfair" style={{ fontSize: 'clamp(1.75rem,4vw,3.25rem)', lineHeight: 1.15, letterSpacing: '-0.02em', maxWidth: '420px' }}>
                    A new way to experience the kingdom
                  </h2>
                  <Link href="/register" className="nav-link-premium" style={{ fontSize: '0.8125rem', color: 'var(--muted)', alignSelf: 'flex-start' }}>
                    See all experiences
                  </Link>
                </div>
              </div>
            </RevealSection>

            <StaggerReveal
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '1px', background: 'var(--border)' }}
              stagger={0.1}
              fromY={36}
            >
              {FEATURES.map((feat) => (
                <FeatureCard key={feat.title} feat={feat} />
              ))}
            </StaggerReveal>
          </div>
        </section>
      </RevealSection>

      {/* ── Destinations ───────────────────────────────── */}
      <RevealSection variant="fadeUp">
        <section style={{ background: 'var(--surface)', padding: 'clamp(64px,8vw,96px) 0' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-8">
            <RevealSection variant="fadeUp">
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: 'clamp(40px,5vw,56px)' }}>
                <div>
                  <div className="section-divider" />
                  <h2 className="font-playfair" style={{ fontSize: 'clamp(1.5rem,3vw,2.75rem)', lineHeight: 1.2, letterSpacing: '-0.02em' }}>
                    Popular destinations
                  </h2>
                </div>
                <Link href="/register" className="btn-premium-outline" style={{ padding: '10px 24px' }}>
                  <span>Explore All</span>
                </Link>
              </div>
            </RevealSection>

            <StaggerReveal
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '12px' }}
              stagger={0.08}
              fromScale={0.95}
            >
              {DESTINATIONS.map((dest) => (
                <DestCard key={dest.name} dest={dest} />
              ))}
            </StaggerReveal>
          </div>
        </section>
      </RevealSection>

      {/* ── Stats ribbon — animated counters ───────────── */}
      <RevealSection variant="fadeUp">
        <section style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: 'clamp(40px,5vw,64px) 0' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-8">
            <StaggerReveal
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: '32px', textAlign: 'center' }}
              stagger={0.1}
              fromY={24}
            >
              {STATS.map(({ to, suffix, label, desc, decimals }) => (
                <div key={label}>
                  <AnimatedCounter
                    to={to}
                    suffix={suffix}
                    decimals={decimals}
                    duration={1.6}
                    className="font-playfair"
                    style={{ fontSize: 'clamp(2rem,4vw,3rem)', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--primary)' }}
                  />
                  <p style={{ fontSize: '0.6875rem', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 600, marginTop: '6px' }}>
                    {label}
                  </p>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--muted)', marginTop: '4px' }}>
                    {desc}
                  </p>
                </div>
              ))}
            </StaggerReveal>
          </div>
        </section>
      </RevealSection>

      {/* ── CTA ────────────────────────────────────────── */}
      <RevealSection variant="scaleUp">
        <section className="cta-luxury" style={{ padding: 'clamp(80px,10vw,128px) 0', position: 'relative' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10" style={{ textAlign: 'center' }}>
            <RevealSection variant="fadeUp">
              <div className="hero-eyebrow" style={{ justifyContent: 'center', marginBottom: '24px' }}>
                Begin your journey
              </div>
              <h2 className="font-playfair" style={{ fontSize: 'clamp(2rem,6vw,5rem)', lineHeight: 1.1, marginBottom: '20px', letterSpacing: '-0.03em', color: 'var(--card-inverted-text)' }}>
                Morocco awaits you
              </h2>
              <p style={{ color: 'var(--card-inverted-muted)', fontSize: 'clamp(1rem,2vw,1.125rem)', maxWidth: '440px', margin: '0 auto 48px', lineHeight: 1.8, fontWeight: 300 }}>
                Create a free account and unlock hundreds of panoramic experiences across the Kingdom of Morocco.
              </p>
              <Link href="/register" className="btn-premium" style={{ display: 'inline-block', fontSize: '0.875rem', padding: '18px 48px', letterSpacing: '0.15em' }}>
                Create Free Account
              </Link>
            </RevealSection>
          </div>
        </section>
      </RevealSection>

      {/* ── Footer ─────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: 'clamp(40px,5vw,48px) 0', paddingBottom: '80px' }} className="md:pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '40px', marginBottom: '48px' }}>
            <div>
              <Link href="/" className="font-playfair" style={{ fontSize: '1.25rem', fontWeight: 700, display: 'block', marginBottom: '12px' }}>
                Morocco<span style={{ color: 'var(--primary)' }}>360</span>
              </Link>
              <p style={{ fontSize: '0.875rem', color: 'var(--muted)', lineHeight: 1.7, maxWidth: '240px' }}>
                Immersive panoramic journeys through the Kingdom of Morocco.
              </p>
            </div>
            {[
              { title: 'Product', links: ['Experiences', 'Destinations', 'Gallery', 'Live Tours'] },
              { title: 'Company', links: ['About', 'Blog', 'Careers', 'Press']                   },
              { title: 'Legal',   links: ['Privacy', 'Terms', 'Cookies', 'Contact']               },
            ].map(({ title, links }) => (
              <div key={title}>
                <p style={{ fontSize: '0.6875rem', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 600, marginBottom: '16px' }}>
                  {title}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {links.map((link) => (
                    <Link key={link} href="#" className="nav-link-premium" style={{ fontSize: '0.875rem' }}>
                      {link}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <p style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>© 2026 Morocco360. All rights reserved.</p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>Made with care in Morocco 🇲🇦</p>
          </div>
        </div>
      </footer>

      <BottomNav />
    </div>
  );
}

/* ── Inline sub-components ──────────────────────────────── */

function FeatureCard({ feat }: { feat: typeof FEATURES[0] }) {
  return (
    <SpotlightCard style={{ padding: 'clamp(32px,4vw,48px) clamp(24px,3vw,40px)' }}>
      <span style={{ fontSize: '1.375rem', display: 'block', marginBottom: 'clamp(24px,3vw,28px)', color: 'var(--primary)', position: 'relative', zIndex: 1 }}>
        {feat.symbol}
      </span>
      <h3 className="font-playfair" style={{ fontSize: 'clamp(1.125rem,2vw,1.375rem)', fontWeight: 600, marginBottom: '12px', position: 'relative', zIndex: 1, letterSpacing: '-0.01em' }}>
        {feat.title}
      </h3>
      <p style={{ color: 'var(--muted)', lineHeight: 1.8, fontSize: '0.9375rem', position: 'relative', zIndex: 1 }}>
        {feat.desc}
      </p>
    </SpotlightCard>
  );
}

function DestCard({ dest }: { dest: typeof DESTINATIONS[0] }) {
  return (
    <div className="glass-card" style={{ padding: 'clamp(20px,3vw,28px) clamp(20px,3vw,24px)', cursor: 'pointer' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
        <p className="font-playfair" style={{ fontSize: 'clamp(1rem,2vw,1.25rem)', fontWeight: 600, letterSpacing: '-0.01em' }}>
          {dest.name}
        </p>
        <span className="live-pulse" aria-hidden="true" />
      </div>
      <p style={{ fontSize: '0.8125rem', color: 'var(--muted)', marginBottom: '4px' }}>{dest.desc}</p>
      <p style={{ fontSize: '0.6875rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--primary)', fontWeight: 600 }}>
        {dest.count}
      </p>
    </div>
  );
}
