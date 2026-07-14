import Link from 'next/link';
import { getTranslations, type Locale } from '@/lib/i18n';
import Logo from '@/components/Logo';

export default function EventsFooter({ locale }: { locale: Locale }) {
  const h = getTranslations(locale).home;
  return (
    <footer className="ev-footer">
      <div className="ev-container ev-footer-inner">
        <div>
          <Link href="/" aria-label="Morocco360 — home"><Logo size={26} /></Link>
          <p style={{ fontSize: '0.8125rem', color: 'var(--muted)', marginTop: 6 }}>
            © {new Date().getFullYear()} Morocco360. {h.footRights}
          </p>
        </div>
        <div className="ev-foot-links">
          <Link href="/about" className="ev-foot-link">{h.footAbout}</Link>
          <Link href="/support" className="ev-foot-link">{h.footSupport}</Link>
          <Link href="/privacy" className="ev-foot-link">{h.footPrivacy}</Link>
          <Link href="/terms" className="ev-foot-link">{h.footTerms}</Link>
        </div>
      </div>
    </footer>
  );
}
