'use client';

import { useCallback, useState } from 'react';
import { DashboardPage } from '@/components/DashboardAnimations';
import AdminListShell, { type Column } from '@/components/admin/AdminListShell';
import StatusPill from '@/components/admin/StatusPill';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAdminList } from '@/lib/admin/use-admin-list';
import {
  getInvoice,
  invoicePdfUrl,
  listPayments,
  setPaymentStatus,
  type Invoice,
  type PaymentGateway,
  type PaymentStatus,
  type PaymentSummary,
} from '@/lib/admin/transactions';

const PAGE_SIZE = 15;
const PAYMENT_STATUSES: PaymentStatus[] = ['PENDING', 'PAID', 'NOT_PAID', 'FAILED', 'REFUNDED', 'SUCCESS'];
const GATEWAYS: PaymentGateway[] = ['STRIPE', 'PAYPAL', 'BANK_CARD'];

// Radix Select forbids an item with value="" — this sentinel represents
// the "all" option and is translated back to '' below.
const ALL_VALUE = '__all__';

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AdminPaymentsPage() {
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | ''>('');
  const [gatewayFilter, setGatewayFilter] = useState<PaymentGateway | ''>('');

  const list = useAdminList<PaymentSummary>(
    useCallback(
      (q) =>
        listPayments({
          page: q.page,
          limit: PAGE_SIZE,
          search: q.search,
          status: statusFilter || undefined,
          gateway: gatewayFilter || undefined,
          sortBy: 'createdAt',
          sortOrder: 'DESC',
        }),
      [statusFilter, gatewayFilter],
    ),
    [statusFilter, gatewayFilter],
  );

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [invoiceId, setInvoiceId] = useState<number | null>(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);

  async function openInvoice(id: number) {
    setInvoiceId(id);
    setInvoice(null);
    setInvoiceLoading(true);
    try {
      setInvoice(await getInvoice(id));
    } finally {
      setInvoiceLoading(false);
    }
  }

  async function changeStatus(id: number, status: PaymentStatus) {
    await setPaymentStatus(id, status);
    await list.reload();
  }

  const columns: Column<PaymentSummary>[] = [
    { header: '#', width: '60px', cell: (r) => <span style={{ fontWeight: 600 }}>#{r.id}</span> },
    {
      header: 'Client',
      cell: (r) => (
        <div>
          <span style={{ fontWeight: 500 }}>{r.customer?.full_name || '—'}</span>
          <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted)' }}>{r.customer?.email}</span>
        </div>
      ),
    },
    { header: 'Montant', width: '120px', cell: (r) => <span>{Number(r.amount).toLocaleString('fr-FR')} {r.currency}</span> },
    { header: 'Passerelle', width: '110px', cell: (r) => <span style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>{r.gateway}</span> },
    { header: 'Facture', width: '150px', cell: (r) => <span style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>{r.invoice_number || '—'}</span> },
    {
      header: 'Statut',
      width: '150px',
      cell: (r) => (
        <Select value={r.status} onValueChange={(v) => void changeStatus(r.id, v as PaymentStatus)}>
          <SelectTrigger size="sm" className="w-auto text-xs" aria-label="Changer le statut">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAYMENT_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
    },
    {
      header: '',
      align: 'end',
      width: '110px',
      cell: (r) => (
        <button type="button" onClick={() => void openInvoice(r.id)} style={detailBtn}>
          Facture
        </button>
      ),
    },
  ];

  return (
    <DashboardPage>
      <AdminListShell<PaymentSummary>
        eyebrow="Administration"
        title="Paiements"
        subtitle="Consultez les paiements, changez leur statut et éditez les factures."
        searchPlaceholder="Rechercher par client, transaction, facture…"
        searchValue={list.searchInput}
        onSearchChange={list.setSearchInput}
        extraFilters={
          <>
            <Select
              value={statusFilter || ALL_VALUE}
              onValueChange={(v) => { setStatusFilter(v === ALL_VALUE ? '' : (v as PaymentStatus)); list.setPage(1); }}
            >
              <SelectTrigger className="w-[160px]" aria-label="Filtrer par statut">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUE}>Tous les statuts</SelectItem>
                {PAYMENT_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select
              value={gatewayFilter || ALL_VALUE}
              onValueChange={(v) => { setGatewayFilter(v === ALL_VALUE ? '' : (v as PaymentGateway)); list.setPage(1); }}
            >
              <SelectTrigger className="w-[180px]" aria-label="Filtrer par passerelle">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUE}>Toutes les passerelles</SelectItem>
                {GATEWAYS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
              </SelectContent>
            </Select>
          </>
        }
        columns={columns}
        rows={list.data}
        rowKey={(r) => r.id}
        loading={list.loading}
        error={list.error}
        emptyMessage="Aucun paiement trouvé."
        onRetry={list.reload}
        page={list.page}
        pageCount={list.meta?.totalPages ?? 1}
        total={list.meta?.total ?? 0}
        onPageChange={list.setPage}
      />

      {invoiceId !== null && (
        <Dialog open onOpenChange={(open) => !open && setInvoiceId(null)}>
          <DialogContent>
            {invoiceLoading || !invoice ? (
              <>
                <DialogTitle className="sr-only">Chargement de la facture</DialogTitle>
                <div className="shimmer" style={{ height: '220px', borderRadius: '6px' }} />
              </>
            ) : (
              <>
                <DialogHeader className="flex-row items-start justify-between gap-3 space-y-0 mb-3">
                  <div>
                    <DialogTitle className="mb-0">Facture {invoice.invoiceNumber}</DialogTitle>
                    <p style={{ fontSize: '0.875rem', color: 'var(--muted)', marginTop: '4px' }}>{fmt(invoice.issuedAt)}</p>
                  </div>
                  <StatusPill status={invoice.status} label={invoice.status} />
                </DialogHeader>

                <div style={{ fontSize: '0.875rem', marginBottom: '16px' }}>
                  <p><strong>{invoice.customer.name}</strong> · {invoice.customer.email}</p>
                  {invoice.event && <p style={{ color: 'var(--muted)' }}>{invoice.event.title}</p>}
                </div>

                <div style={{ border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden', marginBottom: '16px' }}>
                  {invoice.lines.map((l, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderBottom: i < invoice.lines.length - 1 ? '1px solid var(--border)' : 'none', fontSize: '0.875rem' }}>
                      <span>{l.description} × {l.quantity}</span>
                      <span>{l.total.toLocaleString('fr-FR')} {invoice.currency}</span>
                    </div>
                  ))}
                </div>
                <p style={{ textAlign: 'end', fontSize: '1.125rem', fontWeight: 700, marginBottom: '20px' }}>
                  Total : {invoice.total.toLocaleString('fr-FR')} {invoice.currency}
                </p>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <a href={invoicePdfUrl(invoiceId)} target="_blank" rel="noopener noreferrer" className="btn-primary btn-sm" style={{ flex: 1, textAlign: 'center' }}>
                    Imprimer / PDF
                  </a>
                  <button type="button" onClick={() => setInvoiceId(null)} className="btn-outline btn-sm" style={{ flex: 1 }}>
                    <span>Fermer</span>
                  </button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      )}
    </DashboardPage>
  );
}

const detailBtn: React.CSSProperties = {
  background: 'none', border: '1px solid var(--border)', borderRadius: '4px',
  padding: '5px 12px', fontSize: '0.75rem', cursor: 'pointer', color: 'var(--foreground)',
};
