'use client';

import { useCallback, useState } from 'react';
import { DashboardPage } from '@/components/DashboardAnimations';
import AdminListShell, { type Column } from '@/components/admin/AdminListShell';
import StatusPill from '@/components/admin/StatusPill';
import { useAdminList } from '@/lib/admin/use-admin-list';
import {
  listReviews,
  setReviewStatus,
  type AdminReview,
  type ReviewStatus,
} from '@/lib/admin/transactions';

const PAGE_SIZE = 15;
const REVIEW_STATUSES: ReviewStatus[] = ['PENDING', 'APPROVED', 'UNAPPROVED'];

function Stars({ n }: { n: number }) {
  return (
    <span style={{ color: 'var(--gold, #FDBB24)', letterSpacing: '1px' }} aria-label={`${n} sur 5`}>
      {'★'.repeat(n)}
      <span style={{ color: 'var(--border)' }}>{'★'.repeat(5 - n)}</span>
    </span>
  );
}

export default function AdminReviewsPage() {
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | ''>('');
  const [ratingFilter, setRatingFilter] = useState<number | ''>('');

  const list = useAdminList<AdminReview>(
    useCallback(
      (q) =>
        listReviews({
          page: q.page,
          limit: PAGE_SIZE,
          search: q.search,
          status: statusFilter || undefined,
          rating: ratingFilter === '' ? undefined : ratingFilter,
          sortBy: 'createdAt',
          sortOrder: 'DESC',
        }),
      [statusFilter, ratingFilter],
    ),
    [statusFilter, ratingFilter],
  );

  async function moderate(id: number, status: ReviewStatus) {
    await setReviewStatus(id, status);
    await list.reload();
  }

  const columns: Column<AdminReview>[] = [
    { header: 'Note', width: '110px', cell: (r) => <Stars n={r.rating} /> },
    {
      header: 'Commentaire',
      cell: (r) => (
        <span style={{ fontSize: '0.875rem' }}>{r.comment || <span style={{ color: 'var(--muted)' }}>—</span>}</span>
      ),
    },
    {
      header: 'Événement',
      cell: (r) => (
        <span style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>{r.event?.title || '—'}</span>
      ),
    },
    {
      header: 'Auteur',
      cell: (r) => (
        <span style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>
          {r.user?.full_name || r.user?.username || '—'}
        </span>
      ),
    },
    { header: 'Statut', width: '120px', cell: (r) => <StatusPill status={r.status} /> },
    {
      header: 'Actions',
      align: 'end',
      width: '220px',
      cell: (r) => (
        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={() => void moderate(r.id, 'APPROVED')}
            disabled={r.status === 'APPROVED'}
            style={{ ...smallBtn, color: '#2E8B6A', opacity: r.status === 'APPROVED' ? 0.4 : 1 }}
          >
            Approuver
          </button>
          <button
            type="button"
            onClick={() => void moderate(r.id, 'UNAPPROVED')}
            disabled={r.status === 'UNAPPROVED'}
            style={{ ...smallBtn, color: '#C4623F', opacity: r.status === 'UNAPPROVED' ? 0.4 : 1 }}
          >
            Rejeter
          </button>
        </div>
      ),
    },
  ];

  return (
    <DashboardPage>
      <AdminListShell<AdminReview>
        eyebrow="Administration"
        title="Avis & commentaires"
        subtitle="Modérez les avis laissés par les utilisateurs."
        searchPlaceholder="Rechercher un commentaire, un auteur, un événement…"
        searchValue={list.searchInput}
        onSearchChange={list.setSearchInput}
        extraFilters={
          <>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as ReviewStatus | ''); list.setPage(1); }}
              className="search-input"
              style={{ cursor: 'pointer' }}
              aria-label="Filtrer par statut"
            >
              <option value="">Tous les statuts</option>
              {REVIEW_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select
              value={ratingFilter === '' ? '' : String(ratingFilter)}
              onChange={(e) => { setRatingFilter(e.target.value === '' ? '' : Number(e.target.value)); list.setPage(1); }}
              className="search-input"
              style={{ cursor: 'pointer' }}
              aria-label="Filtrer par note"
            >
              <option value="">Toutes les notes</option>
              {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} ★</option>)}
            </select>
          </>
        }
        columns={columns}
        rows={list.data}
        rowKey={(r) => r.id}
        loading={list.loading}
        error={list.error}
        emptyMessage="Aucun avis trouvé."
        onRetry={list.reload}
        page={list.page}
        pageCount={list.meta?.totalPages ?? 1}
        total={list.meta?.total ?? 0}
        onPageChange={list.setPage}
      />
    </DashboardPage>
  );
}

const smallBtn: React.CSSProperties = {
  background: 'none', border: '1px solid var(--border)', borderRadius: '4px',
  padding: '5px 10px', fontSize: '0.75rem', cursor: 'pointer', color: 'var(--foreground)',
  whiteSpace: 'nowrap',
};
