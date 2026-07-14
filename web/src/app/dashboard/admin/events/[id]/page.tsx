'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { DashboardPage } from '@/components/DashboardAnimations';
import StatusPill from '@/components/admin/StatusPill';
import ConfirmModal from '@/components/ConfirmModal';
import UserPicker from '@/components/admin/UserPicker';
import {
  AdminFormModal,
  Field,
  TextInput,
  TextArea,
  NumberInput,
  StatusSelect,
} from '@/components/admin/AdminFormModal';
import {
  addEventStaff,
  addTicketCategory,
  assignOrganizer,
  attendeesCsvUrl,
  deleteTicketCategory,
  getAdminEvent,
  listEventBookings,
  listEventStaff,
  removeEventStaff,
  setEventStatus,
  updateTicketCategory,
  type AdminBooking,
  type AdminEvent,
  type AdminEventStaff,
  type AdminTicketCategory,
  type EventStatus,
} from '@/lib/admin/events';

const EVENT_STATUSES: EventStatus[] = [
  'ACTIVE',
  'DRAFT',
  'SUSPENDED',
  'SOLD_OUT',
  'CANCELLED',
];

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        border: '1px solid var(--border)',
        background: 'var(--surface)',
        borderRadius: '4px',
        marginBottom: '20px',
      }}
    >
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.0625rem', fontWeight: 600 }}>
          {title}
        </h2>
        {action}
      </div>
      <div style={{ padding: '20px' }}>{children}</div>
    </section>
  );
}

const smallBtn: React.CSSProperties = {
  background: 'none',
  border: '1px solid var(--border)',
  borderRadius: '4px',
  padding: '5px 10px',
  fontSize: '0.75rem',
  cursor: 'pointer',
  color: 'var(--foreground)',
};

type CatModal =
  | { type: 'none' }
  | { type: 'create' }
  | { type: 'edit'; cat: AdminTicketCategory };

