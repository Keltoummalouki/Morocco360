'use client';

import { useRef, useState, type ReactNode } from 'react';
import { ImagePlus, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
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
  description,
  onCancel,
  onSubmit,
  submitting,
  error,
  submitLabel = 'Enregistrer',
  wide = false,
  children,
}: {
  title: string;
  /** Optional one-line hint under the title. */
  description?: string;
  onCancel: () => void;
  onSubmit: () => void;
  submitting: boolean;
  error?: string | null;
  submitLabel?: string;
  /** Roomier column for forms with many fields (e.g. events). */
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      {/* The dialog itself no longer scrolls — only the field area does, so the
          title and the save button stay put on a long form. */}
      <DialogContent
        className={cn(
          'flex max-h-[min(88vh,52rem)] flex-col gap-0 overflow-hidden p-0',
          wide && 'max-w-160',
        )}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!submitting) onSubmit();
          }}
          className="flex min-h-0 flex-col"
        >
          <DialogHeader className="shrink-0 border-b border-border px-8 pt-8 pb-5">
            <DialogTitle>{title}</DialogTitle>
            {description && (
              <p className="mt-1.5 text-[0.8125rem] text-muted-foreground">
                {description}
              </p>
            )}
          </DialogHeader>

          <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-8 py-6">
            {children}
          </div>

          <DialogFooter className="shrink-0 flex-col-reverse gap-2 border-t border-border px-8 pt-5 pb-8 sm:flex-row">
            {error && (
              <p
                role="alert"
                className="mb-1 flex-1 text-[0.8125rem] sm:mb-0"
                style={{ color: 'var(--error)' }}
              >
                {error}
              </p>
            )}
            <div className="flex gap-3 sm:shrink-0">
              <button
                type="button"
                onClick={onCancel}
                className="btn-outline btn-sm"
                style={{ flex: 1 }}
              >
                <span>Annuler</span>
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary btn-sm"
                style={{ flex: 1, opacity: submitting ? 0.6 : 1 }}
              >
                {submitting ? 'Enregistrement…' : submitLabel}
              </button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Groups related fields under a small heading inside a modal. */
export function FormSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <h3 className="text-[0.6875rem] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
        {title}
      </h3>
      {children}
    </section>
  );
}

/** Side-by-side fields that stack on narrow screens. */
export function FieldRow({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
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
  required,
  hint,
  error,
  children,
}: {
  label: string;
  /** Marks the field visually and for screen readers. */
  required?: boolean;
  /** Persistent helper text — clearer than a placeholder, which disappears. */
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label style={{ display: 'block' }}>
      <span style={labelStyle}>
        {label}
        {required && (
          <>
            <span aria-hidden="true" style={{ color: 'var(--error)' }}>
              {' '}
              *
            </span>
            <span className="sr-only"> (requis)</span>
          </>
        )}
      </span>
      {children}
      {/* Error wins over the hint so the two never stack and shift the layout. */}
      {error ? (
        <span
          role="alert"
          className="mt-1.5 block text-[0.75rem]"
          style={{ color: 'var(--error)' }}
        >
          {error}
        </span>
      ) : hint ? (
        <span className="mt-1.5 block text-[0.75rem] text-muted-foreground">
          {hint}
        </span>
      ) : null}
    </label>
  );
}

export function TextInput({
  value,
  onChange,
  placeholder,
  required,
  maxLength,
  invalid,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  maxLength?: number;
  invalid?: boolean;
}) {
  return (
    <Input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      maxLength={maxLength}
      aria-invalid={invalid}
    />
  );
}

export function TextArea({
  value,
  onChange,
  placeholder,
  maxLength,
  rows = 3,
  invalid,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
  rows?: number;
  invalid?: boolean;
}) {
  return (
    <Textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      rows={rows}
      aria-invalid={invalid}
      className="min-h-18 resize-y"
    />
  );
}

export function NumberInput({
  value,
  onChange,
  placeholder,
  step,
  min,
  invalid,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  step?: string;
  min?: number;
  invalid?: boolean;
}) {
  return (
    <Input
      type="number"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      step={step}
      min={min}
      aria-invalid={invalid}
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
  function handleValueChange(nextValue: string) {
    if (nextValue === CLEAR_VALUE) {
      onChange('');
      return;
    }

    // Radix Select always emits strings. Return the original option value so
    // numeric IDs stay numbers at runtime instead of merely being cast as V.
    const selected = options.find(
      (option) => String(option.value) === nextValue,
    );
    if (selected) onChange(selected.value);
  }

  return (
    <Select
      value={value === '' ? undefined : String(value)}
      onValueChange={handleValueChange}
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

/**
 * Cover-image picker: drop zone until a file is chosen, then a preview with
 * replace / remove. Uploads through the same `/api/upload` route the organizer
 * event form uses, and reports the stored path back as a string.
 */
export function ImageUploadField({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError('');
    setUploading(true);
    const body = new FormData();
    body.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body,
        credentials: 'include',
      });
      const json = (await res.json()) as { url?: string; message?: string };
      if (!res.ok) throw new Error(json.message ?? 'Échec de l’envoi.');
      onChange(json.url ?? '');
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : 'Échec de l’envoi du fichier.',
      );
    } finally {
      setUploading(false);
      // Let the same file be picked again after a failure.
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFile}
        className="hidden"
        disabled={disabled || uploading}
      />

      {value ? (
        <div className="overflow-hidden rounded-md border border-border">
          {/* Uploads are arbitrary user files served from /public, so next/image
              buys nothing here and would need remote-pattern config. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Aperçu de la couverture"
            className="block h-40 w-full bg-muted object-cover"
          />
          <div className="flex gap-2 border-t border-border p-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1"
              disabled={disabled || uploading}
              onClick={() => inputRef.current?.click()}
            >
              {uploading ? 'Envoi…' : 'Remplacer'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="flex-1"
              disabled={disabled || uploading}
              onClick={() => {
                setUploadError('');
                onChange('');
              }}
            >
              Retirer
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || uploading}
          className="flex w-full flex-col items-center gap-2 rounded-md border border-dashed border-border bg-muted/40 px-4 py-7 transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-60"
        >
          {uploading ? (
            <Loader2
              className="size-5 animate-spin text-muted-foreground"
              aria-hidden="true"
            />
          ) : (
            <ImagePlus
              className="size-5 text-muted-foreground"
              aria-hidden="true"
            />
          )}
          <span className="text-[0.8125rem] font-medium">
            {uploading ? 'Envoi en cours…' : 'Ajouter une image de couverture'}
          </span>
          <span className="text-[0.75rem] text-muted-foreground">
            JPEG, PNG ou WebP · 5 Mo maximum
          </span>
        </button>
      )}

      {uploadError && (
        <p
          role="alert"
          className="mt-1.5 text-[0.75rem]"
          style={{ color: 'var(--error)' }}
        >
          {uploadError}
        </p>
      )}
    </div>
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
