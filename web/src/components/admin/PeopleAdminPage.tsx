'use client';

import { useCallback, useEffect, useState } from 'react';
import { DashboardPage } from '@/components/DashboardAnimations';
import AdminListShell, { type Column } from '@/components/admin/AdminListShell';
import StatusPill from '@/components/admin/StatusPill';
import RowActions from '@/components/admin/RowActions';
import {
  AdminFormModal,
  Field,
  TextInput,
} from '@/components/admin/AdminFormModal';
import { useAdminList } from '@/lib/admin/use-admin-list';
import {
  createPerson,
  getOrganizerEvents,
  getStaffEvents,
  getUserOrders,
  listPeople,
  setPersonStatus,
  updatePerson,
  type AdminUser,
  type PeopleResource,
  type RelatedEvent,
  type UserOrder,
  type UserStatus,
} from '@/lib/admin/people';

const PAGE_SIZE = 12;

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

type Modal =
  | { type: 'none' }
  | { type: 'create' }
  | { type: 'edit'; row: AdminUser }
  | { type: 'detail'; row: AdminUser };

const emptyForm = {
  username: '',
  email: '',
  password: '',
  first_name: '',
  last_name: '',
  full_name: '',
  phone_number: '',
  date_of_birth: '',
};

export default function PeopleAdminPage({
  resource,
  eyebrow,
  title,
  subtitle,
  createLabel,
}: {
  resource: PeopleResource;
  eyebrow: string;
  title: string;
  subtitle: string;
  createLabel: string;
}) {
  const list = useAdminList<AdminUser>(
    useCallback(
      (q) =>
        listPeople(resource, {
          page: q.page,
          limit: PAGE_SIZE,
          search: q.search,
          status: q.status,
          sortBy: 'createdAt',
          sortOrder: 'DESC',
        }),
      [resource],
    ),
  );

  const [modal, setModal] = useState<Modal>({ type: 'none' });
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function openCreate() {
    setForm(emptyForm);
    setFormError(null);
    setModal({ type: 'create' });
  }
  function openEdit(row: AdminUser) {
    setForm({
      username: row.username,
      email: row.email,
      password: '',
      first_name: row.first_name ?? '',
      last_name: row.last_name ?? '',
      full_name: row.full_name ?? '',
      phone_number: row.phone_number ?? '',
      date_of_birth: row.date_of_birth ?? '',
    });
    setFormError(null);
    setModal({ type: 'edit', row });
  }

  async function submit() {
    setSaving(true);
    setFormError(null);
    try {
      const common = {
        username: form.username.trim(),
        email: form.email.trim(),
        first_name: form.first_name.trim() || undefined,
        last_name: form.last_name.trim() || undefined,
        full_name: form.full_name.trim() || undefined,
        phone_number: form.phone_number.trim() || undefined,
        date_of_birth: form.date_of_birth || undefined,
      };
      if (modal.type === 'edit') {
        await updatePerson(resource, modal.row.id, common);
      } else {
        await createPerson(resource, { ...common, password: form.password });
      }
      setModal({ type: 'none' });
      await list.reload();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Échec de l’enregistrement');
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(row: AdminUser) {
    await setPersonStatus(
      resource,
      row.id,
      row.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE',
    );
    await list.reload();
  }

  const columns: Column<AdminUser>[] = [
    {
      header: 'Nom',
      cell: (r) => (
        <div>
          <span style={{ fontWeight: 500 }}>{r.full_name || r.username}</span>
          <span
            style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted)' }}
          >
            {r.email}
          </span>
        </div>
      ),
    },
    {
      header: 'Téléphone',
      cell: (r) => (
        <span style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>
          {r.phone_number || '—'}
        </span>
      ),
    },
    { header: 'Statut', width: '120px', cell: (r) => <StatusPill status={r.status} /> },
    {
      header: 'Inscrit le',
      width: '120px',
      cell: (r) => (
        <span style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>
          {fmt(r.created_at)}
        </span>
      ),
    },
    {
      header: 'Actions',
      align: 'end',
      width: '320px',
      cell: (r) => (
        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={() => setModal({ type: 'detail', row: r })}
            style={detailBtn}
          >
            Détails
          </button>
          <RowActions
            onEdit={() => openEdit(r)}
            status={r.status}
            onToggleStatus={() => void toggleStatus(r)}
          />
        </div>
      ),
    },
  ];

  return (
    <DashboardPage>
      <AdminListShell<AdminUser>
        eyebrow={eyebrow}
        title={title}
        subtitle={subtitle}
        searchPlaceholder="Rechercher par nom, email, téléphone…"
        searchValue={list.searchInput}
        onSearchChange={list.setSearchInput}
        statusValue={list.status}
        onStatusChange={(v) => list.onStatus(v as UserStatus | '')}
        addLabel={createLabel}
        onAdd={openCreate}
        columns={columns}
        rows={list.data}
        rowKey={(r) => r.id}
        loading={list.loading}
        error={list.error}
        emptyMessage="Aucun compte trouvé."
        onRetry={list.reload}
        page={list.page}
        pageCount={list.meta?.totalPages ?? 1}
        total={list.meta?.total ?? 0}
        onPageChange={list.setPage}
      />

      {(modal.type === 'create' || modal.type === 'edit') && (
        <AdminFormModal
          title={modal.type === 'edit' ? 'Modifier le compte' : createLabel}
          onCancel={() => setModal({ type: 'none' })}
          onSubmit={submit}
          submitting={saving}
          error={formError}
        >
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <Field label="Prénom">
                <TextInput
                  value={form.first_name}
                  onChange={(v) => setForm((f) => ({ ...f, first_name: v }))}
                  maxLength={100}
                />
              </Field>
            </div>
            <div style={{ flex: 1 }}>
              <Field label="Nom">
                <TextInput
                  value={form.last_name}
                  onChange={(v) => setForm((f) => ({ ...f, last_name: v }))}
                  maxLength={100}
                />
              </Field>
            </div>
          </div>
          <Field label="Nom complet (affiché)">
            <TextInput
              value={form.full_name}
              onChange={(v) => setForm((f) => ({ ...f, full_name: v }))}
              maxLength={150}
            />
          </Field>
          <Field label="Nom d’utilisateur">
            <TextInput
              value={form.username}
              onChange={(v) => setForm((f) => ({ ...f, username: v }))}
              required
              maxLength={50}
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
              className="search-input"
              style={{ width: '100%' }}
            />
          </Field>
          {modal.type === 'create' && (
            <Field label="Mot de passe">
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                required
                minLength={8}
                className="search-input"
                style={{ width: '100%' }}
                placeholder="8+ caractères, maj/min/chiffre"
              />
            </Field>
          )}
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <Field label="Téléphone">
                <TextInput
                  value={form.phone_number}
                  onChange={(v) => setForm((f) => ({ ...f, phone_number: v }))}
                  maxLength={25}
                  placeholder="+212…"
                />
              </Field>
            </div>
            <div style={{ flex: 1 }}>
              <Field label="Date de naissance">
                <input
                  type="date"
                  value={form.date_of_birth}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, date_of_birth: e.target.value }))
                  }
                  className="search-input"
                  style={{ width: '100%' }}
                />
              </Field>
            </div>
          </div>
        </AdminFormModal>
      )}

      {modal.type === 'detail' && (
        <PersonDetailModal
          resource={resource}
          user={modal.row}
          onClose={() => setModal({ type: 'none' })}
        />
      )}
    </DashboardPage>
  );
}

