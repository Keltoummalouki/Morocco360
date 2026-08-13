'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { DashboardPage } from '@/components/DashboardAnimations';
import AdminListShell, { type Column } from '@/components/admin/AdminListShell';
import StatusPill from '@/components/admin/StatusPill';
import {
  AdminFormModal,
  Field,
  FieldRow,
  FormSection,
  ImageUploadField,
  TextInput,
  TextArea,
  NumberInput,
  SelectInput,
} from '@/components/admin/AdminFormModal';
import UserPicker from '@/components/admin/UserPicker';
import { DateTimePicker } from '@/components/ui/date-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

// Radix Select forbids an item with value="" — this sentinel represents
// the "no filter" / "all" option and is translated back to '' below.
const ALL_VALUE = '__all__';

function toLocalInput(iso: string): string {
  // ISO -> "yyyy-MM-ddTHH:mm" value for <DateTimePicker>
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
  countryId: '' as number | '',
  cityId: '' as number | '',
  categoryId: '' as number | '',
  organizerId: null as number | null,
  organizerLabel: '',
  total_stock: '',
  image_url: '',
  status: 'ACTIVE' as EventStatus,
};

type EventForm = typeof emptyForm;
type FieldErrors = Partial<Record<keyof EventForm, string>>;

/** Checks the whole form up front so every problem is shown at once. */
function validateEvent(form: EventForm): FieldErrors {
  const errors: FieldErrors = {};

  if (!form.title.trim()) errors.title = 'Le titre est requis.';
  else if (form.title.trim().length < 3)
    errors.title = 'Minimum 3 caractères.';

  if (!form.description.trim())
    errors.description = 'La description est requise.';

  if (!form.date_start) errors.date_start = 'La date de début est requise.';
  if (!form.date_end) errors.date_end = 'La date de fin est requise.';
  else if (form.date_start && form.date_end < form.date_start)
    errors.date_end = 'La fin doit suivre le début.';

  if (!form.location_name.trim()) errors.location_name = 'Le lieu est requis.';

  if (form.total_stock !== '') {
    const stock = Number(form.total_stock);
    if (!Number.isInteger(stock) || stock < 0)
      errors.total_stock = 'Nombre entier positif requis.';
  }

  return errors;
}

/**
 * The API answers with class-validator strings ("cityId must be an integer
 * number"). Surface something a French-speaking admin can act on, and keep the
 * original for anything unmapped rather than swallowing it.
 */
