'use client';

import { type ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!submitting) onSubmit();
          }}
        >
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>

          <div className="mt-4 flex flex-col gap-4">{children}</div>

          {error && (
            <p style={{ color: '#C4623F', fontSize: '0.8125rem', marginTop: '16px' }}>
              {error}
            </p>
          )}

          <DialogFooter className="mt-7">
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
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
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
    <Input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      maxLength={maxLength}
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
    <Textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      rows={3}
      className="min-h-[72px] resize-y"
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
    <Input
      type="number"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      step={step}
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
    <Select value={value} onValueChange={(v) => onChange(v as 'ACTIVE' | 'SUSPENDED')}>
      <SelectTrigger className="w-full min-w-0">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ACTIVE">Actif</SelectItem>
        <SelectItem value="SUSPENDED">Suspendu</SelectItem>
      </SelectContent>
    </Select>
  );
}

// Radix Select forbids an item with value="" (that's reserved to mean
// "nothing selected"), so a synthetic sentinel represents the clearable
// placeholder entry and is translated back to '' here.
const CLEAR_VALUE = '__clear__';

export function SelectInput<V extends string | number>({
  value,
  onChange,
  options,
  placeholder,
  disabled,
}: {
  value: V | '';
  onChange: (v: V | '') => void;
  options: { value: V; label: string }[];
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <Select
      value={value === '' ? undefined : String(value)}
      onValueChange={(v) => onChange(v === CLEAR_VALUE ? '' : (v as V))}
      disabled={disabled}
    >
      <SelectTrigger className="w-full min-w-0">
        <SelectValue placeholder={placeholder ?? '—'} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={CLEAR_VALUE}>{placeholder ?? '—'}</SelectItem>
        {options.map((o) => (
          <SelectItem key={String(o.value)} value={String(o.value)}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
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