// ── Detail modal with related data (orders or events) ──────
function PersonDetailModal({
  resource,
  user,
  onClose,
}: {
  resource: PeopleResource;
  user: AdminUser;
  onClose: () => void;
}) {
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [events, setEvents] = useState<RelatedEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        if (resource === 'users') {
          const r = await getUserOrders(user.id, { limit: 20 });
          setOrders(r.data);
        } else if (resource === 'organizers') {
          setEvents(await getOrganizerEvents(user.id));
        } else {
          setEvents(await getStaffEvents(user.id));
        }
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [resource, user.id]);

  const relatedTitle = resource === 'users' ? 'Réservations' : 'Événements';

  return (
    <div
      onClick={onClose}
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
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--background)',
          border: '1px solid var(--border)',
          borderRadius: '4px',
          padding: '32px',
          maxWidth: '560px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 24px 64px -12px var(--shadow)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <p style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.25rem', fontWeight: 700 }}>
              {user.full_name || user.username}
            </p>
            <p style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>{user.email}</p>
          </div>
          <StatusPill status={user.status} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '24px' }}>
          <Info label="Utilisateur" value={user.username} />
          <Info label="Téléphone" value={user.phone_number || '—'} />
          <Info label="Rôle" value={user.role || '—'} />
          <Info
            label="Date de naissance"
            value={user.date_of_birth ? fmt(user.date_of_birth) : '—'}
          />
        </div>

        <h3 style={{ fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '12px' }}>
          {relatedTitle}
        </h3>

        {loading ? (
          <div className="shimmer" style={{ height: '80px', borderRadius: '6px' }} />
        ) : resource === 'users' ? (
          orders.length > 0 ? (
            orders.map((o) => (
              <div key={o.id} style={rowLine}>
                <span style={{ fontSize: '0.875rem' }}>
                  #{o.id} · {fmt(o.created_at)}
                </span>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.875rem' }}>
                    {Number(o.total_amount).toLocaleString('fr-FR')} MAD
                  </span>
                  <StatusPill status={o.status} label={o.status} />
                </div>
              </div>
            ))
          ) : (
            <Empty />
          )
        ) : events.length > 0 ? (
          events.map((e) => (
            <div key={e.id} style={rowLine}>
              <span style={{ fontSize: '0.875rem' }}>{e.title}</span>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                  {e.source || e.staffRole || ''}
                </span>
                <StatusPill status={e.status} label={e.status} />
              </div>
            </div>
          ))
        ) : (
          <Empty />
        )}

        <div style={{ marginTop: '24px' }}>
          <button type="button" onClick={onClose} className="btn-outline btn-sm" style={{ width: '100%' }}>
            <span>Fermer</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={{ fontSize: '0.625rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted-dim)', marginBottom: '3px' }}>
        {label}
      </p>
      <p style={{ fontSize: '0.875rem' }}>{value}</p>
    </div>
  );
}

function Empty() {
  return (
    <p style={{ fontSize: '0.875rem', color: 'var(--muted)', padding: '8px 0' }}>
      Aucun élément.
    </p>
  );
}

const rowLine: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '10px 0',
  borderBottom: '1px solid var(--border)',
};

const detailBtn: React.CSSProperties = {
  background: 'none',
  border: '1px solid var(--border)',
  borderRadius: '4px',
  padding: '5px 10px',
  fontSize: '0.75rem',
  cursor: 'pointer',
  color: 'var(--foreground)',
};
