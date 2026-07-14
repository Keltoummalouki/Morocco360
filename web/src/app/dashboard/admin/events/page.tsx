'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { DashboardPage } from '@/components/DashboardAnimations';
import AdminListShell, { type Column } from '@/components/admin/AdminListShell';
import StatusPill from '@/components/admin/StatusPill';
import {
  AdminFormModal,
  Field,
  TextInput,
  TextArea,
  NumberInput,
  SelectInput,
} from '@/components/admin/AdminFormModal';
import UserPicker from '@/components/admin/UserPicker';
import { useAdminList } from '@/lib/admin/use-admin-list';
import {
  createAdminEvent,
  listAdminEvents,
  setEventStatus,
  updateAdminEvent,
  type AdminEvent,
  type EventStatus,
} from '@/lib/admin/events';
import {
  allCountries,
  listCities,
  listEventCategories,
  type CountryRef,
  type City,
  type EventCategory,
} from '@/lib/admin/settings';

const PAGE_SIZE = 12;

const EVENT_STATUSES: EventStatus[] = [
  'ACTIVE',
  'DRAFT',
  'SUSPENDED',
  'SOLD_OUT',
  'CANCELLED',
];

type Modal =
  | { type: 'none' }
  | { type: 'create' }
  | { type: 'edit'; row: AdminEvent };

