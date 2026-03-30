'use client';

import { useRef, useState } from 'react';
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
  image_url: string;
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
  image_url: '',
  categories: [],
};

function toDateInput(iso?: string): string {
  if (!iso) return '';
  return iso.slice(0, 10);
}

function validate(form: EventFormData): Record<string, string> {
  const e: Record<string, string> = {};

  if (!form.title.trim()) e.title = 'Le titre est requis.';
  else if (form.title.trim().length < 3) e.title = 'Minimum 3 caractères.';

  if (!form.description.trim()) e.description = 'La description est requise.';
  else if (form.description.trim().length < 10) e.description = 'Minimum 10 caractères.';

  if (!form.date_start) e.date_start = 'La date de début est requise.';

  if (!form.date_end) e.date_end = 'La date de fin est requise.';
  else if (form.date_start && form.date_end < form.date_start)
    e.date_end = 'Doit être après la date de début.';

  if (!form.location_name.trim()) e.location_name = 'Le lieu est requis.';
  else if (form.location_name.trim().length < 3) e.location_name = 'Minimum 3 caractères.';

  if (form.latitude !== '') {
    const lat = Number(form.latitude);
    if (isNaN(lat) || lat < -90 || lat > 90) e.latitude = 'Entre -90 et 90.';
  }

  if (form.longitude !== '') {
    const lon = Number(form.longitude);
    if (isNaN(lon) || lon < -180 || lon > 180) e.longitude = 'Entre -180 et 180.';
  }

  if (form.total_stock !== '') {
    const stock = Number(form.total_stock);
    if (!Number.isInteger(stock) || stock < 0) e.total_stock = 'Entier positif ou zéro requis.';
  }

  form.categories.forEach((cat, i) => {
    if (!cat.name.trim()) e[`cat_${i}_name`] = 'Le nom est requis.';
    const price = Number(cat.price);
    if (isNaN(price) || price < 0) e[`cat_${i}_price`] = 'Prix invalide (≥ 0).';
    const stock = Number(cat.stock_allocated);
    if (!Number.isInteger(stock) || stock < 0) e[`cat_${i}_stock`] = 'Entier ≥ 0 requis.';
  });

  return e;
}

const accent = '#C2533A';

const errMsg: React.CSSProperties = {
  fontSize: '0.75rem',
  color: accent,
  marginTop: '4px',
};

