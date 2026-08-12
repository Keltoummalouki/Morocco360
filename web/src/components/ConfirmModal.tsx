'use client';

import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  title,
  message,
  confirmLabel = 'Supprimer',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent
        className="max-w-[440px]"
        style={{ padding: '36px 40px' }}
      >
        {/* Icon */}
        <div
          style={{
            width: '48px',
            height: '48px',
            background: 'rgba(194, 83, 58, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px',
          }}
        >
          <span style={{ fontSize: '1.25rem', color: '#C2533A' }}>⚠</span>
        </div>

        {/* Title */}
        <DialogTitle style={{ fontSize: '1.25rem', marginBottom: '10px' }}>
          {title}
        </DialogTitle>

        {/* Message */}
        <DialogDescription
          style={{ fontSize: '0.9375rem', color: 'var(--muted)', lineHeight: 1.6, marginBottom: '28px' }}
        >
          {message}
        </DialogDescription>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              background: '#C2533A',
              color: '#FAFAF8',
              border: 'none',
              padding: '12px 20px',
              fontSize: '0.8125rem',
              fontWeight: 500,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              fontFamily: 'var(--font-inter), system-ui, sans-serif',
              transition: 'opacity 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            {confirmLabel}
          </button>
          <button
            onClick={onCancel}
            className="btn-outline"
            style={{ flex: 1, padding: '12px 20px' }}
          >
            Annuler
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
