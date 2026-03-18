'use client';

import { useState } from 'react';

interface TicketCategory {
  id: number;
  name: string;
  price: string;
  stock_allocated: number;
}

interface BookingPanelProps {
  eventId: number;
  categories: TicketCategory[];
  dateStart: string;
  dateEnd: string;
  totalStock: number;
}

const ACCENT = '#4A7C6F';

function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

export default function BookingPanel({
  eventId,
  categories,
  dateStart,
  dateEnd,
  totalStock,
}: BookingPanelProps) {
  const [selectedId, setSelectedId] = useState<number>(categories[0]?.id ?? 0);
  const [quantity, setQuantity]     = useState(1);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');

  const selected   = categories.find((c) => c.id === selectedId);
  const unitPrice  = selected ? Number(selected.price) : 0;
  const total      = unitPrice * quantity;
  const isFree     = unitPrice === 0;

  async function handleCheckout() {
    if (!selected) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, categoryId: selected.id, quantity }),
      });

      const data = await res.json() as { url?: string; message?: string };

      if (!res.ok) {
        setError(data.message ?? 'Une erreur est survenue.');
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setError('Erreur réseau. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        width: '280px',
        flexShrink: 0,
        border: '1px solid var(--border)',
        padding: '24px',
        position: 'sticky',
        top: '24px',
      }}
    >
      {/* Price display */}
      <p
        style={{
          fontFamily: 'var(--font-playfair)',
          fontSize: '1.5rem',
          fontWeight: 700,
          marginBottom: '4px',
        }}
      >
        {isFree ? 'Gratuit' : `Dès ${Math.min(...categories.map((c) => Number(c.price))).toFixed(0)} MAD`}
      </p>
      <p style={{ fontSize: '0.8125rem', color: 'var(--muted)', marginBottom: '20px' }}>
        {formatDateShort(dateStart)} — {formatDateShort(dateEnd)}
      </p>

      {/* Category selector */}
      <div style={{ marginBottom: '16px' }}>
        <p
          style={{
            fontSize: '0.6875rem',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--muted)',
            fontWeight: 600,
            marginBottom: '8px',
          }}
        >
          Catégorie
        </p>
        {categories.map((cat) => {
          const active = cat.id === selectedId;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedId(cat.id)}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
                padding: '10px 12px',
                marginBottom: '4px',
                border: `1px solid ${active ? ACCENT : 'var(--border)'}`,
                background: active ? `${ACCENT}0A` : 'transparent',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: active ? 600 : 400,
                    color: active ? ACCENT : 'var(--foreground)',
                    marginBottom: '2px',
                  }}
                >
                  {cat.name}
                </p>
                <p style={{ fontSize: '0.6875rem', color: 'var(--muted)' }}>
                  {cat.stock_allocated} places
                </p>
              </div>
              <span
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: Number(cat.price) === 0 ? ACCENT : 'var(--foreground)',
                  flexShrink: 0,
                  marginLeft: '8px',
                }}
              >
                {Number(cat.price) === 0 ? 'Gratuit' : `${Number(cat.price).toFixed(0)} MAD`}
              </span>
            </button>
          );
        })}
      </div>

      {/* Quantity selector */}
      {!isFree && (
        <div style={{ marginBottom: '20px' }}>
          <p
            style={{
              fontSize: '0.6875rem',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--muted)',
              fontWeight: 600,
              marginBottom: '8px',
            }}
          >
            Quantité
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0', border: '1px solid var(--border)', width: 'fit-content' }}>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              style={{
                width: '36px',
                height: '36px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: '1.125rem',
                color: 'var(--foreground)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              −
            </button>
            <span
              style={{
                width: '40px',
                textAlign: 'center',
                fontSize: '0.875rem',
                fontWeight: 600,
                borderLeft: '1px solid var(--border)',
                borderRight: '1px solid var(--border)',
                lineHeight: '36px',
              }}
            >
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(10, q + 1))}
              style={{
                width: '36px',
                height: '36px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: '1.125rem',
                color: 'var(--foreground)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              +
            </button>
          </div>
        </div>
      )}

      {/* Total */}
      {!isFree && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 0',
            borderTop: '1px solid var(--border)',
            borderBottom: '1px solid var(--border)',
            marginBottom: '16px',
          }}
        >
          <span style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>Total</span>
          <span style={{ fontSize: '1.0625rem', fontWeight: 700 }}>
            {total.toFixed(0)} MAD
          </span>
        </div>
      )}

      {/* Error */}
      {error && (
        <p
          style={{
            fontSize: '0.8125rem',
            color: '#C2533A',
            marginBottom: '12px',
            padding: '8px 12px',
            background: 'rgba(194,83,58,0.08)',
            border: '1px solid rgba(194,83,58,0.2)',
          }}
        >
          {error}
        </p>
      )}

      {/* CTA */}
      <button
        className="btn-primary"
        onClick={handleCheckout}
        disabled={loading || !selected}
        style={{
          width: '100%',
          textAlign: 'center',
          opacity: loading ? 0.7 : 1,
          cursor: loading ? 'wait' : 'pointer',
        }}
      >
        {loading
          ? 'Redirection…'
          : isFree
          ? 'Réserver gratuitement'
          : `Payer ${total.toFixed(0)} MAD`}
      </button>

      {/* Stripe badge */}
      {!isFree && (
        <p
          style={{
            fontSize: '0.6875rem',
            color: 'var(--muted)',
            textAlign: 'center',
            marginTop: '12px',
            letterSpacing: '0.04em',
          }}
        >
          🔒 Paiement sécurisé via Stripe
        </p>
      )}

      {/* Stock info */}
      <p
        style={{
          fontSize: '0.75rem',
          color: 'var(--muted)',
          textAlign: 'center',
          marginTop: '8px',
        }}
      >
        {totalStock} places au total
      </p>
    </div>
  );
}
