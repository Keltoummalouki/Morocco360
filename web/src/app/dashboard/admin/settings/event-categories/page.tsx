'use client';

import { useCallback, useState } from 'react';
import { DashboardPage } from '@/components/DashboardAnimations';
import AdminListShell, { type Column } from '@/components/admin/AdminListShell';
import StatusPill from '@/components/admin/StatusPill';
import RowActions from '@/components/admin/RowActions';
import ConfirmModal from '@/components/ConfirmModal';
import {
  AdminFormModal,
  Field,
  TextInput,
  TextArea,
  StatusSelect,
} from '@/components/admin/AdminFormModal';
import { useAdminList } from '@/lib/admin/use-admin-list';
import {
  createEventCategory,
  deleteEventCategory,
  listEventCategories,
  updateEventCategory,
  type EventCategory,
  type SettingStatus,
} from '@/lib/admin/settings';

const PAGE_SIZE = 12;

type Modal =
  | { type: 'none' }
  | { type: 'create' }
  | { type: 'edit'; row: EventCategory };

function fmt(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function EventCategoriesPage() {
  const list = useAdminList<EventCategory>(
    useCallback(
      (q) =>
        listEventCategories({
          page: q.page,
          limit: PAGE_SIZE,
          search: q.search,
          status: q.status,
          sortBy: 'name',
          sortOrder: 'ASC',
        }),
      [],
    ),
  );

  const [modal, setModal] = useState<Modal>({ type: 'none' });
  const [confirm, setConfirm] = useState<EventCategory | null>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    status: 'ACTIVE' as SettingStatus,
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function openCreate() {
    setForm({ name: '', description: '', status: 'ACTIVE' });
    setFormError(null);
    setModal({ type: 'create' });
  }
  function openEdit(row: EventCategory) {
    setForm({
      name: row.name,
      description: row.description ?? '',
      status: row.status,
    });
    setFormError(null);
    setModal({ type: 'edit', row });
  }

  async function submit() {
    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        status: form.status,
      };
      if (modal.type === 'edit') {
        await updateEventCategory(modal.row.id, payload);
      } else {
        await createEventCategory(payload);
      }
      setModal({ type: 'none' });
      await list.reload();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Échec de l’enregistrement');
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(row: EventCategory) {
    await updateEventCategory(row.id, {
      status: row.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE',
    });
    await list.reload();
  }

  async function doDelete() {
    if (!confirm) return;
    try {
      await deleteEventCategory(confirm.id);
      setConfirm(null);
      await list.reload();
    } catch (e) {
      // Surface the "in use by active events" 409 to the user.
      alert(e instanceof Error ? e.message : 'Suppression impossible');
      setConfirm(null);
    }
  }

  const columns: Column<EventCategory>[] = [
    {
      header: 'Nom',
      cell: (r) => <span style={{ fontWeight: 500 }}>{r.name}</span>,
    },
    {
      header: 'Description',
      cell: (r) => (
        <span style={{ color: 'var(--muted)', fontSize: '0.8125rem' }}>
          {r.description || '—'}
        </span>
      ),
    },
    { header: 'Statut', cell: (r) => <StatusPill status={r.status} />, width: '130px' },
    {
      header: 'Créé le',
      cell: (r) => (
        <span style={{ color: 'var(--muted)', fontSize: '0.8125rem' }}>
          {fmt(r.created_at)}
        </span>
      ),
      width: '130px',
    },
    {
      header: 'Actions',
      align: 'end',
      width: '260px',
      cell: (r) => (
        <RowActions
          onEdit={() => openEdit(r)}
          status={r.status}
          onToggleStatus={() => void toggleStatus(r)}
          onDelete={() => setConfirm(r)}
        />
      ),
    },
  ];

  return (
    <DashboardPage>
      <AdminListShell<EventCategory>
        eyebrow="Paramètres"
        title="Catégories d’événements"
        subtitle="Gérez la taxonomie utilisée pour classer les événements."
        searchPlaceholder="Rechercher une catégorie…"
        searchValue={list.searchInput}
        onSearchChange={list.setSearchInput}
        statusValue={list.status}
        onStatusChange={(v) => list.onStatus(v as SettingStatus | '')}
        addLabel="Nouvelle catégorie"
        onAdd={openCreate}
        columns={columns}
        rows={list.data}
        rowKey={(r) => r.id}
        loading={list.loading}
        error={list.error}
        emptyMessage="Aucune catégorie trouvée."
        onRetry={list.reload}
        page={list.page}
        pageCount={list.meta?.totalPages ?? 1}
        total={list.meta?.total ?? 0}
        onPageChange={list.setPage}
      />

      {modal.type !== 'none' && (
        <AdminFormModal
          title={
            modal.type === 'edit' ? 'Modifier la catégorie' : 'Nouvelle catégorie'
          }
          onCancel={() => setModal({ type: 'none' })}
          onSubmit={submit}
          submitting={saving}
          error={formError}
        >
          <Field label="Nom">
            <TextInput
              value={form.name}
              onChange={(v) => setForm((f) => ({ ...f, name: v }))}
              required
              maxLength={100}
              placeholder="Musique, Sport, Culture…"
            />
          </Field>
          <Field label="Description">
            <TextArea
              value={form.description}
              onChange={(v) => setForm((f) => ({ ...f, description: v }))}
              maxLength={500}
              placeholder="Courte description (optionnel)"
            />
          </Field>
          <Field label="Statut">
            <StatusSelect
              value={form.status}
              onChange={(v) => setForm((f) => ({ ...f, status: v }))}
            />
          </Field>
        </AdminFormModal>
      )}

      {confirm && (
        <ConfirmModal
          title="Supprimer la catégorie"
          message={`Supprimer « ${confirm.name} » ? Cette action est définitive.`}
          onConfirm={doDelete}
          onCancel={() => setConfirm(null)}
        />
      )}
    </DashboardPage>
  );
}
