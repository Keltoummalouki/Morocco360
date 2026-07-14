'use client';

import { useEffect, type ReactNode } from 'react';

// ── Modal shell ────────────────────────────────────────────
export function AdminFormModal({
  title,
  onCancel,
  onSubmit,
  submitting,
  error,
  submitLabel = 'Enregistrer',
  children,
}: {
  title: string;
  onCancel: () => void;
  onSubmit: () => void;
  submitting: boolean;
  error?: string | null;
  submitLabel?: string;
  children: ReactNode;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          if (!submitting) onSubmit();
        }}
        style={{
          background: 'var(--background)',
          border: '1px solid var(--border)',
          borderRadius: '4px',
          padding: '32px',
          maxWidth: '520px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 24px 64px -12px var(--shadow)',
        }}
      >
        <p
          style={{
            fontFamily: 'var(--font-playfair)',
            fontSize: '1.25rem',
            fontWeight: 700,
            marginBottom: '24px',
          }}
        >
          {title}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {children}
        </div>

        {error && (
          <p
            style={{
              color: '#C4623F',
              fontSize: '0.8125rem',
              marginTop: '16px',
            }}
          >
            {error}
          </p>
        )}

        <div style={{ display: 'flex', gap: '12px', marginTop: '28px' }}>
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary btn-sm"
            style={{ flex: 1, opacity: submitting ? 0.6 : 1 }}
          >
            {submitting ? '…' : submitLabel}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="btn-outline btn-sm"
            style={{ flex: 1 }}
          >
            <span>Annuler</span>
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Field primitives ───────────────────────────────────────
const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.6875rem',
  fontWeight: 600,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--muted)',
  marginBottom: '7px',
};

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label style={{ display: 'block' }}>
      <span style={labelStyle}>{label}</span>
      {children}
    </label>
  );
}

export function TextInput({
  value,
  onChange,
  placeholder,
  required,
  maxLength,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  maxLength?: number;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      maxLength={maxLength}
      className="search-input"
      style={{ width: '100%' }}
    />
  );
}

export function TextArea({
  value,
  onChange,
  placeholder,
  maxLength,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      rows={3}
      className="search-input"
      style={{ width: '100%', resize: 'vertical', minHeight: '72px' }}
    />
  );
}

export function NumberInput({
  value,
  onChange,
  placeholder,
  step,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  step?: string;
}) {
  return (
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      step={step}
      className="search-input"
      style={{ width: '100%' }}
    />
  );
}

export function StatusSelect({
  value,
  onChange,
}: {
  value: 'ACTIVE' | 'SUSPENDED';
  onChange: (v: 'ACTIVE' | 'SUSPENDED') => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as 'ACTIVE' | 'SUSPENDED')}
      className="search-input"
      style={{ width: '100%', cursor: 'pointer' }}
    >
      <option value="ACTIVE">Actif</option>
      <option value="SUSPENDED">Suspendu</option>
    </select>
  );
}

export function SelectInput<V extends string | number>({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: V | '';
  onChange: (v: V | '') => void;
  options: { value: V; label: string }[];
  placeholder?: string;
}) {
  return (
    <select
      value={value === '' ? '' : String(value)}
      onChange={(e) =>
        onChange(e.target.value === '' ? '' : (e.target.value as V))
      }
      className="search-input"
      style={{ width: '100%', cursor: 'pointer' }}
    >
      <option value="">{placeholder ?? '—'}</option>
      {options.map((o) => (
        <option key={String(o.value)} value={String(o.value)}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

/** Toggleable chips for assigning a small set (languages, countries). */
export function ChipMultiSelect({
  options,
  selected,
  onToggle,
  emptyLabel = 'Aucune option',
}: {
  options: { id: number; label: string }[];
  selected: number[];
  onToggle: (id: number) => void;
  emptyLabel?: string;
}) {
  if (options.length === 0) {
    return (
      <p style={{ fontSize: '0.8125rem', color: 'var(--muted-dim)' }}>
        {emptyLabel}
      </p>
    );
  }
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
      {options.map((o) => {
        const active = selected.includes(o.id);
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onToggle(o.id)}
            style={{
              padding: '6px 12px',
              fontSize: '0.8125rem',
              borderRadius: '999px',
              cursor: 'pointer',
              border: `1px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
              background: active ? 'var(--primary)' : 'transparent',
              color: active ? 'var(--on-primary, #fff)' : 'var(--foreground)',
              transition: 'all 0.15s ease',
            }}
            aria-pressed={active}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