function toLocalInput(iso: string): string {
  // ISO -> value for <input type="datetime-local">
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

const emptyForm = {
  title: '',
  description: '',
  date_start: '',
  date_end: '',
  location_name: '',
  cityId: '' as number | '',
  categoryId: '' as number | '',
  organizerId: null as number | null,
  organizerLabel: '',
  total_stock: '',
  status: 'ACTIVE' as EventStatus,
};

export default function AdminEventsPage() {
  const [statusFilter, setStatusFilter] = useState<EventStatus | ''>('');
  const [countryFilter, setCountryFilter] = useState<number | ''>('');
  const [categoryFilter, setCategoryFilter] = useState<number | ''>('');

  const list = useAdminList<AdminEvent>(
    useCallback(
      (q) =>
        listAdminEvents({
          page: q.page,
          limit: PAGE_SIZE,
          search: q.search,
          status: statusFilter || undefined,
          countryId: countryFilter === '' ? undefined : countryFilter,
          categoryId: categoryFilter === '' ? undefined : categoryFilter,
          sortBy: 'date',
          sortOrder: 'ASC',
        }),
      [statusFilter, countryFilter, categoryFilter],
    ),
    [statusFilter, countryFilter, categoryFilter],
  );

  const [countries, setCountries] = useState<CountryRef[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [categories, setCategories] = useState<EventCategory[]>([]);

  useEffect(() => {
    allCountries().then(setCountries).catch(() => setCountries([]));
    listCities({ limit: 100, sortBy: 'name', sortOrder: 'ASC' })
      .then((r) => setCities(r.data))
      .catch(() => setCities([]));
    listEventCategories({ limit: 100, sortBy: 'name', sortOrder: 'ASC' })
      .then((r) => setCategories(r.data))
      .catch(() => setCategories([]));
  }, []);

  const [modal, setModal] = useState<Modal>({ type: 'none' });
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function openCreate() {
    setForm(emptyForm);
    setFormError(null);
    setModal({ type: 'create' });
  }
  function openEdit(row: AdminEvent) {
    setForm({
      title: row.title,
      description: row.description,
      date_start: toLocalInput(row.date_start),
      date_end: toLocalInput(row.date_end),
      location_name: row.location_name,
      cityId: row.cityEntity?.id ?? '',
      categoryId: row.categoryEntity?.id ?? '',
      organizerId: row.organizer?.id ?? null,
      organizerLabel: row.organizer
        ? row.organizer.full_name || row.organizer.username
        : '',
      total_stock: String(row.total_stock ?? ''),
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
        title: form.title.trim(),
        description: form.description.trim(),
        date_start: form.date_start ? new Date(form.date_start).toISOString() : '',
        date_end: form.date_end ? new Date(form.date_end).toISOString() : '',
        location_name: form.location_name.trim(),
        cityId: form.cityId === '' ? undefined : form.cityId,
        categoryId: form.categoryId === '' ? undefined : form.categoryId,
        organizerId: form.organizerId ?? undefined,
        total_stock: form.total_stock ? Number(form.total_stock) : undefined,
        status: form.status,
      };
      if (modal.type === 'edit') {
        await updateAdminEvent(modal.row.id, payload);
      } else {
        await createAdminEvent(payload);
      }
      setModal({ type: 'none' });
      await list.reload();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Échec de l’enregistrement');
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(row: AdminEvent) {
    await setEventStatus(
      row.id,
      row.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE',
    );
    await list.reload();
  }

  const columns: Column<AdminEvent>[] = [
    {
      header: 'Événement',
      cell: (r) => (
        <div>
          <span style={{ fontWeight: 500 }}>{r.title}</span>
          <span
            style={{
              display: 'block',
              fontSize: '0.75rem',
              color: 'var(--muted)',
            }}
          >
            {r.location_name}
          </span>
        </div>
      ),
    },
    {
      header: 'Date',
      width: '120px',
      cell: (r) => (
        <span style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>
          {fmt(r.date_start)}
        </span>
      ),
    },
    {
      header: 'Lieu',
      cell: (r) => (
        <span style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>
          {r.cityEntity?.name ?? r.city ?? '—'}
          {r.cityEntity?.country ? ` · ${r.cityEntity.country.name}` : ''}
        </span>
      ),
    },
    {
      header: 'Organisateur',
      cell: (r) => (
        <span style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>
          {r.organizer ? r.organizer.full_name || r.organizer.username : '—'}
        </span>
      ),
    },
    { header: 'Statut', width: '120px', cell: (r) => <StatusPill status={r.status} /> },
    {
      header: 'Actions',
      align: 'end',
      width: '280px',
      cell: (r) => (
        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
          <Link
            href={`/dashboard/admin/events/${r.id}`}
            className="btn-outline btn-sm"
            style={{ padding: '5px 12px', fontSize: '0.75rem' }}
          >
            <span>Gérer</span>
          </Link>
          <button
            type="button"
            onClick={() => openEdit(r)}
            style={rowBtn}
          >
            Modifier
          </button>
          <button
            type="button"
            onClick={() => void toggleStatus(r)}
            style={{
              ...rowBtn,
              color: r.status === 'ACTIVE' ? '#C4623F' : '#2E8B6A',
            }}
          >
            {r.status === 'ACTIVE' ? 'Suspendre' : 'Activer'}
          </button>
        </div>
      ),
    },
  ];

  return (
    <DashboardPage>
      <AdminListShell<AdminEvent>
        eyebrow="Administration"
        title="Événements"
        subtitle="Créez, filtrez et gérez tous les événements de la plateforme."
        searchPlaceholder="Rechercher par titre, lieu, organisateur…"
        searchValue={list.searchInput}
        onSearchChange={list.setSearchInput}
        extraFilters={
          <>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as EventStatus | '');
                list.setPage(1);
              }}
              className="search-input"
              style={{ cursor: 'pointer' }}
              aria-label="Filtrer par statut"
            >
              <option value="">Tous les statuts</option>
              {EVENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              value={countryFilter === '' ? '' : String(countryFilter)}
              onChange={(e) => {
                setCountryFilter(e.target.value === '' ? '' : Number(e.target.value));
                list.setPage(1);
              }}
              className="search-input"
              style={{ cursor: 'pointer' }}
              aria-label="Filtrer par pays"
            >
              <option value="">Tous les pays</option>
              {countries.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <select
              value={categoryFilter === '' ? '' : String(categoryFilter)}
              onChange={(e) => {
                setCategoryFilter(e.target.value === '' ? '' : Number(e.target.value));
                list.setPage(1);
              }}
              className="search-input"
              style={{ cursor: 'pointer' }}
              aria-label="Filtrer par catégorie"
            >
              <option value="">Toutes les catégories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </>
        }
        addLabel="Nouvel événement"
        onAdd={openCreate}
        columns={columns}
        rows={list.data}
        rowKey={(r) => r.id}
        loading={list.loading}
        error={list.error}
        emptyMessage="Aucun événement trouvé."
        onRetry={list.reload}
        page={list.page}
        pageCount={list.meta?.totalPages ?? 1}
        total={list.meta?.total ?? 0}
        onPageChange={list.setPage}
      />

      {modal.type !== 'none' && (
        <AdminFormModal
          title={modal.type === 'edit' ? 'Modifier l’événement' : 'Nouvel événement'}
          onCancel={() => setModal({ type: 'none' })}
          onSubmit={submit}
          submitting={saving}
          error={formError}
        >
          <Field label="Titre">
            <TextInput
              value={form.title}
              onChange={(v) => setForm((f) => ({ ...f, title: v }))}
              required
              maxLength={200}
            />
          </Field>
          <Field label="Description">
            <TextArea
              value={form.description}
              onChange={(v) => setForm((f) => ({ ...f, description: v }))}
            />
          </Field>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <Field label="Début">
                <input
                  type="datetime-local"
                  value={form.date_start}
                  onChange={(e) => setForm((f) => ({ ...f, date_start: e.target.value }))}
                  className="search-input"
                  style={{ width: '100%' }}
                  required
                />
              </Field>
            </div>
            <div style={{ flex: 1 }}>
              <Field label="Fin">
                <input
                  type="datetime-local"
                  value={form.date_end}
                  onChange={(e) => setForm((f) => ({ ...f, date_end: e.target.value }))}
                  className="search-input"
                  style={{ width: '100%' }}
                  required
                />
              </Field>
            </div>
          </div>
          <Field label="Lieu">
            <TextInput
              value={form.location_name}
              onChange={(v) => setForm((f) => ({ ...f, location_name: v }))}
              required
              maxLength={255}
            />
          </Field>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <Field label="Ville">
                <SelectInput<number>
                  value={form.cityId}
                  onChange={(v) => setForm((f) => ({ ...f, cityId: v }))}
                  options={cities.map((c) => ({
                    value: c.id,
                    label: c.country ? `${c.name} (${c.country.name})` : c.name,
                  }))}
                  placeholder="Sélectionner"
                />
              </Field>
            </div>
            <div style={{ flex: 1 }}>
              <Field label="Catégorie">
                <SelectInput<number>
                  value={form.categoryId}
                  onChange={(v) => setForm((f) => ({ ...f, categoryId: v }))}
                  options={categories.map((c) => ({ value: c.id, label: c.name }))}
                  placeholder="Sélectionner"
                />
              </Field>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <Field label="Places (stock)">
                <NumberInput
                  value={form.total_stock}
                  onChange={(v) => setForm((f) => ({ ...f, total_stock: v }))}
                  placeholder="0"
                />
              </Field>
            </div>
            <div style={{ flex: 1 }}>
              <Field label="Statut">
                <SelectInput<EventStatus>
                  value={form.status}
                  onChange={(v) => setForm((f) => ({ ...f, status: (v || 'ACTIVE') as EventStatus }))}
                  options={EVENT_STATUSES.map((s) => ({ value: s, label: s }))}
                  placeholder="ACTIVE"
                />
              </Field>
            </div>
          </div>
          <Field label="Organisateur">
            {form.organizerId ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  padding: '8px 12px',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                }}
              >
                <span style={{ fontSize: '0.875rem' }}>{form.organizerLabel}</span>
                <button
                  type="button"
                  onClick={() =>
                    setForm((f) => ({ ...f, organizerId: null, organizerLabel: '' }))
                  }
                  style={rowBtn}
                >
                  Changer
                </button>
              </div>
            ) : (
              <UserPicker
                role="ORGANIZER"
                onSelect={(u) =>
                  setForm((f) => ({
                    ...f,
                    organizerId: u.id,
                    organizerLabel: u.full_name || u.username,
                  }))
                }
                placeholder="Rechercher un organisateur…"
              />
            )}
          </Field>
        </AdminFormModal>
      )}
    </DashboardPage>
  );
}

const rowBtn: React.CSSProperties = {
  background: 'none',
  border: '1px solid var(--border)',
  borderRadius: '4px',
  padding: '5px 10px',
  fontSize: '0.75rem',
  cursor: 'pointer',
  color: 'var(--foreground)',
  whiteSpace: 'nowrap',
};
