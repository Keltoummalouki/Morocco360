'use client';

const btn: React.CSSProperties = {
  background: 'none',
  border: '1px solid var(--border)',
  borderRadius: '4px',
  padding: '5px 10px',
  fontSize: '0.75rem',
  cursor: 'pointer',
  color: 'var(--foreground)',
  whiteSpace: 'nowrap',
  transition: 'border-color 0.15s ease, color 0.15s ease',
};

/** Compact edit / suspend-activate / delete controls for an admin table row. */
export default function RowActions({
  onEdit,
  status,
  onToggleStatus,
  onDelete,
}: {
  onEdit?: () => void;
  status?: 'ACTIVE' | 'SUSPENDED';
  onToggleStatus?: () => void;
  onDelete?: () => void;
}) {
  const suspend = status === 'ACTIVE';
  return (
    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
      {onEdit && (
        <button type="button" onClick={onEdit} style={btn}>
          Modifier
        </button>
      )}
      {onToggleStatus && status && (
        <button
          type="button"
          onClick={onToggleStatus}
          style={{
            ...btn,
            color: suspend ? '#C4623F' : '#2E8B6A',
            borderColor: suspend
              ? 'rgba(196,98,63,0.4)'
              : 'rgba(46,139,106,0.4)',
          }}
        >
          {suspend ? 'Suspendre' : 'Activer'}
        </button>
      )}
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          style={{ ...btn, color: '#C4623F' }}
          aria-label="Supprimer"
        >
          Suppr.
        </button>
      )}
    </div>
  );
}
