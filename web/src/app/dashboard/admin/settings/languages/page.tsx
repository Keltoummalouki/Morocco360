'use client';

import { useCallback, useEffect, useState } from 'react';
import { DashboardPage } from '@/components/DashboardAnimations';
import AdminListShell, { type Column } from '@/components/admin/AdminListShell';
import StatusPill from '@/components/admin/StatusPill';
import RowActions from '@/components/admin/RowActions';
import ConfirmModal from '@/components/ConfirmModal';
import {
  AdminFormModal,
  Field,
  TextInput,
  StatusSelect,
  ChipMultiSelect,
} from '@/components/admin/AdminFormModal';
import { useAdminList } from '@/lib/admin/use-admin-list';
import {
  allCountries,
  createLanguage,
  deleteLanguage,
  listLanguages,
  updateLanguage,
  type CountryRef,
  type Language,
  type SettingStatus,
} from '@/lib/admin/settings';

const PAGE_SIZE = 12;

type Modal =
  | { type: 'none' }
  | { type: 'create' }
  | { type: 'edit'; row: Language };

export default function LanguagesPage() {
  const list = useAdminList<Language>(
    useCallback(
      (q) =>
        listLanguages({
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
  const [confirm, setConfirm] = useState<Language | null>(null);
  const [countries, setCountries] = useState<CountryRef[]>([]);
  const [form, setForm] = useState({
    name: '',
    code: '',
    status: 'ACTIVE' as SettingStatus,
    countryIds: [] as number[],
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Load the country options once (small set) for the assignment chips.
  useEffect(() => {
    allCountries()
      .then(setCountries)
      .catch(() => setCountries([]));
  }, []);

  function openCreate() {
    setForm({ name: '', code: '', status: 'ACTIVE', countryIds: [] });
    setFormError(null);
    setModal({ type: 'create' });
  }
  function openEdit(row: Language) {
    setForm({
      name: row.name,
      code: row.code,
      status: row.status,
      countryIds: (row.countries ?? []).map((c) => c.id),
    });
    setFormError(null);
    setModal({ type: 'edit', row });
  }

  function toggleCountry(id: number) {
    setForm((f) => ({
      ...f,
      countryIds: f.countryIds.includes(id)
        ? f.countryIds.filter((x) => x !== id)
        : [...f.countryIds, id],
    }));
  }

  async function submit() {
    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        name: form.name.trim(),
        code: form.code.trim(),
        status: form.status,
        countryIds: form.countryIds,
      };
      if (modal.type === 'edit') {
        await updateLanguage(modal.row.id, payload);
      } else {
        await createLanguage(payload);
      }
      setModal({ type: 'none' });
      await list.reload();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Échec de l’enregistrement');
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(row: Language) {
    await updateLanguage(row.id, {
      status: row.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE',
    });
    await list.reload();
  }

  async function doDelete() {
    if (!confirm) return;
    try {
      await deleteLanguage(confirm.id);
      setConfirm(null);
      await list.reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Suppression impossible');
      setConfirm(null);
    }
  }

  const columns: Column<Language>[] = [
    {
      header: 'Langue',
      cell: (r) => <span style={{ fontWeight: 500 }}>{r.name}</span>,
    },
    {
      header: 'Code',
      width: '90px',
      cell: (r) => (
        <span
          style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '0.8125rem',
            color: 'var(--muted)',
            textTransform: 'uppercase',
          }}
        >
          {r.code}
        </span>
      ),
    },
    {
      header: 'Pays',
      cell: (r) => (
        <span style={{ color: 'var(--muted)', fontSize: '0.8125rem' }}>
          {r.countries?.length
            ? r.countries.map((c) => c.name).join(', ')
            : '—'}
        </span>
      ),
    },
    { header: 'Statut', cell: (r) => <StatusPill status={r.status} />, width: '130px' },
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
      <AdminListShell<Language>
        eyebrow="Paramètres"
        title="Langues"
        subtitle="Langues disponibles et pays où elles sont parlées."
        searchPlaceholder="Rechercher une langue…"
        searchValue={list.searchInput}
        onSearchChange={list.setSearchInput}
        statusValue={list.status}
        onStatusChange={(v) => list.onStatus(v as SettingStatus | '')}
        addLabel="Nouvelle langue"
        onAdd={openCreate}
        columns={columns}
        rows={list.data}
        rowKey={(r) => r.id}
        loading={list.loading}
        error={list.error}
        emptyMessage="Aucune langue trouvée."
        onRetry={list.reload}
        page={list.page}
        pageCount={list.meta?.totalPages ?? 1}
        total={list.meta?.total ?? 0}
        onPageChange={list.setPage}
      />

      {modal.type !== 'none' && (
        <AdminFormModal
          title={modal.type === 'edit' ? 'Modifier la langue' : 'Nouvelle langue'}
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
              maxLength={80}
              placeholder="Français, Arabe, Anglais…"
            />
          </Field>
          <Field label="Code (ISO)">
            <TextInput
              value={form.code}
              onChange={(v) => setForm((f) => ({ ...f, code: v }))}
              required
              maxLength={10}
              placeholder="fr, ar, en…"
            />
          </Field>
          <Field label="Statut">
            <StatusSelect
              value={form.status}
              onChange={(v) => setForm((f) => ({ ...f, status: v }))}
            />
          </Field>
          <Field label="Pays où elle est parlée">
            <ChipMultiSelect
              options={countries.map((c) => ({ id: c.id, label: c.name }))}
              selected={form.countryIds}
              onToggle={toggleCountry}
              emptyLabel="Ajoutez d’abord des pays."
            />
          </Field>
        </AdminFormModal>
      )}

      {confirm && (
        <ConfirmModal
          title="Supprimer la langue"
          message={`Supprimer « ${confirm.name} » ? Elle sera retirée des pays associés.`}
          onConfirm={doDelete}
          onCancel={() => setConfirm(null)}
        />
      )}
    </DashboardPage>
  );
}
