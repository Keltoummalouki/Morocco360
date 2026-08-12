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
  NumberInput,
  StatusSelect,
  ChipMultiSelect,
} from '@/components/admin/AdminFormModal';
import { useAdminList } from '@/lib/admin/use-admin-list';
import {
  allLanguages,
  createCountry,
  deleteCountry,
  listCountries,
  updateCountry,
  type Country,
  type LanguageRef,
  type SettingStatus,
} from '@/lib/admin/settings';

const PAGE_SIZE = 12;

type Modal =
  | { type: 'none' }
  | { type: 'create' }
  | { type: 'edit'; row: Country };

function num(v: string): number | undefined {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : undefined;
}

export default function CountriesPage() {
  const list = useAdminList<Country>(
    useCallback(
      (q) =>
        listCountries({
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
  const [confirm, setConfirm] = useState<Country | null>(null);
  const [languages, setLanguages] = useState<LanguageRef[]>([]);
  const [form, setForm] = useState({
    name: '',
    iso_code: '',
    latitude: '',
    longitude: '',
    status: 'ACTIVE' as SettingStatus,
    languageIds: [] as number[],
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    allLanguages()
      .then(setLanguages)
      .catch(() => setLanguages([]));
  }, []);

  function openCreate() {
    setForm({
      name: '',
      iso_code: '',
      latitude: '',
      longitude: '',
      status: 'ACTIVE',
      languageIds: [],
    });
    setFormError(null);
    setModal({ type: 'create' });
  }
  function openEdit(row: Country) {
    setForm({
      name: row.name,
      iso_code: row.iso_code ?? '',
      latitude: row.latitude != null ? String(row.latitude) : '',
      longitude: row.longitude != null ? String(row.longitude) : '',
      status: row.status,
      languageIds: (row.languages ?? []).map((l) => l.id),
    });
    setFormError(null);
    setModal({ type: 'edit', row });
  }

  function toggleLanguage(id: number) {
    setForm((f) => ({
      ...f,
      languageIds: f.languageIds.includes(id)
        ? f.languageIds.filter((x) => x !== id)
        : [...f.languageIds, id],
    }));
  }

  async function submit() {
    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        name: form.name.trim(),
        iso_code: form.iso_code.trim() || undefined,
        latitude: num(form.latitude),
        longitude: num(form.longitude),
        status: form.status,
        languageIds: form.languageIds,
      };
      if (modal.type === 'edit') {
        await updateCountry(modal.row.id, payload);
      } else {
        await createCountry(payload);
      }
      setModal({ type: 'none' });
      await list.reload();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Échec de l’enregistrement');
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(row: Country) {
    await updateCountry(row.id, {
      status: row.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE',
    });
    await list.reload();
  }

  async function doDelete() {
    if (!confirm) return;
    try {
      await deleteCountry(confirm.id);
      setConfirm(null);
      await list.reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Suppression impossible');
      setConfirm(null);
    }
  }

  const columns: Column<Country>[] = [
    {
      header: 'Pays',
      cell: (r) => <span style={{ fontWeight: 500 }}>{r.name}</span>,
    },
    {
      header: 'ISO',
      width: '70px',
      cell: (r) => (
        <span
          style={{
            fontSize: '0.8125rem',
            color: 'var(--muted)',
            textTransform: 'uppercase',
          }}
        >
          {r.iso_code || '—'}
        </span>
      ),
    },
    {
      header: 'Villes',
      width: '80px',
      cell: (r) => (
        <span style={{ color: 'var(--muted)', fontSize: '0.8125rem' }}>
          {r.cityCount ?? 0}
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
      <AdminListShell<Country>
        eyebrow="Paramètres"
        title="Pays"
        subtitle="Pays, leurs villes et les langues qui y sont parlées."
        searchPlaceholder="Rechercher un pays…"
        searchValue={list.searchInput}
        onSearchChange={list.setSearchInput}
        statusValue={list.status}
        onStatusChange={(v) => list.onStatus(v as SettingStatus | '')}
        addLabel="Nouveau pays"
        onAdd={openCreate}
        columns={columns}
        rows={list.data}
        rowKey={(r) => r.id}
        loading={list.loading}
        error={list.error}
        emptyMessage="Aucun pays trouvé."
        onRetry={list.reload}
        page={list.page}
        pageCount={list.meta?.totalPages ?? 1}
        total={list.meta?.total ?? 0}
        onPageChange={list.setPage}
      />

      {modal.type !== 'none' && (
        <AdminFormModal
          title={modal.type === 'edit' ? 'Modifier le pays' : 'Nouveau pays'}
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
              maxLength={120}
              placeholder="Maroc, France…"
            />
          </Field>
          <Field label="Code ISO">
            <TextInput
              value={form.iso_code}
              onChange={(v) => setForm((f) => ({ ...f, iso_code: v }))}
              maxLength={3}
              placeholder="MA, FR…"
            />
          </Field>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <Field label="Latitude">
                <NumberInput
                  value={form.latitude}
                  onChange={(v) => setForm((f) => ({ ...f, latitude: v }))}
                  step="any"
                  placeholder="31.79"
                />
              </Field>
            </div>
            <div style={{ flex: 1 }}>
              <Field label="Longitude">
                <NumberInput
                  value={form.longitude}
                  onChange={(v) => setForm((f) => ({ ...f, longitude: v }))}
                  step="any"
                  placeholder="-7.09"
                />
              </Field>
            </div>
          </div>
          <Field label="Statut">
            <StatusSelect
              value={form.status}
              onChange={(v) => setForm((f) => ({ ...f, status: v }))}
            />
          </Field>
          <Field label="Langues parlées">
            <ChipMultiSelect
              options={languages.map((l) => ({ id: l.id, label: l.name }))}
              selected={form.languageIds}
              onToggle={toggleLanguage}
              emptyLabel="Ajoutez d’abord des langues."
            />
          </Field>
        </AdminFormModal>
      )}

      {confirm && (
        <ConfirmModal
          title="Supprimer le pays"
          message={`Supprimer « ${confirm.name} » ? Impossible s’il contient des villes.`}
          onConfirm={doDelete}
          onCancel={() => setConfirm(null)}
        />
      )}
    </DashboardPage>
  );
}
