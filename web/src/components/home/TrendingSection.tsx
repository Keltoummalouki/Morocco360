import Link from 'next/link';
import { getTranslations, type Locale } from '@/lib/i18n';
import { TRENDING } from '@/lib/home-content';
import EventCard from './EventCard';

export default function TrendingSection({ locale }: { locale: Locale }) {
  const h = getTranslations(locale).home;
  const colA = TRENDING.filter((_, i) => i % 2 === 0);
  const colB = TRENDING.filter((_, i) => i % 2 === 1);

  return (
    <section className="ev-container ev-section">
      <div className="ev-head">
        <div>
          <h2 className="ev-h2">{h.trendTitle}</h2>
          <p className="ev-sub">{h.trendSub}</p>
        </div>
        <Link href="/events" className="ev-viewall">
          {h.viewAll} <span className="ev-arrow" aria-hidden="true">→</span>
        </Link>
      </div>

      <div className="ev-bento">
        <div className="ev-bento-col">
          {colA.map((e) => (
            <EventCard key={e.id} event={e} freeLabel={h.freeEntry} locale={locale} />
          ))}
        </div>
        <div className="ev-bento-col">
          {colB.map((e) => (
            <EventCard key={e.id} event={e} freeLabel={h.freeEntry} locale={locale} />
          ))}
        </div>
      </div>
    </section>
  );
}
