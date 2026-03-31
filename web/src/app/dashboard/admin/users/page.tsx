'use client';

import { useEffect, useState, useCallback, type ReactNode } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────
interface UserRow {
  id: number;
  username: string;
  email: string;
  full_name: string | null;
  phone_number: string | null;
  status: 'ACTIVE' | 'SUSPENDED';
  role: 'ORGANIZER' | 'USER' | 'ADMIN' | null;
  created_at: string;
}

interface EventOption  { id: number; title: string; date_start: string; city: string; }
interface AssignedEvent { id: number; title: string; date_start: string; city: string; }

type Tab = 'organizers' | 'users';
type ModalState =
  | { type: 'none' }
  | { type: 'create' }
  | { type: 'edit';   user: UserRow }
  | { type: 'delete'; user: UserRow }
  | { type: 'events'; user: UserRow };

const STATUS_COLOR = { ACTIVE: '#4A7C6F', SUSPENDED: '#C2533A' } as const;
const STATUS_BG    = { ACTIVE: '#4A7C6F18', SUSPENDED: '#C2533A14' } as const;

// ── Column templates ───────────────────────────────────────────────────────
const COLS_ORG      = '2fr 3.2fr 180px 440px';
const COLS_USER     = '2fr 3.2fr 180px 240px';
const MIN_W_ORG     = '1200px';
const MIN_W_USER    = '840px';

// ── Shared UI pieces ───────────────────────────────────────────────────────
function Overlay({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 50, padding: '16px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--background)', border: '1px solid var(--border)', width: '100%', maxWidth: '560px',
          padding: '24px 28px', position: 'relative', maxHeight: '90vh', overflowY: 'auto',
        }}
      >
        {children}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', required, error }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; required?: boolean; error?: string;
}) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--muted)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 500, marginBottom: '6px' }}>
        {label}{required && <span style={{ color: '#C2533A' }}> *</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%', padding: '10px 14px', fontSize: '0.9375rem',
          background: 'var(--background)', border: `1px solid ${error ? '#C2533A' : 'var(--border)'}`,
          color: 'var(--foreground)', outline: 'none', boxSizing: 'border-box',
        }}
      />
      {error && <p style={{ fontSize: '0.75rem', color: '#C2533A', marginTop: '4px' }}>{error}</p>}
    </div>
  );
}

function validateOrganizerForm(form: { username: string; email: string; password: string; full_name: string; phone_number: string }): Record<string, string> {
  const e: Record<string, string> = {};
  if (!form.username.trim()) e.username = "Le nom d'utilisateur est requis.";
  else if (form.username.trim().length < 3) e.username = 'Minimum 3 caractères.';
  else if (form.username.trim().length > 50) e.username = 'Maximum 50 caractères.';
  else if (!/^[a-zA-Z0-9_]+$/.test(form.username.trim())) e.username = 'Lettres, chiffres et _ uniquement.';
  if (!form.email.trim()) e.email = "L'email est requis.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = 'Adresse email invalide.';
  if (!form.password) e.password = 'Le mot de passe est requis.';
  else if (form.password.length < 8) e.password = 'Minimum 8 caractères.';
  else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password)) e.password = 'Doit contenir majuscule, minuscule et chiffre.';
  if (form.phone_number && !/^[+\d][\d\s\-(). ]{5,19}$/.test(form.phone_number.trim()))
    e.phone_number = 'Numéro invalide (ex: +212 6 00 00 00 00).';
  return e;
}