export default function EventManagePage() {
  const params = useParams<{ id: string }>();
  const eventId = Number(params.id);

  const [event, setEvent] = useState<AdminEvent | null>(null);
  const [staff, setStaff] = useState<AdminEventStaff[]>([]);
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [bookingTotal, setBookingTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ev, st, bk] = await Promise.all([
        getAdminEvent(eventId),
        listEventStaff(eventId),
        listEventBookings(eventId, { limit: 5 }),
      ]);
      setEvent(ev);
      setStaff(st);
      setBookings(bk.data);
      setBookingTotal(bk.meta.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const [catModal, setCatModal] = useState<CatModal>({ type: 'none' });
  const [catForm, setCatForm] = useState({
    name: '',
    description: '',
    price: '',
    stock_allocated: '',
    status: 'ACTIVE' as 'ACTIVE' | 'SUSPENDED',
  });
  const [catSaving, setCatSaving] = useState(false);
  const [catError, setCatError] = useState<string | null>(null);
  const [confirmCat, setConfirmCat] = useState<AdminTicketCategory | null>(null);
  const [removeStaffTarget, setRemoveStaffTarget] =
    useState<AdminEventStaff | null>(null);

  async function changeStatus(status: EventStatus) {
    await setEventStatus(eventId, status);
    await reload();
  }

  async function onAssignOrganizer(userId: number) {
    try {
      await assignOrganizer(eventId, userId);
      await reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Échec');
    }
  }

  async function onAddStaff(userId: number) {
    try {
      await addEventStaff(eventId, userId);
      await reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Échec');
    }
  }

  async function onRemoveStaff() {
    if (!removeStaffTarget) return;
    await removeEventStaff(eventId, removeStaffTarget.user.id);
    setRemoveStaffTarget(null);
    await reload();
  }

  function openCreateCat() {
    setCatForm({ name: '', description: '', price: '', stock_allocated: '', status: 'ACTIVE' });
    setCatError(null);
    setCatModal({ type: 'create' });
  }
  function openEditCat(cat: AdminTicketCategory) {
    setCatForm({
      name: cat.name,
      description: cat.description ?? '',
      price: String(cat.price),
      stock_allocated: String(cat.stock_allocated),
      status: cat.status,
    });
    setCatError(null);
    setCatModal({ type: 'edit', cat });
  }

  async function submitCat() {
    setCatSaving(true);
    setCatError(null);
    try {
      const payload = {
        name: catForm.name.trim(),
        description: catForm.description.trim() || undefined,
        price: Number(catForm.price) || 0,
        stock_allocated: Number(catForm.stock_allocated) || 0,
        status: catForm.status,
      };
      if (catModal.type === 'edit') {
        await updateTicketCategory(eventId, catModal.cat.id, payload);
      } else {
        await addTicketCategory(eventId, payload);
      }
      setCatModal({ type: 'none' });
      await reload();
    } catch (e) {
      setCatError(e instanceof Error ? e.message : 'Échec');
    } finally {
      setCatSaving(false);
    }
  }

  async function onDeleteCat() {
    if (!confirmCat) return;
    await deleteTicketCategory(eventId, confirmCat.id);
    setConfirmCat(null);
    await reload();
  }

  if (loading) {
    return (
      <DashboardPage>
        <div className="dash-page">
          <div className="shimmer" style={{ height: '40px', width: '300px', marginBottom: '24px', borderRadius: '6px' }} />
          <div className="shimmer" style={{ height: '200px', borderRadius: '6px' }} />
        </div>
      </DashboardPage>
    );
  }

  if (error || !event) {
    return (
      <DashboardPage>
        <div className="dash-page">
          <p style={{ color: '#C4623F', marginBottom: '16px' }}>
            {error ?? 'Événement introuvable.'}
          </p>
          <Link href="/dashboard/admin/events" className="btn-outline btn-sm">
            <span>← Retour aux événements</span>
          </Link>
        </div>
      </DashboardPage>
    );
  }

  return (
    <DashboardPage>
      <div className="dash-page">
        <Link
          href="/dashboard/admin/events"
          style={{ fontSize: '0.8125rem', color: 'var(--muted)', textDecoration: 'none' }}
        >
          ← Événements
        </Link>

        {/* Header */}
        <div
          className="dash-header"
          style={{ marginTop: '12px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-start' }}
        >
          <div>
            <h1 style={{ marginBottom: '8px' }}>{event.title}</h1>
            <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>
              {new Date(event.date_start).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}{' '}
              · {event.location_name}
              {event.cityEntity?.country ? ` · ${event.cityEntity.country.name}` : ''}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <StatusPill status={event.status} />
            <a
              href={attendeesCsvUrl(event.id)}
              className="btn-outline btn-sm"
              style={{ padding: '6px 14px', fontSize: '0.75rem' }}
            >
              <span>Exporter (CSV)</span>
            </a>
          </div>
        </div>

        {/* Status control */}
        <Section title="Statut">
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {EVENT_STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => void changeStatus(s)}
                style={{
                  ...smallBtn,
                  borderColor: event.status === s ? 'var(--primary)' : 'var(--border)',
                  color: event.status === s ? 'var(--primary)' : 'var(--foreground)',
                  fontWeight: event.status === s ? 600 : 400,
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </Section>

        {/* Organizer */}
        <Section title="Organisateur">
          <div style={{ marginBottom: '12px' }}>
            {event.organizer ? (
              <p style={{ fontSize: '0.875rem' }}>
                <strong>{event.organizer.full_name || event.organizer.username}</strong>{' '}
                <span style={{ color: 'var(--muted)' }}>· {event.organizer.email}</span>
              </p>
            ) : (
              <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>
                Aucun organisateur assigné.
              </p>
            )}
          </div>
          <div style={{ maxWidth: '360px' }}>
            <UserPicker
              role="ORGANIZER"
              onSelect={(u) => void onAssignOrganizer(u.id)}
              placeholder="Assigner un organisateur…"
            />
          </div>
        </Section>

        {/* Staff */}
        <Section title={`Staff (${staff.length})`}>
          {staff.length > 0 ? (
            <div style={{ marginBottom: '16px' }}>
              {staff.map((s) => (
                <div
                  key={s.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 0',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                      {s.user.full_name || s.user.username}
                    </span>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted)' }}>
                      {s.user.email} · {s.staffRole}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRemoveStaffTarget(s)}
                    style={{ ...smallBtn, color: '#C4623F' }}
                  >
                    Retirer
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '16px' }}>
              Aucun staff assigné.
            </p>
          )}
          <div style={{ maxWidth: '360px' }}>
            <UserPicker
              role="STAFF"
              onSelect={(u) => void onAddStaff(u.id)}
              placeholder="Ajouter un membre du staff…"
            />
          </div>
        </Section>

        {/* Ticket categories */}
        <Section
          title="Catégories de billets"
          action={
            <button type="button" onClick={openCreateCat} className="btn-primary btn-sm">
              + Ajouter
            </button>
          }
        >
          {event.categories && event.categories.length > 0 ? (
            <div className="table-responsive">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Nom', 'Prix', 'Alloué', 'Restant', 'Statut', ''].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: '8px 12px',
                          textAlign: 'start',
                          fontSize: '0.625rem',
                          color: 'var(--muted)',
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {event.categories.map((c) => (
                    <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '10px 12px', fontSize: '0.875rem' }}>{c.name}</td>
                      <td style={{ padding: '10px 12px', fontSize: '0.875rem' }}>
                        {Number(c.price).toLocaleString('fr-FR')} MAD
                      </td>
                      <td style={{ padding: '10px 12px', fontSize: '0.875rem' }}>{c.stock_allocated}</td>
                      <td style={{ padding: '10px 12px', fontSize: '0.875rem' }}>{c.stock_remaining}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <StatusPill status={c.status} />
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'end' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button type="button" onClick={() => openEditCat(c)} style={smallBtn}>
                            Modifier
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmCat(c)}
                            style={{ ...smallBtn, color: '#C4623F' }}
                          >
                            Suppr.
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>
              Aucune catégorie de billet.
            </p>
          )}
        </Section>

        {/* Bookings preview */}
        <Section
          title={`Réservations (${bookingTotal})`}
          action={
            <Link
              href={`/dashboard/admin/bookings?eventId=${event.id}`}
              style={{ fontSize: '0.8125rem', color: 'var(--primary)', textDecoration: 'none' }}
            >
              Voir tout →
            </Link>
          }
        >
          {bookings.length > 0 ? (
            <div>
              {bookings.map((b) => (
                <div
                  key={b.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 0',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                      #{b.id} · {b.user?.full_name || b.user?.username || '—'}
                    </span>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted)' }}>
                      {new Date(b.created_at).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.875rem' }}>
                      {Number(b.total_amount).toLocaleString('fr-FR')} MAD
                    </span>
                    <StatusPill status={b.status} label={b.status} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>
              Aucune réservation.
            </p>
          )}
        </Section>
      </div>

      {catModal.type !== 'none' && (
        <AdminFormModal
          title={catModal.type === 'edit' ? 'Modifier la catégorie' : 'Nouvelle catégorie de billet'}
          onCancel={() => setCatModal({ type: 'none' })}
          onSubmit={submitCat}
          submitting={catSaving}
          error={catError}
        >
          <Field label="Nom">
            <TextInput
              value={catForm.name}
              onChange={(v) => setCatForm((f) => ({ ...f, name: v }))}
              required
              maxLength={100}
            />
          </Field>
          <Field label="Description">
            <TextArea
              value={catForm.description}
              onChange={(v) => setCatForm((f) => ({ ...f, description: v }))}
            />
          </Field>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <Field label="Prix (MAD)">
                <NumberInput
                  value={catForm.price}
                  onChange={(v) => setCatForm((f) => ({ ...f, price: v }))}
                  step="0.01"
                />
              </Field>
            </div>
            <div style={{ flex: 1 }}>
              <Field label="Stock alloué">
                <NumberInput
                  value={catForm.stock_allocated}
                  onChange={(v) => setCatForm((f) => ({ ...f, stock_allocated: v }))}
                />
              </Field>
            </div>
          </div>
          <Field label="Statut">
            <StatusSelect
              value={catForm.status}
              onChange={(v) => setCatForm((f) => ({ ...f, status: v }))}
            />
          </Field>
        </AdminFormModal>
      )}

      {confirmCat && (
        <ConfirmModal
          title="Supprimer la catégorie"
          message={`Supprimer « ${confirmCat.name} » ?`}
          onConfirm={onDeleteCat}
          onCancel={() => setConfirmCat(null)}
        />
      )}

      {removeStaffTarget && (
        <ConfirmModal
          title="Retirer du staff"
          message={`Retirer ${removeStaffTarget.user.full_name || removeStaffTarget.user.username} de cet événement ?`}
          confirmLabel="Retirer"
          onConfirm={onRemoveStaff}
          onCancel={() => setRemoveStaffTarget(null)}
        />
      )}
    </DashboardPage>
  );
}
