'use client';

import { useCallback, useEffect, useState } from 'react';
import { DashboardPage } from '@/components/DashboardAnimations';
import AdminListShell, { type Column } from '@/components/admin/AdminListShell';
import StatusPill from '@/components/admin/StatusPill';
import { useAdminList } from '@/lib/admin/use-admin-list';
import {
  getBooking,
  listBookings,
  setBookingStatus,
  setTicketStatus,
  type BookingDetail,
  type BookingSummary,
  type OrderStatus,
  type TicketStatus,
} from '@/lib/admin/transactions';

const PAGE_SIZE = 15;
const ORDER_STATUSES: OrderStatus[] = ['PENDING', 'PAID', 'CANCELLED', 'REFUNDED', 'SUSPENDED'];
const TICKET_STATUSES: TicketStatus[] = ['PENDING', 'VALID', 'CHECKED', 'CANCELLED', 'REFUNDED', 'SUSPENDED'];

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AdminBookingsPage() {
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
  const [eventId, setEventId] = useState<number | undefined>(undefined);

  // Read an optional ?eventId= scope (linked from the event manage page).
  useEffect(() => {
    const ev = new URLSearchParams(window.location.search).get('eventId');
    if (ev) setEventId(Number(ev));
  }, []);

  const list = useAdminList<BookingSummary>(
    useCallback(
      (q) =>
        listBookings({
          page: q.page,
          limit: PAGE_SIZE,
          search: q.search,
          status: statusFilter || undefined,
          eventId,
          sortBy: 'createdAt',
          sortOrder: 'DESC',
        }),
      [statusFilter, eventId],
    ),
    [statusFilter, eventId],
  );

  const [detail, setDetail] = useState<BookingDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  async function openDetail(id: number) {
    setDetailLoading(true);
    setDetail(null);
    try {
      setDetail(await getBooking(id));
    } finally {
      setDetailLoading(false);
    }
  }

  async function changeOrderStatus(status: OrderStatus) {
    if (!detail) return;
    const updated = await setBookingStatus(detail.id, status);
    setDetail(updated);
    await list.reload();
  }

  async function changeTicketStatus(ticketId: number, status: TicketStatus) {
    await setTicketStatus(ticketId, status);
    if (detail) await openDetail(detail.id);
    await list.reload();
  }

  const columns: Column<BookingSummary>[] = [
    { header: '#', width: '70px', cell: (r) => <span style={{ fontWeight: 600 }}>#{r.id}</span> },
    {
      header: 'Client',
      cell: (r) => (
        <div>
          <span style={{ fontWeight: 500 }}>{r.user?.full_name || r.user?.username || '—'}</span>
          <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted)' }}>{r.user?.email}</span>
        </div>
      ),
    },
    { header: 'Montant', width: '120px', cell: (r) => <span>{Number(r.total_amount).toLocaleString('fr-FR')} MAD</span> },
    { header: 'Billets', width: '80px', cell: (r) => <span style={{ color: 'var(--muted)' }}>{r.ticketCount}</span> },
    { header: 'Statut', width: '130px', cell: (r) => <StatusPill status={r.status} label={r.status} /> },
    {
      header: '',
      align: 'end',
      width: '110px',
      cell: (r) => (
        <button type="button" onClick={() => void openDetail(r.id)} style={detailBtn}>
          Détails
        </button>
      ),
    },
  ];

  return (
    <DashboardPage>
      <AdminListShell<BookingSummary>
        eyebrow="Administration"
        title="Réservations"
        subtitle="Suivez et gérez les réservations et leurs billets."
        searchPlaceholder="Rechercher par #, client, référence…"
        searchValue={list.searchInput}
        onSearchChange={list.setSearchInput}
        extraFilters={
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as OrderStatus | '');
              list.setPage(1);
            }}
            className="search-input"
            style={{ cursor: 'pointer' }}
            aria-label="Filtrer par statut"
          >
            <option value="">Tous les statuts</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        }
        columns={columns}
        rows={list.data}
        rowKey={(r) => r.id}
        loading={list.loading}
        error={list.error}
        emptyMessage="Aucune réservation trouvée."
        onRetry={list.reload}
        page={list.page}
        pageCount={list.meta?.totalPages ?? 1}
        total={list.meta?.total ?? 0}
        onPageChange={list.setPage}
      />

      {(detail || detailLoading) && (
        <div onClick={() => setDetail(null)} style={overlay}>
          <div onClick={(e) => e.stopPropagation()} style={panel}>
            {detailLoading || !detail ? (
              <div className="shimmer" style={{ height: '200px', borderRadius: '6px' }} />
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div>
                    <p style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.25rem', fontWeight: 700 }}>
                      Réservation #{detail.id}
                    </p>
                    <p style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>
                      {detail.user?.full_name || detail.user?.username} · {fmt(detail.created_at)}
                    </p>
                  </div>
                  <StatusPill status={detail.status} label={detail.status} />
                </div>

                <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', fontSize: '0.875rem' }}>
                  <span>Total : <strong>{Number(detail.total_amount).toLocaleString('fr-FR')} MAD</strong></span>
                  {detail.payment && <span>Paiement : {detail.payment.status} ({detail.payment.gateway})</span>}
                </div>

                <h3 style={sectionLabel}>Changer le statut</h3>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '20px' }}>
                  {ORDER_STATUSES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => void changeOrderStatus(s)}
                      style={{ ...smallBtn, borderColor: detail.status === s ? 'var(--primary)' : 'var(--border)', color: detail.status === s ? 'var(--primary)' : 'var(--foreground)' }}
                    >
                      {s}
                    </button>
                  ))}
                </div>

                <h3 style={sectionLabel}>Billets ({detail.tickets.length})</h3>
                {detail.tickets.map((t) => (
                  <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)', gap: '8px', flexWrap: 'wrap' }}>
                    <div>
                      <span style={{ fontSize: '0.875rem' }}>#{t.id} · {t.category || '—'}</span>
                      <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted)' }}>{t.event?.title}</span>
                    </div>
                    <select
                      value={t.status}
                      onChange={(e) => void changeTicketStatus(t.id, e.target.value as TicketStatus)}
                      className="search-input"
                      style={{ width: 'auto', cursor: 'pointer', fontSize: '0.75rem', padding: '4px 8px' }}
                    >
                      {TICKET_STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                ))}

                <button type="button" onClick={() => setDetail(null)} className="btn-outline btn-sm" style={{ width: '100%', marginTop: '20px' }}>
                  <span>Fermer</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </DashboardPage>
  );
}

const detailBtn: React.CSSProperties = {
  background: 'none', border: '1px solid var(--border)', borderRadius: '4px',
  padding: '5px 12px', fontSize: '0.75rem', cursor: 'pointer', color: 'var(--foreground)',
};
const smallBtn: React.CSSProperties = { ...detailBtn, padding: '5px 10px' };
const sectionLabel: React.CSSProperties = {
  fontSize: '0.6875rem', letterSpacing: '0.1em', textTransform: 'uppercase',
  color: 'var(--muted)', marginBottom: '10px',
};
const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex',
  alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px',
};
const panel: React.CSSProperties = {
  background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '4px',
  padding: '32px', maxWidth: '560px', width: '100%', maxHeight: '90vh', overflowY: 'auto',
  boxShadow: '0 24px 64px -12px var(--shadow)',
};
