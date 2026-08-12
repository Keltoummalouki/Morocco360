import Link from 'next/link';
import { getTranslations, type Locale } from '@/lib/i18n';

export default function OrganizerSection({ locale }: { locale: Locale }) {
  const h = getTranslations(locale).home;
  return (
    <section id="organizers" className="ev-container ev-section">
      <div className="ev-org">
        <div style={{ maxWidth: '54ch' }}>
          <h2 className="ev-org-title">{h.orgTitle}</h2>
          <p className="ev-org-body">{h.orgBody}</p>
        </div>
        <Link href="/register?role=organizer" className="ev-btn ev-btn--pale">
          {h.orgCta} <span className="ev-arrow" aria-hidden="true">→</span>
        </Link>
      </div>
    </section>
  );
}
