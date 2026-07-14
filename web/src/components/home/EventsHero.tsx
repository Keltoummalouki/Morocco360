import Image from 'next/image';
import { getTranslations, type Locale } from '@/lib/i18n';
import HeroSearch from './HeroSearch';

const HERO_FALLBACK = 'linear-gradient(160deg, #C97B2E 0%, #8A4B1E 38%, #12202E 100%)';

export default function EventsHero({ locale }: { locale: Locale }) {
  const h = getTranslations(locale).home;
  return (
    <section className="ev-container ev-hero">
      <div className="ev-hero-media" style={{ background: HERO_FALLBACK }}>
        {/* LCP element — preloaded via priority */}
        <Image
          src="/events/hero-marrakech.webp"
          alt=""
          fill
          priority
          sizes="(max-width: 1280px) 100vw, 1280px"
          className="ev-hero-img"
        />
        <div className="ev-hero-scrim" />
        <div className="ev-hero-content">
          <h1 className="ev-hero-title">{h.heroTitle}</h1>
          <p className="ev-hero-sub">{h.heroSub}</p>
          <HeroSearch />
        </div>
      </div>
    </section>
  );
}
