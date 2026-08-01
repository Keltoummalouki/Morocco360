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
  SelectInput,
} from '@/components/admin/AdminFormModal';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAdminList } from '@/lib/admin/use-admin-list';
import {
  allCountries,
  createCity,
  deleteCity,
  listCities,
  updateCity,
  type City,
  type CountryRef,
  type SettingStatus,
} from '@/lib/admin/settings';

const PAGE_SIZE = 12;

type Modal = { type: 'none' } | { type: 'create' } | { type: 'edit'; row: City };

// Radix Select forbids an item with value="" — this sentinel represents
// the "all countries" option and is translated back to '' below.
const ALL_VALUE = '__all__';

function num(v: string): number | undefined {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : undefined;
}

export default function CitiesPage() {
  const [countryFilter, setCountryFilter] = useState<number | ''>('');
  const [countries, setCountries] = useState<CountryRef[]>([]);

  const list = useAdminList<City>(
    useCallback(
      (q) =>
        listCities({
          page: q.page,
          limit: PAGE_SIZE,
          search: q.search,
          status: q.status,
          countryId: countryFilter === '' ? undefined : countryFilter,
          sortBy: 'name',
          sortOrder: 'ASC',
        }),
      [countryFilter],
    ),
    [countryFilter],
  );

  const [modal, setModal] = useState<Modal>({ type: 'none' });
  const [confirm, setConfirm] = useState<City | null>(null);
  const [form, setForm] = useState({
    name: '',
    countryId: '' as number | '',
    latitude: '',
    longitude: '',
    status: 'ACTIVE' as SettingStatus,
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    allCountries()
      .then(setCountries)
      .catch(() => setCountries([]));
  }, []);

  function openCreate() {
    setForm({
      name: '',
      countryId: countryFilter,
      latitude: '',
      longitude: '',
      status: 'ACTIVE',
    });
    setFormError(null);
    setModal({ type: 'create' });
  }
  function openEdit(row: City) {
    setForm({
      name: row.name,
      countryId: row.country?.id ?? '',
      latitude: row.latitude != null ? String(row.latitude) : '',
      longitude: row.longitude != null ? String(row.longitude) : '',
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
        countryId: form.countryId === '' ? undefined : form.countryId,
        latitude: num(form.latitude),
        longitude: num(form.longitude),
        status: form.status,
      };
      if (modal.type === 'edit') {
        await updateCity(modal.row.id, payload);
      } else {
        await createCity(payload);
      }
      setModal({ type: 'none' });
      await list.reload();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Échec de l’enregistrement');
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(row: City) {
    await updateCity(row.id, {
      status: row.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE',
    });
    await list.reload();
  }

  async function doDelete() {
    if (!confirm) return;
    try {
      await deleteCity(confirm.id);
      setConfirm(null);
      await list.reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Suppression impossible');
      setConfirm(null);
    }
  }

  const columns: Column<City>[] = [
    {
      header: 'Ville',
      cell: (r) => <span style={{ fontWeight: 500 }}>{r.name}</span>,
    },
    {
      header: 'Pays',
      cell: (r) => (
        <span style={{ color: 'var(--muted)', fontSize: '0.8125rem' }}>
          {r.country?.name ?? '—'}
        </span>
      ),
    },
    {
      header: 'Coordonnées',
      cell: (r) => (
        <span style={{ color: 'var(--muted-dim)', fontSize: '0.8125rem' }}>
          {r.latitude != null && r.longitude != null
            ? `${r.latitude}, ${r.longitude}`
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
      <AdminListShell<City>
        eyebrow="Paramètres"
        title="Villes"
        subtitle="Villes où se déroulent les événements, rattachées à un pays."
        searchPlaceholder="Rechercher une ville…"
        searchValue={list.searchInput}
        onSearchChange={list.setSearchInput}
        statusValue={list.status}
        onStatusChange={(v) => list.onStatus(v as SettingStatus | '')}
        extraFilters={
          <Select
            value={countryFilter === '' ? ALL_VALUE : String(countryFilter)}
            onValueChange={(v) => {
              setCountryFilter(v === ALL_VALUE ? '' : Number(v));
              list.setPage(1);
            }}
          >
            <SelectTrigger className="w-[160px]" aria-label="Filtrer par pays">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>Tous les pays</SelectItem>
              {countries.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
        addLabel="Nouvelle ville"
        onAdd={openCreate}
        columns={columns}
        rows={list.data}
        rowKey={(r) => r.id}
        loading={list.loading}
        error={list.error}
        emptyMessage="Aucune ville trouvée."
        onRetry={list.reload}
        page={list.page}
        pageCount={list.meta?.totalPages ?? 1}
        total={list.meta?.total ?? 0}
        onPageChange={list.setPage}
      />

      {modal.type !== 'none' && (
        <AdminFormModal
          title={modal.type === 'edit' ? 'Modifier la ville' : 'Nouvelle ville'}
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
              placeholder="Marrakech, Casablanca…"
            />
          </Field>
          <Field label="Pays">
            <SelectInput<number>
              value={form.countryId}
              onChange={(v) => setForm((f) => ({ ...f, countryId: v }))}
              options={countries.map((c) => ({ value: c.id, label: c.name }))}
              placeholder="Sélectionner un pays"
            />
          </Field>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <Field label="Latitude">
                <NumberInput
                  value={form.latitude}
                  onChange={(v) => setForm((f) => ({ ...f, latitude: v }))}
                  step="any"
                  placeholder="31.63"
                />
              </Field>
            </div>
            <div style={{ flex: 1 }}>
              <Field label="Longitude">
                <NumberInput
                  value={form.longitude}
                  onChange={(v) => setForm((f) => ({ ...f, longitude: v }))}
                  step="any"
                  placeholder="-7.98"
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
        </AdminFormModal>
      )}

      {confirm && (
        <ConfirmModal
          title="Supprimer la ville"
          message={`Supprimer « ${confirm.name} » ? Impossible si des événements l’utilisent.`}
          onConfirm={doDelete}
          onCancel={() => setConfirm(null)}
        />
      )}
    </DashboardPage>
  );
}