export default function EventForm({ initial, eventId }: EventFormProps) {
  const router = useRouter();
  const isEdit = !!eventId;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setFormState] = useState<EventFormData>({
    ...EMPTY,
    ...initial,
    date_start: toDateInput(initial?.date_start),
    date_end: toDateInput(initial?.date_end),
    image_url: initial?.image_url ?? '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState('');

  function setField<K extends keyof EventFormData>(key: K, value: EventFormData[K]) {
    setFormState((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => { const n = { ...prev }; delete n[key]; return n; });
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadErr('');
    setUploading(true);

    const data = new FormData();
    data.append('file', file);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: data });
      const json = await res.json() as { url?: string; message?: string };
      if (!res.ok) throw new Error(json.message ?? 'Erreur lors de l\'upload.');
      setField('image_url', json.url ?? '');
    } catch (err) {
      setUploadErr(err instanceof Error ? err.message : 'Erreur inconnue.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function addCategory() {
    setField('categories', [...form.categories, { name: '', price: 0, stock_allocated: 0 }]);
  }

  function removeCategory(i: number) {
    setField('categories', form.categories.filter((_, idx) => idx !== i));
    setErrors((prev) => {
      const n = { ...prev };
      delete n[`cat_${i}_name`];
      delete n[`cat_${i}_price`];
      delete n[`cat_${i}_stock`];
      return n;
    });
  }

  function updateCategory(i: number, field: keyof TicketCategory, value: string | number) {
    const updated = form.categories.map((cat, idx) =>
      idx === i ? { ...cat, [field]: value } : cat,
    );
    setField('categories', updated);
    const errKey = field === 'name' ? `cat_${i}_name` : field === 'price' ? `cat_${i}_price` : `cat_${i}_stock`;
    if (errors[errKey]) setErrors((prev) => { const n = { ...prev }; delete n[errKey]; return n; });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
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
      image_url: form.image_url || undefined,
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

  function inputStyle(field: string): React.CSSProperties {
    return {
      width: '100%',
      border: `1.5px solid ${errors[field] ? accent : 'var(--border)'}`,
      background: 'transparent',
      padding: '10px 14px',
      fontSize: '0.9375rem',
      color: 'var(--foreground)',
      outline: 'none',
      fontFamily: 'var(--font-inter), system-ui, sans-serif',
    };
  }

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
    <form onSubmit={handleSubmit} noValidate>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '680px' }}>

        {/* Image upload */}
        <div>
          <label style={labelStyle}>Photo de l&apos;événement</label>

          {/* Preview */}
          {form.image_url ? (
            <div style={{ position: 'relative', marginBottom: '10px' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={form.image_url}
                alt="Aperçu"
                style={{
                  width: '100%',
                  height: '220px',
                  objectFit: 'cover',
                  display: 'block',
                  border: '1px solid var(--border)',
                }}
              />
              <button
                type="button"
                onClick={() => setField('image_url', '')}
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  background: 'rgba(0,0,0,0.6)',
                  color: '#fff',
                  border: 'none',
                  padding: '4px 10px',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  letterSpacing: '0.05em',
                }}
              >
                × Supprimer
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed var(--border)`,
                padding: '32px 20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                marginBottom: '10px',
                transition: 'border-color 0.2s',
              }}
            >
              <span style={{ fontSize: '2rem', opacity: 0.3 }}>↑</span>
              <p style={{ fontSize: '0.875rem', color: 'var(--muted)', textAlign: 'center' }}>
                {uploading ? 'Envoi en cours…' : 'Cliquez pour sélectionner une photo'}
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--muted)', opacity: 0.6 }}>
                JPEG, PNG ou WebP · max 5 Mo
              </p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          {!form.image_url && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              style={{
                fontSize: '0.8125rem',
                color: accent,
                background: 'transparent',
                border: `1px solid ${accent}`,
                padding: '6px 16px',
                cursor: uploading ? 'not-allowed' : 'pointer',
                opacity: uploading ? 0.6 : 1,
                fontFamily: 'var(--font-inter), system-ui, sans-serif',
              }}
            >
              {uploading ? 'Envoi…' : '+ Choisir une photo'}
            </button>
          )}

          {form.image_url && !uploading && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              style={{
                fontSize: '0.8125rem',
                color: 'var(--muted)',
                background: 'transparent',
                border: '1px solid var(--border)',
                padding: '6px 16px',
                cursor: 'pointer',
                fontFamily: 'var(--font-inter), system-ui, sans-serif',
              }}
            >
              Changer la photo
            </button>
          )}

          {uploadErr && <p style={errMsg}>{uploadErr}</p>}
        </div>

        {/* Title */}
        <div>
          <label style={labelStyle}>Titre *</label>
          <input
            style={inputStyle('title')}
            value={form.title}
            onChange={(e) => setField('title', e.target.value)}
            maxLength={200}
          />
          {errors.title && <p style={errMsg}>{errors.title}</p>}
        </div>

        {/* Description */}
        <div>
          <label style={labelStyle}>Description *</label>
          <textarea
            style={{ ...inputStyle('description'), minHeight: '120px', resize: 'vertical' }}
            value={form.description}
            onChange={(e) => setField('description', e.target.value)}
          />
          {errors.description && <p style={errMsg}>{errors.description}</p>}
        </div>

        {/* Dates */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Date de début *</label>
            <input
              style={inputStyle('date_start')}
              type="date"
              value={form.date_start}
              onChange={(e) => setField('date_start', e.target.value)}
            />
            {errors.date_start && <p style={errMsg}>{errors.date_start}</p>}
          </div>
          <div>
            <label style={labelStyle}>Date de fin *</label>
            <input
              style={inputStyle('date_end')}
              type="date"
              value={form.date_end}
              onChange={(e) => setField('date_end', e.target.value)}
            />
            {errors.date_end && <p style={errMsg}>{errors.date_end}</p>}
          </div>
        </div>

        {/* Location */}
        <div>
          <label style={labelStyle}>Lieu *</label>
          <input
            style={inputStyle('location_name')}
            value={form.location_name}
            onChange={(e) => setField('location_name', e.target.value)}
            maxLength={255}
          />
          {errors.location_name && <p style={errMsg}>{errors.location_name}</p>}
        </div>

        {/* City + Category */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Ville</label>
            <input
              style={inputStyle('city')}
              value={form.city}
              onChange={(e) => setField('city', e.target.value)}
              placeholder="ex: Marrakech"
              maxLength={100}
            />
          </div>
          <div>
            <label style={labelStyle}>Catégorie</label>
            <select
              style={{ ...inputStyle('category'), cursor: 'pointer' }}
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
              style={inputStyle('latitude')}
              type="number"
              step="any"
              min={-90}
              max={90}
              value={form.latitude}
              onChange={(e) => setField('latitude', e.target.value)}
              placeholder="ex: 31.6295"
            />
            {errors.latitude && <p style={errMsg}>{errors.latitude}</p>}
          </div>
          <div>
            <label style={labelStyle}>Longitude</label>
            <input
              style={inputStyle('longitude')}
              type="number"
              step="any"
              min={-180}
              max={180}
              value={form.longitude}
              onChange={(e) => setField('longitude', e.target.value)}
              placeholder="ex: -7.9811"
            />
            {errors.longitude && <p style={errMsg}>{errors.longitude}</p>}
          </div>
        </div>

        {/* Total stock + is_active */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '16px', alignItems: 'end' }}>
          <div>
            <label style={labelStyle}>Capacité totale</label>
            <input
              style={inputStyle('total_stock')}
              type="number"
              min={0}
              step={1}
              value={form.total_stock}
              onChange={(e) => setField('total_stock', e.target.value)}
              placeholder="0"
            />
            {errors.total_stock && <p style={errMsg}>{errors.total_stock}</p>}
          </div>
          <div style={{ paddingBottom: errors.total_stock ? '28px' : '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                alignItems: 'start',
              }}
            >
              <div>
                <label style={{ ...labelStyle, marginBottom: '4px' }}>Nom</label>
                <input
                  style={{
                    width: '100%', border: `1.5px solid ${errors[`cat_${i}_name`] ? accent : 'var(--border)'}`,
                    background: 'transparent', padding: '10px 14px', fontSize: '0.9375rem',
                    color: 'var(--foreground)', outline: 'none',
                    fontFamily: 'var(--font-inter), system-ui, sans-serif',
                  }}
                  value={cat.name}
                  onChange={(e) => updateCategory(i, 'name', e.target.value)}
                  placeholder="Ex: VIP"
                />
                {errors[`cat_${i}_name`] && <p style={errMsg}>{errors[`cat_${i}_name`]}</p>}
              </div>
              <div>
                <label style={{ ...labelStyle, marginBottom: '4px' }}>Prix (MAD)</label>
                <input
                  style={{
                    width: '100%', border: `1.5px solid ${errors[`cat_${i}_price`] ? accent : 'var(--border)'}`,
                    background: 'transparent', padding: '10px 14px', fontSize: '0.9375rem',
                    color: 'var(--foreground)', outline: 'none',
                    fontFamily: 'var(--font-inter), system-ui, sans-serif',
                  }}
                  type="number"
                  min={0}
                  step="0.01"
                  value={cat.price}
                  onChange={(e) => updateCategory(i, 'price', e.target.value)}
                />
                {errors[`cat_${i}_price`] && <p style={errMsg}>{errors[`cat_${i}_price`]}</p>}
              </div>
              <div>
                <label style={{ ...labelStyle, marginBottom: '4px' }}>Places</label>
                <input
                  style={{
                    width: '100%', border: `1.5px solid ${errors[`cat_${i}_stock`] ? accent : 'var(--border)'}`,
                    background: 'transparent', padding: '10px 14px', fontSize: '0.9375rem',
                    color: 'var(--foreground)', outline: 'none',
                    fontFamily: 'var(--font-inter), system-ui, sans-serif',
                  }}
                  type="number"
                  min={0}
                  step={1}
                  value={cat.stock_allocated}
                  onChange={(e) => updateCategory(i, 'stock_allocated', e.target.value)}
                />
                {errors[`cat_${i}_stock`] && <p style={errMsg}>{errors[`cat_${i}_stock`]}</p>}
              </div>
              <button
                type="button"
                onClick={() => removeCategory(i)}
                style={{
                  background: 'transparent', border: 'none', color: 'var(--muted)',
                  cursor: 'pointer', fontSize: '1.25rem', lineHeight: 1,
                  padding: '10px 6px', marginTop: '20px',
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>

        {/* API Error */}
        {error && (
          <p style={{ fontSize: '0.875rem', color: accent }}>{error}</p>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px', paddingTop: '8px' }}>
          <button
            type="submit"
            className="btn-primary"
            disabled={loading || uploading}
            style={{ opacity: loading || uploading ? 0.6 : 1 }}
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