function toReadableError(message: string): string {
  const map: [RegExp, string][] = [
    [/cityId/i, 'Ville invalide — sélectionnez-la dans la liste.'],
    [/categoryId/i, 'Catégorie invalide — sélectionnez-la dans la liste.'],
    [/organizerId/i, 'Organisateur invalide — sélectionnez-le dans la liste.'],
    [/date_start|date_end/i, 'Dates invalides.'],
    [/total_stock/i, 'Le nombre de places est invalide.'],
    [/title/i, 'Le titre est invalide.'],
  ];

  const matched = map
    .filter(([pattern]) => pattern.test(message))
    .map(([, label]) => label);

  return matched.length > 0 ? matched.join(' ') : message;
}

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
    listEventCategories({ limit: 100, sortBy: 'name', sortOrder: 'ASC' })
      .then((r) => setCategories(r.data))
      .catch(() => setCategories([]));
  }, []);

  const [modal, setModal] = useState<Modal>({ type: 'none' });
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  /** Updates one field and clears its error, so a fix removes the red text. */
  function setField<K extends keyof EventForm>(key: K, value: EventForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  // Cities depend on the selected country in the create/edit form — a city
  // has exactly one country, so re-scope the list whenever it changes.
  useEffect(() => {
    if (modal.type === 'none' || form.countryId === '') {
      setCities([]);
      return;
    }
    listCities({
      countryId: form.countryId,
      limit: 100,
      sortBy: 'name',
      sortOrder: 'ASC',
    })
      .then((r) => setCities(r.data))
      .catch(() => setCities([]));
  }, [form.countryId, modal.type]);

  function openCreate() {
    setForm(emptyForm);
    setFormError(null);
    setFieldErrors({});
    setModal({ type: 'create' });
  }
  function openEdit(row: AdminEvent) {
    setForm({
      title: row.title,
      description: row.description,
      date_start: toLocalInput(row.date_start),
      date_end: toLocalInput(row.date_end),
      location_name: row.location_name,
      countryId: row.cityEntity?.country?.id ?? '',
      cityId: row.cityEntity?.id ?? '',
      categoryId: row.categoryEntity?.id ?? '',
      organizerId: row.organizer?.id ?? null,
      organizerLabel: row.organizer
        ? row.organizer.full_name || row.organizer.username
        : '',
      total_stock: String(row.total_stock ?? ''),
      image_url: row.image_url ?? '',
      status: row.status,
    });
    setFormError(null);
    setFieldErrors({});
    setModal({ type: 'edit', row });
  }

  async function submit() {
    const validation = validateEvent(form);
    if (Object.keys(validation).length > 0) {
      setFieldErrors(validation);
      setFormError('Vérifiez les champs signalés ci-dessus.');
      return;
    }
    setFieldErrors({});
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
        image_url: form.image_url || undefined,
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
      setFormError(
        e instanceof Error
          ? toReadableError(e.message)
          : 'Échec de l’enregistrement',
      );
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
            <Select
              value={statusFilter || ALL_VALUE}
              onValueChange={(v) => {
                setStatusFilter(v === ALL_VALUE ? '' : (v as EventStatus));
                list.setPage(1);
              }}
            >
              <SelectTrigger className="w-[160px]" aria-label="Filtrer par statut">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUE}>Tous les statuts</SelectItem>
                {EVENT_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            <Select
              value={categoryFilter === '' ? ALL_VALUE : String(categoryFilter)}
              onValueChange={(v) => {
                setCategoryFilter(v === ALL_VALUE ? '' : Number(v));
                list.setPage(1);
              }}
            >
              <SelectTrigger className="w-[180px]" aria-label="Filtrer par catégorie">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUE}>Toutes les catégories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
          wide
          title={modal.type === 'edit' ? 'Modifier l’événement' : 'Nouvel événement'}
          description="Les champs marqués d’un astérisque sont obligatoires."
          onCancel={() => setModal({ type: 'none' })}
          onSubmit={submit}
          submitting={saving}
          error={formError}
          submitLabel={modal.type === 'edit' ? 'Enregistrer' : 'Créer l’événement'}
        >
          <FormSection title="Présentation">
            <Field label="Image de couverture" hint="Affichée sur la fiche et dans les listes.">
              <ImageUploadField
                value={form.image_url}
                onChange={(url) => setField('image_url', url)}
                disabled={saving}
              />
            </Field>
            <Field label="Titre" required error={fieldErrors.title}>
              <TextInput
                value={form.title}
                onChange={(v) => setField('title', v)}
                invalid={!!fieldErrors.title}
                maxLength={200}
              />
            </Field>
            <Field label="Description" required error={fieldErrors.description}>
              <TextArea
                value={form.description}
                onChange={(v) => setField('description', v)}
                invalid={!!fieldErrors.description}
                rows={4}
              />
            </Field>
          </FormSection>

          <FormSection title="Dates">
            <FieldRow>
              <Field label="Début" required error={fieldErrors.date_start}>
                <DateTimePicker
                  value={form.date_start}
                  onChange={(v) => setField('date_start', v)}
                  aria-invalid={!!fieldErrors.date_start}
                />
              </Field>
              <Field label="Fin" required error={fieldErrors.date_end}>
                <DateTimePicker
                  value={form.date_end}
                  onChange={(v) => setField('date_end', v)}
                  aria-invalid={!!fieldErrors.date_end}
                />
              </Field>
            </FieldRow>
          </FormSection>

          <FormSection title="Lieu">
            <Field label="Adresse" required error={fieldErrors.location_name}>
              <TextInput
                value={form.location_name}
                onChange={(v) => setField('location_name', v)}
                invalid={!!fieldErrors.location_name}
                maxLength={255}
              />
            </Field>
            <FieldRow>
              <Field label="Pays">
                <SelectInput<number>
                  value={form.countryId}
                  onChange={(v) =>
                    setForm((f) => ({ ...f, countryId: v, cityId: '' }))
                  }
                  options={countries.map((c) => ({ value: c.id, label: c.name }))}
                  placeholder="Sélectionner"
                />
              </Field>
              <Field
                label="Ville"
                hint={form.countryId === '' ? 'Choisissez d’abord un pays.' : undefined}
              >
                <SelectInput<number>
                  value={form.cityId}
                  onChange={(v) => setField('cityId', v)}
                  options={cities.map((c) => ({ value: c.id, label: c.name }))}
                  placeholder="Sélectionner"
                  disabled={form.countryId === ''}
                />
              </Field>
            </FieldRow>
          </FormSection>

          <FormSection title="Billetterie">
            <FieldRow>
              <Field label="Catégorie">
                <SelectInput<number>
                  value={form.categoryId}
                  onChange={(v) => setField('categoryId', v)}
                  options={categories.map((c) => ({ value: c.id, label: c.name }))}
                  placeholder="Sélectionner"
                />
              </Field>
              <Field
                label="Places"
                hint="Laisser vide si la capacité n’est pas limitée."
                error={fieldErrors.total_stock}
              >
                <NumberInput
                  value={form.total_stock}
                  onChange={(v) => setField('total_stock', v)}
                  invalid={!!fieldErrors.total_stock}
                  min={0}
                  placeholder="0"
                />
              </Field>
            </FieldRow>
            <Field label="Statut">
              <SelectInput<EventStatus>
                value={form.status}
                onChange={(v) => setField('status', (v || 'ACTIVE') as EventStatus)}
                options={EVENT_STATUSES.map((s) => ({ value: s, label: s }))}
                placeholder="ACTIVE"
              />
            </Field>
          </FormSection>

          <FormSection title="Organisateur">
            <Field label="Responsable de l’événement">
              {form.organizerId ? (
                <div className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2">
                  <span className="text-sm">{form.organizerLabel}</span>
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
                  inline
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
          </FormSection>
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
