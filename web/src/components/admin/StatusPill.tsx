'use client';

// Small status badge matching the admin dashboard's pill style. Covers the
// settings ACTIVE/SUSPENDED lifecycle plus the review/order/payment states
// reused in later admin phases.
const STYLES: Record<string, { color: string; bg: string; label: string }> = {
  ACTIVE: { color: '#2E8B6A', bg: 'rgba(46,139,106,0.10)', label: 'Actif' },
  SUSPENDED: { color: '#C4623F', bg: 'rgba(196,98,63,0.10)', label: 'Suspendu' },
  PENDING: { color: '#C49A3C', bg: 'rgba(196,154,60,0.12)', label: 'En attente' },
  APPROVED: { color: '#2E8B6A', bg: 'rgba(46,139,106,0.10)', label: 'Approuvé' },
  UNAPPROVED: { color: '#C4623F', bg: 'rgba(196,98,63,0.10)', label: 'Rejeté' },
};

export default function StatusPill({
  status,
  label,
}: {
  status: string;
  label?: string;
}) {
  const s = STYLES[status] ?? {
    color: 'var(--muted)',
    bg: 'var(--surface-3)',
    label: status,
  };
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '4px 10px',
        fontSize: '0.625rem',
        fontWeight: 600,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: s.color,
        background: s.bg,
        borderRadius: '4px',
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          width: '5px',
          height: '5px',
          borderRadius: '50%',
          background: s.color,
          flexShrink: 0,
        }}
      />
      {label ?? s.label}
    </span>
  );
}