function validateUserForm(form: { username: string; email: string; full_name: string; phone_number: string }): Record<string, string> {
  const e: Record<string, string> = {};
  if (!form.username.trim()) e.username = "Le nom d'utilisateur est requis.";
  else if (form.username.trim().length < 3) e.username = 'Minimum 3 caractères.';
  else if (form.username.trim().length > 50) e.username = 'Maximum 50 caractères.';
  else if (!/^[a-zA-Z0-9_]+$/.test(form.username.trim())) e.username = 'Lettres, chiffres et _ uniquement.';
  if (!form.email.trim()) e.email = "L'email est requis.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = 'Adresse email invalide.';
  if (form.phone_number && !/^[+\d][\d\s\-(). ]{5,19}$/.test(form.phone_number.trim()))
    e.phone_number = 'Numéro invalide (ex: +212 6 00 00 00 00).';
  return e;
}

function ModalActions({ onCancel, submitLabel, submitColor = '#C2533A', loading }: {
  onCancel: () => void; submitLabel: string; submitColor?: string; loading?: boolean;
}) {
  return (
    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '28px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
      <button type="button" onClick={onCancel} style={{ padding: '10px 22px', border: '1px solid var(--border)', background: 'none', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--muted)' }}>
        Annuler
      </button>
      <button type="submit" disabled={loading} style={{ padding: '10px 26px', background: submitColor, color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, opacity: loading ? 0.7 : 1 }}>
        {loading ? '…' : submitLabel}
      </button>
    </div>
  );
}

function ActionBtn({ label, color, onClick }: { label: string; color: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 12px', fontSize: '0.8125rem', fontWeight: 500, cursor: 'pointer',
        border: `1px solid ${color}40`, color, background: `${color}0d`, whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
export default function AdminUsersPage() {
  const [tab, setTab]         = useState<Tab>('organizers');
  const [organizers, setOrgs] = useState<UserRow[]>([]);
  const [users, setUsers]     = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [search, setSearch]   = useState('');
  const [modal, setModal]     = useState<ModalState>({ type: 'none' });

  const loadOrgs = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/users?role=ORGANIZER');
      if (!res.ok) throw new Error();
      setOrgs(await res.json() as UserRow[]);
    } catch { setError('Impossible de charger les organisateurs.'); }
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/users?role=USER');
      if (!res.ok) throw new Error();
      setUsers(await res.json() as UserRow[]);
    } catch { setError('Impossible de charger les utilisateurs.'); }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadOrgs(), loadUsers()]).finally(() => setLoading(false));
  }, [loadOrgs, loadUsers]);

  const refresh = useCallback(() => {
    if (tab === 'organizers') void loadOrgs(); else void loadUsers();
  }, [tab, loadOrgs, loadUsers]);

  const filterFn = (u: UserRow) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.full_name ?? '').toLowerCase().includes(q);
  };

  const displayOrgs  = organizers.filter(filterFn);
  const displayUsers = users.filter(filterFn);

  async function toggleStatus(user: UserRow) {
    const next = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    const res = await fetch(`/api/admin/users/${user.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    });
    if (res.ok) refresh(); else setError('Impossible de modifier le statut.');
  }

  async function handleDelete(user: UserRow) {
    const res = await fetch(`/api/admin/users/${user.id}`, { method: 'DELETE' });
    if (res.ok || res.status === 204) { refresh(); setModal({ type: 'none' }); }
    else setError('Impossible de supprimer cet utilisateur.');
  }

  const cols      = tab === 'organizers' ? COLS_ORG : COLS_USER;
  const minW      = tab === 'organizers' ? MIN_W_ORG : MIN_W_USER;
  const activeList = tab === 'organizers' ? displayOrgs : displayUsers;

  return (
    <div className="dash-page">

      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <p style={{ fontSize: '0.6875rem', letterSpacing: '0.2em', color: '#C2533A', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>
          Administration
        </p>
        <div className="flex flex-wrap gap-3 items-end justify-between">
          <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: '2rem', fontWeight: 700 }}>
            Gestion des utilisateurs
          </h1>
          {tab === 'organizers' && (
            <button
              onClick={() => setModal({ type: 'create' })}
              className="btn-primary btn-action shrink-0"
            >
              + Créer un organisateur
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '24px' }}>
        {([
          { key: 'organizers' as Tab, label: `Organisateurs (${organizers.length})` },
          { key: 'users' as Tab,      label: `Utilisateurs (${users.length})` },
        ]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => { setTab(key); setSearch(''); }}
            style={{
              padding: '10px 24px', fontSize: '0.875rem',
              fontWeight: tab === key ? 600 : 400,
              color: tab === key ? 'var(--foreground)' : 'var(--muted)',
              background: 'none', border: 'none',
              borderBottom: tab === key ? '2px solid var(--foreground)' : '2px solid transparent',
              cursor: 'pointer',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par nom, email…"
          style={{
            width: '320px', padding: '9px 14px', fontSize: '0.875rem',
            border: '1px solid var(--border)', background: 'var(--background)',
            color: 'var(--foreground)', outline: 'none',
          }}
        />
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding: '12px 16px', border: '1px solid #dc262630', background: '#dc262608', color: '#dc2626', fontSize: '0.875rem', marginBottom: '16px' }}>
          {error}
          <button onClick={() => setError(null)} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontWeight: 700 }}>×</button>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--border)' }}>
          {[1,2,3].map((i) => <div key={i} style={{ height: '64px', background: 'var(--background)', opacity: 0.5 }} />)}
        </div>
      )}

      {/* Table */}
      {!loading && activeList.length > 0 && (
        <div className="table-responsive" style={{ border: '1px solid var(--border)' }}>
          <div style={{ minWidth: minW }}>
          {/* Header */}
          <div style={{
            display: 'grid', gridTemplateColumns: cols, gap: '0 12px',
            padding: '10px 16px', borderBottom: '1px solid var(--border)',
            background: 'var(--surface)',
          }}>
            {['Utilisateur', 'Email', 'Statut', 'Actions'].map((h, i) => (
              <span key={h} style={{
                fontSize: '0.6875rem', color: 'var(--muted)', letterSpacing: '0.12em',
                textTransform: 'uppercase', fontWeight: 500,
                textAlign: i === 3 ? 'right' : 'left',
              }}>
                {h}
              </span>
            ))}
          </div>

          {activeList.map((u) => (
            <div
              key={u.id}
              style={{
                display: 'grid', gridTemplateColumns: cols, gap: '0 12px',
                padding: '12px 16px', borderBottom: '1px solid var(--border)', alignItems: 'center',
              }}
            >
              {/* Name */}
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: '0.9375rem', fontWeight: 500, marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {u.full_name || u.username}
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>@{u.username}</p>
              </div>

              {/* Email */}
              <p style={{ fontSize: '0.875rem', color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {u.email}
              </p>

              {/* Status */}
              <span style={{
                display: 'inline-block', padding: '3px 10px', alignSelf: 'center',
                fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
                color: STATUS_COLOR[u.status], background: STATUS_BG[u.status],
              }}>
                {u.status === 'ACTIVE' ? 'Actif' : 'Suspendu'}
              </span>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
                {tab === 'organizers' ? (
                  <>
                    <ActionBtn label="Événements" color="#B8862D" onClick={() => setModal({ type: 'events', user: u })} />
                    <ActionBtn label="Modifier"   color="#4A7C6F" onClick={() => setModal({ type: 'edit',   user: u })} />
                    <ActionBtn label="Supprimer"  color="#C2533A" onClick={() => setModal({ type: 'delete', user: u })} />
                  </>
                ) : (
                  <ActionBtn
                    label={u.status === 'ACTIVE' ? 'Suspendre' : 'Activer'}
                    color={u.status === 'ACTIVE' ? '#C2533A' : '#4A7C6F'}
                    onClick={() => void toggleStatus(u)}
                  />
                )}
              </div>
            </div>
          ))}
          </div>
        </div>
      )}

      {/* Empty */}
      {!loading && activeList.length === 0 && (
        <div style={{ padding: '48px', textAlign: 'center', border: '1px solid var(--border)' }}>
          <p style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.125rem', fontWeight: 600, marginBottom: '6px' }}>
            {search ? 'Aucun résultat' : tab === 'organizers' ? 'Aucun organisateur' : 'Aucun utilisateur'}
          </p>
          {tab === 'organizers' && !search && (
            <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>Créez votre premier organisateur.</p>
          )}
        </div>
      )}

      {/* Modals */}
      {modal.type === 'create' && (
        <CreateOrganizerModal onClose={() => setModal({ type: 'none' })} onCreated={() => { setModal({ type: 'none' }); void loadOrgs(); }} />
      )}
      {modal.type === 'edit' && (
        <EditUserModal user={modal.user} onClose={() => setModal({ type: 'none' })} onSaved={() => { setModal({ type: 'none' }); refresh(); }} />
      )}
      {modal.type === 'delete' && (
        <DeleteModal user={modal.user} onClose={() => setModal({ type: 'none' })} onConfirm={() => void handleDelete(modal.user)} />
      )}
      {modal.type === 'events' && (
        <AssignEventsModal user={modal.user} onClose={() => setModal({ type: 'none' })} />
      )}
    </div>
  );
}

// ── Create organizer modal ─────────────────────────────────────────────────
function CreateOrganizerModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ username: '', email: '', password: '', full_name: '', phone_number: '' });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const set = (k: keyof typeof form) => (v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (fieldErrors[k]) setFieldErrors((prev) => { const n = { ...prev }; delete n[k]; return n; });
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validateOrganizerForm(form);
    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return; }
    setFieldErrors({});
    setSaving(true); setErr(null);
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) { onCreated(); return; }
    const data = await res.json() as { message?: string };
    setErr(Array.isArray(data.message) ? (data.message as string[]).join(', ') : (data.message ?? 'Erreur lors de la création.'));
  }

  return (
    <Overlay onClose={onClose}>
      <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.5rem', fontWeight: 700, marginBottom: '6px' }}>
        Créer un organisateur
      </h2>
      <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '28px' }}>
        Le compte sera actif immédiatement après création.
      </p>
      <form onSubmit={(e) => void submit(e)} noValidate>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <Field label="Nom d'utilisateur" value={form.username} onChange={set('username')} required error={fieldErrors.username} />
          <Field label="Email" value={form.email} onChange={set('email')} type="email" required error={fieldErrors.email} />
        </div>
        <div style={{ marginBottom: '16px' }}>
          <Field label="Mot de passe" value={form.password} onChange={set('password')} type="password" required error={fieldErrors.password} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Field label="Nom complet" value={form.full_name} onChange={set('full_name')} />
          <Field label="Téléphone" value={form.phone_number} onChange={set('phone_number')} error={fieldErrors.phone_number} />
        </div>
        {err && (
          <div style={{ marginTop: '16px', padding: '10px 14px', background: '#dc262608', border: '1px solid #dc262630', color: '#dc2626', fontSize: '0.875rem' }}>
            {err}
          </div>
        )}
        <ModalActions onCancel={onClose} submitLabel="Créer le compte" loading={saving} />
      </form>
    </Overlay>
  );
}

// ── Edit user modal ────────────────────────────────────────────────────────
function EditUserModal({ user, onClose, onSaved }: { user: UserRow; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    username: user.username, email: user.email,
    full_name: user.full_name ?? '', phone_number: user.phone_number ?? '',
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const set = (k: keyof typeof form) => (v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (fieldErrors[k]) setFieldErrors((prev) => { const n = { ...prev }; delete n[k]; return n; });
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validateUserForm(form);
    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return; }
    setFieldErrors({});
    setSaving(true); setErr(null);
    // Strip empty strings so @IsOptional fields aren't validated as present
    const payload = Object.fromEntries(
      Object.entries(form).filter(([, v]) => v !== ''),
    );
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (res.ok) { onSaved(); return; }
    const data = await res.json() as { message?: string };
    setErr(data.message ?? 'Erreur lors de la modification.');
  }

  return (
    <Overlay onClose={onClose}>
      <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.5rem', fontWeight: 700, marginBottom: '6px' }}>
        Modifier l&apos;organisateur
      </h2>
      <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '28px' }}>
        {user.full_name || user.username} · {user.email}
      </p>
      <form onSubmit={(e) => void submit(e)} noValidate>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <Field label="Nom d'utilisateur" value={form.username} onChange={set('username')} required error={fieldErrors.username} />
          <Field label="Email" value={form.email} onChange={set('email')} type="email" required error={fieldErrors.email} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Field label="Nom complet" value={form.full_name} onChange={set('full_name')} />
          <Field label="Téléphone" value={form.phone_number} onChange={set('phone_number')} error={fieldErrors.phone_number} />
        </div>
        {err && (
          <div style={{ marginTop: '16px', padding: '10px 14px', background: '#dc262608', border: '1px solid #dc262630', color: '#dc2626', fontSize: '0.875rem' }}>
            {err}
          </div>
        )}
        <ModalActions onCancel={onClose} submitLabel="Enregistrer" submitColor="#4A7C6F" loading={saving} />
      </form>
    </Overlay>
  );
}

// ── Delete confirm modal ───────────────────────────────────────────────────
function DeleteModal({ user, onClose, onConfirm }: { user: UserRow; onClose: () => void; onConfirm: () => void }) {
  return (
    <Overlay onClose={onClose}>
      <div style={{ textAlign: 'center', padding: '8px 0' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>⚠</div>
        <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.375rem', fontWeight: 700, marginBottom: '12px' }}>
          Supprimer l&apos;organisateur
        </h2>
        <p style={{ color: 'var(--muted)', fontSize: '0.9375rem', marginBottom: '6px' }}>
          Vous allez supprimer définitivement
        </p>
        <p style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '24px' }}>
          {user.full_name || user.username}
        </p>
        <p style={{ color: 'var(--muted)', fontSize: '0.8125rem', marginBottom: '28px' }}>
          Cette action est irréversible. Tous les accès seront révoqués.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button onClick={onClose} style={{ padding: '10px 24px', border: '1px solid var(--border)', background: 'none', cursor: 'pointer', fontSize: '0.875rem' }}>
            Annuler
          </button>
          <button onClick={onConfirm} style={{ padding: '10px 24px', background: '#C2533A', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 }}>
            Supprimer définitivement
          </button>
        </div>
      </div>
    </Overlay>
  );
}

// ── Assign events modal ────────────────────────────────────────────────────
function AssignEventsModal({ user, onClose }: { user: UserRow; onClose: () => void }) {
  const [allEvents, setAllEvents]             = useState<EventOption[]>([]);
  const [assigned, setAssigned]               = useState<AssignedEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [loading, setLoading]                 = useState(true);
  const [saving, setSaving]                   = useState(false);
  const [err, setErr]                         = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [allRes, assignedRes] = await Promise.all([
      fetch('/api/admin/events'),
      fetch(`/api/admin/users/${user.id}/events`),
    ]);
    if (allRes.ok)      setAllEvents(await allRes.json() as EventOption[]);
    if (assignedRes.ok) setAssigned(await assignedRes.json() as AssignedEvent[]);
    setLoading(false);
  }, [user.id]);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const assignedIds = new Set(assigned.map((e) => e.id));
  const available   = allEvents.filter((e) => !assignedIds.has(e.id));

  async function assign() {
    if (!selectedEventId) return;
    setSaving(true); setErr(null);
    const res = await fetch(`/api/admin/users/${user.id}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId: parseInt(selectedEventId, 10) }),
    });
    setSaving(false);
    if (res.ok) { setSelectedEventId(''); void load(); }
    else {
      const data = await res.json() as { message?: string };
      setErr(data.message ?? "Erreur lors de l'assignation.");
    }
  }

  async function unassign(eventId: number) {
    const res = await fetch(`/api/admin/users/${user.id}/events/${eventId}`, { method: 'DELETE' });
    if (res.ok || res.status === 204) void load();
    else setErr("Impossible de retirer l'événement.");
  }

  return (
    <Overlay onClose={onClose}>
      {/* Title */}
      <div style={{ marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid var(--border)' }}>
        <p style={{ fontSize: '0.6875rem', letterSpacing: '0.15em', color: '#B8862D', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>
          Organisateur
        </p>
        <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.5rem', fontWeight: 700, marginBottom: '2px' }}>
          {user.full_name || user.username}
        </h2>
        <p style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>{user.email}</p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '8px 0' }}>
          {[1, 2].map((i) => <div key={i} style={{ height: '44px', background: 'var(--border)', opacity: 0.4 }} />)}
        </div>
      ) : (
        <>
          {/* Assign new event */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--muted)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 500, marginBottom: '8px' }}>
              Assigner un événement
            </label>
            {available.length === 0 ? (
              <p style={{ fontSize: '0.875rem', color: 'var(--muted)', padding: '10px 0' }}>
                Tous les événements sont déjà assignés à cet organisateur.
              </p>
            ) : (
              <div style={{ display: 'flex', gap: '10px' }}>
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  style={{
                    flex: 1, padding: '10px 12px', fontSize: '0.875rem',
                    border: '1px solid var(--border)', background: 'var(--background)',
                    color: selectedEventId ? 'var(--foreground)' : 'var(--muted)', outline: 'none',
                  }}
                >
                  <option value="">— Sélectionner un événement —</option>
                  {available.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title} · {ev.city} · {new Date(ev.date_start).toLocaleDateString('fr-FR')}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => void assign()}
                  disabled={!selectedEventId || saving}
                  style={{
                    padding: '10px 20px', background: '#B8862D', color: '#fff', border: 'none',
                    cursor: !selectedEventId || saving ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem', fontWeight: 600, opacity: !selectedEventId ? 0.5 : 1,
                    flexShrink: 0,
                  }}
                >
                  {saving ? '…' : 'Assigner'}
                </button>
              </div>
            )}
          </div>

          {err && (
            <div style={{ padding: '10px 14px', background: '#dc262608', border: '1px solid #dc262630', color: '#dc2626', fontSize: '0.875rem', marginBottom: '16px' }}>
              {err}
            </div>
          )}

          {/* Assigned events list */}
          <div>
            <p style={{ fontSize: '0.6875rem', color: 'var(--muted)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 500, marginBottom: '10px' }}>
              Événements assignés ({assigned.length})
            </p>
            {assigned.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', border: '1px solid var(--border)' }}>
                <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>Aucun événement assigné pour le moment.</p>
              </div>
            ) : (
              <div style={{ border: '1px solid var(--border)' }}>
                {assigned.map((ev, idx) => (
                  <div
                    key={ev.id}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '13px 16px',
                      borderBottom: idx < assigned.length - 1 ? '1px solid var(--border)' : 'none',
                    }}
                  >
                    <div>
                      <p style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: '2px' }}>{ev.title}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                        {ev.city} · {new Date(ev.date_start).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                    <button
                      onClick={() => void unassign(ev.id)}
                      style={{
                        padding: '5px 12px', fontSize: '0.8125rem',
                        color: '#C2533A', border: '1px solid #C2533A40', background: '#C2533A0d',
                        cursor: 'pointer', flexShrink: 0, marginLeft: '12px',
                      }}
                    >
                      Retirer
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={onClose} style={{ padding: '10px 24px', border: '1px solid var(--border)', background: 'none', cursor: 'pointer', fontSize: '0.875rem' }}>
              Fermer
            </button>
          </div>
        </>
      )}
    </Overlay>
  );
}
