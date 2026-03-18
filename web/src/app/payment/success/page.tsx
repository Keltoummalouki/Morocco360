'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

interface TicketInfo {
  id: number;
  qrCode: string;
  qrDataUrl: string;
  category: string;
  event: string;
}

interface SuccessInfo {
  orderId: number;
  eventTitle: string;
  totalAmount: number;
  tickets: TicketInfo[];
}

const accent = '#4A7C6F';

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id') ?? undefined;
  const orderId = searchParams.get('order_id') ?? undefined;

  const [info, setInfo] = useState<SuccessInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 6; // retry up to 6×2s = 12s for webhook to fire

    async function fetchInfo() {
      const params = new URLSearchParams();
      if (sessionId) params.set('session_id', sessionId);
      if (orderId) params.set('order_id', orderId);

      try {
        const r = await fetch(`/api/payments/success-info?${params.toString()}`);
        if (!r.ok) return false;
        const data = (await r.json()) as SuccessInfo | null;
        if (data && data.tickets.length > 0) {
          setInfo(data);
          setLoading(false);
          return true;
        }
      } catch {
        // ignore, will retry
      }
      return false;
    }

    async function poll() {
      const found = await fetchInfo();
      if (!found && attempts < maxAttempts) {
        attempts++;
        setTimeout(() => void poll(), 2000);
      } else {
        setLoading(false);
      }
    }

    void poll();
  }, [sessionId, orderId]);

  return (
    <div
      style={{
        maxWidth: '520px',
        width: '100%',
        border: '1px solid var(--border)',
        padding: '48px 40px',
        textAlign: 'center',
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: `${accent}1A`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
          fontSize: '1.75rem',
        }}
      >
        ✓
      </div>

      <p
        style={{
          fontSize: '0.6875rem',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: accent,
          fontWeight: 600,
          marginBottom: '12px',
        }}
      >
        Paiement confirmé
      </p>

      <h1
        style={{
          fontFamily: 'var(--font-playfair)',
          fontSize: '1.75rem',
          fontWeight: 700,
          marginBottom: '16px',
        }}
      >
        Réservation réussie !
      </h1>

      <p style={{ color: 'var(--muted)', fontSize: '0.9375rem', lineHeight: 1.6, marginBottom: '24px' }}>
        Votre paiement a été traité avec succès. Vos billets ont été générés.
      </p>

      {/* QR Codes section */}
      {loading ? (
        <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '24px' }}>
          Chargement de vos billets...
        </p>
      ) : info && info.tickets.length > 0 ? (
        <div style={{ marginBottom: '32px' }}>
          <p style={{ fontSize: '0.8125rem', color: 'var(--muted)', marginBottom: '16px' }}>
            Commande{' '}
            <strong style={{ color: 'var(--foreground)' }}>#{info.orderId}</strong>
            {' — '}
            <strong style={{ color: 'var(--foreground)' }}>{info.eventTitle}</strong>
          </p>

          <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
            <a
              href={`/api/payments/order/${info.orderId}/pdf`}
              download={`billets-commande-${info.orderId}.pdf`}
              style={{
                display: 'inline-block',
                background: '#1a1a1a',
                color: '#fff',
                padding: '10px 24px',
                borderRadius: '4px',
                fontSize: '0.8125rem',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textDecoration: 'none',
                textTransform: 'uppercase',
              }}
            >
              Telecharger mes billets (PDF)
            </a>
            <p style={{ fontSize: '0.8125rem', color: 'var(--muted)', margin: 0 }}>
              Vos billets ont egalement ete envoyes par email.
            </p>
          </div>
        </div>
      ) : null}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <Link
          href="/dashboard/user/events"
          className="btn-primary"
          style={{ display: 'block', textAlign: 'center' }}
        >
          Voir les événements
        </Link>
        <Link
          href="/dashboard/user"
          style={{ fontSize: '0.875rem', color: 'var(--muted)', textDecoration: 'underline' }}
        >
          Retour au tableau de bord
        </Link>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--background)',
        padding: '24px',
      }}
    >
      <Suspense fallback={
        <div style={{ textAlign: 'center', color: 'var(--muted)' }}>
          Chargement...
        </div>
      }>
        <SuccessContent />
      </Suspense>
    </div>
  );
}
