'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface TicketCategory {
  name: string;
  price: number;
  stock_allocated: number;
}

const EVENT_CATEGORIES = ['Musique', 'Sport', 'Culture', 'Cinema', 'Humour', 'Art', 'Autre'];

export interface EventFormData {
  title: string;
  description: string;
  date_start: string;
  date_end: string;
  location_name: string;
  city: string;
  category: string;
  latitude: string;
  longitude: string;
  total_stock: string;
  is_active: boolean;
  categories: TicketCategory[];
}

interface EventFormProps {
  initial?: Partial<EventFormData>;
  eventId?: number;
}

const EMPTY: EventFormData = {
  title: '',
  description: '',
  date_start: '',
  date_end: '',
  location_name: '',
  city: '',
  category: '',
  latitude: '',
  longitude: '',
  total_stock: '',
  is_active: true,
  categories: [],
};

function toDateInput(iso?: string): string {
  if (!iso) return '';
  return iso.slice(0, 10);
}

const accent = '#C2533A';

export default function EventForm({ initial, eventId }: EventFormProps) {
  const router = useRouter();
  const isEdit = !!eventId;

  const [form, setForm] = useState<EventFormData>({
    ...EMPTY,
    ...initial,
    date_start: toDateInput(initial?.date_start),
    date_end: toDateInput(initial?.date_end),
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function setField<K extends keyof EventFormData>(key: K, value: EventFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function addCategory() {
    setField('categories', [...form.categories, { name: '', price: 0, stock_allocated: 0 }]);
  }

  function removeCategory(i: number) {
    setField('categories', form.categories.filter((_, idx) => idx !== i));
  }

  function updateCategory(i: number, field: keyof TicketCategory, value: string | number) {
    const updated = form.categories.map((cat, idx) =>
      idx === i ? { ...cat, [field]: value } : cat,
    );
    setField('categories', updated);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const payload = {
      title: form.title,
      description: form.description,
      date_start: form.date_start,
      date_end: form.date_end,
      location_name: form.location_name,
      city: form.city || undefined,
      category: form.category || undefined,
      latitude: form.latitude ? Number(form.latitude) : undefined,
      longitude: form.longitude ? Number(form.longitude) : undefined,
      total_stock: form.total_stock ? Number(form.total_stock) : 0,
      is_active: form.is_active,
      categories: form.categories.map((c) => ({
        name: c.name,
        price: Number(c.price),
        stock_allocated: Number(c.stock_allocated),
      })),
    };

    try {
      const url = isEdit ? `/api/events/${eventId}` : '/api/events';
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = (await res.json()) as { message?: string };
        throw new Error(data.message ?? 'Une erreur est survenue.');
      }

      router.push('/dashboard/admin/events');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue.');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    border: '1.5px solid var(--border)',
    background: 'transparent',
    padding: '10px 14px',
    fontSize: '0.9375rem',
    color: 'var(--foreground)',
    outline: 'none',
    fontFamily: 'var(--font-inter), system-ui, sans-serif',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.75rem',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: 'var(--muted)',
    marginBottom: '6px',
    fontWeight: 500,
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '680px' }}>

        {/* Title */}
        <div>
          <label style={labelStyle}>Titre *</label>
          <input
            style={inputStyle}
            value={form.title}
            onChange={(e) => setField('title', e.target.value)}
            required
            maxLength={200}
          />
        </div>

        {/* Description */}
        <div>
          <label style={labelStyle}>Description *</label>
          <textarea
            style={{ ...inputStyle, minHeight: '120px', resize: 'vertical' }}
            value={form.description}
            onChange={(e) => setField('description', e.target.value)}
            required
          />
        </div>

        {/* Dates */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Date de début *</label>
            <input
              style={inputStyle}
              type="date"
              value={form.date_start}
              onChange={(e) => setField('date_start', e.target.value)}
              required
            />
          </div>
          <div>
            <label style={labelStyle}>Date de fin *</label>
            <input
              style={inputStyle}
              type="date"
              value={form.date_end}
              onChange={(e) => setField('date_end', e.target.value)}
              required
            />
          </div>
        </div>

        {/* Location */}
        <div>
          <label style={labelStyle}>Lieu *</label>
          <input
            style={inputStyle}
            value={form.location_name}
            onChange={(e) => setField('location_name', e.target.value)}
            required
            maxLength={255}
          />
        </div>

        {/* City + Category */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Ville</label>
            <input
              style={inputStyle}
              value={form.city}
              onChange={(e) => setField('city', e.target.value)}
              placeholder="ex: Marrakech"
              maxLength={100}
            />
          </div>
          <div>
            <label style={labelStyle}>Catégorie</label>
            <select
              style={{ ...inputStyle, cursor: 'pointer' }}
              value={form.category}
              onChange={(e) => setField('category', e.target.value)}
            >
              <option value="">— Sélectionner —</option>
              {EVENT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Coordinates */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Latitude</label>
            <input
              style={inputStyle}
              type="number"
              step="any"
              value={form.latitude}
              onChange={(e) => setField('latitude', e.target.value)}
              placeholder="ex: 31.6295"
            />
          </div>
          <div>
            <label style={labelStyle}>Longitude</label>
            <input
              style={inputStyle}
              type="number"
              step="any"
              value={form.longitude}
              onChange={(e) => setField('longitude', e.target.value)}
              placeholder="ex: -7.9811"
            />
          </div>
        </div>

        {/* Total stock + is_active */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '16px', alignItems: 'end' }}>
          <div>
            <label style={labelStyle}>Capacité totale</label>
            <input
              style={inputStyle}
              type="number"
              min={0}
              value={form.total_stock}
              onChange={(e) => setField('total_stock', e.target.value)}
              placeholder="0"
            />
          </div>
          <div style={{ paddingBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              id="is_active"
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setField('is_active', e.target.checked)}
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            />
            <label htmlFor="is_active" style={{ ...labelStyle, marginBottom: 0, cursor: 'pointer' }}>
              Actif
            </label>
          </div>
        </div>

        {/* Ticket categories */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <label style={labelStyle}>Catégories de billets</label>
            <button
              type="button"
              onClick={addCategory}
              style={{
                fontSize: '0.75rem',
                letterSpacing: '0.08em',
                color: accent,
                background: 'transparent',
                border: `1px solid ${accent}`,
                padding: '4px 10px',
                cursor: 'pointer',
                fontFamily: 'var(--font-inter), system-ui, sans-serif',
              }}
            >
              + Ajouter
            </button>
          </div>

          {form.categories.length === 0 && (
            <p style={{ fontSize: '0.8125rem', color: 'var(--muted)', fontStyle: 'italic' }}>
              Aucune catégorie — cliquez sur &quot;+ Ajouter&quot;.
            </p>
          )}

          {form.categories.map((cat, i) => (
            <div
              key={i}
              style={{
                border: '1px solid var(--border)',
                padding: '14px',
                marginBottom: '8px',
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr auto',
                gap: '10px',
                alignItems: 'end',
              }}
            >
              <div>
                <label style={{ ...labelStyle, marginBottom: '4px' }}>Nom</label>
                <input
                  style={inputStyle}
                  value={cat.name}
                  onChange={(e) => updateCategory(i, 'name', e.target.value)}
                  placeholder="Ex: VIP"
                  required
                />
              </div>
              <div>
                <label style={{ ...labelStyle, marginBottom: '4px' }}>Prix (MAD)</label>
                <input
                  style={inputStyle}
                  type="number"
                  min={0}
                  step="0.01"
                  value={cat.price}
                  onChange={(e) => updateCategory(i, 'price', e.target.value)}
                  required
                />
              </div>
              <div>
                <label style={{ ...labelStyle, marginBottom: '4px' }}>Places</label>
                <input
                  style={inputStyle}
                  type="number"
                  min={0}
                  value={cat.stock_allocated}
                  onChange={(e) => updateCategory(i, 'stock_allocated', e.target.value)}
                  required
                />
              </div>
              <button
                type="button"
                onClick={() => removeCategory(i)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--muted)',
                  cursor: 'pointer',
                  fontSize: '1.25rem',
                  lineHeight: 1,
                  padding: '10px 6px',
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <p style={{ fontSize: '0.875rem', color: accent }}>{error}</p>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px', paddingTop: '8px' }}>
          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ opacity: loading ? 0.6 : 1 }}
          >
            {loading ? 'Enregistrement…' : isEdit ? 'Enregistrer' : 'Créer'}
          </button>
          <button
            type="button"
            className="btn-outline"
            onClick={() => router.push('/dashboard/admin/events')}
          >
            Annuler
          </button>
        </div>
      </div>
    </form>
  );
}
