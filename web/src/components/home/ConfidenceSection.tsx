import { getTranslations, type Locale } from '@/lib/i18n';

const ShieldIcon = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
    <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3Z" /><path d="m9 12 2 2 4-4" />
  </svg>
);
const CultureIcon = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
    <path d="M3 21h18M5 21V10l7-5 7 5v11M9 21v-6h6v6" />
  </svg>
);
const QrIcon = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
    <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" /><path d="M14 14h3v3M21 21v.01M17 21h.01M21 17v.01" />
  </svg>
);

export default function ConfidenceSection({ locale }: { locale: Locale }) {
  const h = getTranslations(locale).home;
  const items = [
    { icon: ShieldIcon, title: h.conf1Title, body: h.conf1Body, color: 'var(--primary)', bg: 'var(--primary-glow-soft)' },
    { icon: CultureIcon, title: h.conf2Title, body: h.conf2Body, color: 'var(--highlight-strong)', bg: 'rgba(0,184,217,0.16)' },
    { icon: QrIcon, title: h.conf3Title, body: h.conf3Body, color: 'var(--primary)', bg: 'var(--primary-glow-soft)' },
  ];

  return (
    <section className="ev-container ev-section">
      <div className="ev-conf">
        <h2 className="ev-h2" style={{ maxWidth: '22ch', marginInline: 'auto' }}>{h.confTitle}</h2>
        <p className="ev-sub" style={{ maxWidth: '54ch', marginInline: 'auto' }}>{h.confSub}</p>
        <div className="ev-conf-grid">
          {items.map((it) => (
            <div className="ev-conf-item" key={it.title}>
              <span className="ev-conf-icon" style={{ background: it.bg, color: it.color }}>{it.icon}</span>
              <span className="ev-conf-title">{it.title}</span>
              <span className="ev-conf-body">{it.body}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
