'use client';

import { useState, useEffect } from 'react';

const ACCENT = '#4A7C6F';

interface UserProfile {
  id: number;
  username: string;
  email: string;
  full_name: string | null;
  phone_number: string | null;
  created_at: string;
  role: { name: string } | null;
}

function Field({
  label,
  value,
  editing,
  name,
  type = 'text',
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  editing: boolean;
  name: string;
  type?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label
        style={{
          fontSize: '0.6875rem',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--muted)',
          fontWeight: 600,
        }}
      >
        {label}
      </label>
      {editing ? (
        <input
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          style={{
            padding: '10px 12px',
            border: `1px solid ${ACCENT}`,
            background: 'var(--background)',
            fontSize: '0.9375rem',
            color: 'var(--foreground)',
            outline: 'none',
            width: '100%',
            boxSizing: 'border-box',
          }}
        />
      ) : (
        <p
          style={{
            fontSize: '0.9375rem',
            color: value ? 'var(--foreground)' : 'var(--muted)',
            padding: '10px 0',
            borderBottom: '1px solid var(--border)',
          }}
        >
          {value || '—'}
        </p>
      )}
    </div>
  );
}

function Alert({ type, message }: { type: 'success' | 'error'; message: string }) {
  return (
    <div
      style={{
        padding: '10px 14px',
        fontSize: '0.875rem',
        border: `1px solid ${type === 'success' ? `${ACCENT}66` : '#e5534b66'}`,
        background: type === 'success' ? `${ACCENT}0F` : '#e5534b0F',
        color: type === 'success' ? ACCENT : '#c0392b',
        marginBottom: '20px',
      }}
    >
      {message}
    </div>
  );
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Profile edit state
  const [editing, setEditing] = useState(false);
  const [profileForm, setProfileForm] = useState({ username: '', full_name: '', phone_number: '' });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileAlert, setProfileAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Password change state
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwAlert, setPwAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showPasswords, setShowPasswords] = useState(false);

  useEffect(() => {
    fetch('/api/users/me', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: UserProfile | null) => {
        if (data) {
          setProfile(data);
          setProfileForm({
            username: data.username ?? '',
            full_name: data.full_name ?? '',
            phone_number: data.phone_number ?? '',
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  function handleProfileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setProfileForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleProfileSave() {
    setProfileSaving(true);
    setProfileAlert(null);
    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = Array.isArray(data?.message) ? data.message.join(', ') : (data?.message ?? 'Erreur lors de la mise à jour');
        setProfileAlert({ type: 'error', message: msg });
      } else {
        setProfile(data);
        setEditing(false);
        setProfileAlert({ type: 'success', message: 'Profil mis à jour avec succès.' });
      }
    } catch {
      setProfileAlert({ type: 'error', message: 'Une erreur est survenue.' });
    } finally {
      setProfileSaving(false);
    }
  }

  function handleEditCancel() {
    if (profile) {
      setProfileForm({
        username: profile.username ?? '',
        full_name: profile.full_name ?? '',
        phone_number: profile.phone_number ?? '',
      });
    }
    setEditing(false);
    setProfileAlert(null);
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPwAlert(null);

    if (pwForm.new_password !== pwForm.confirm_password) {
      setPwAlert({ type: 'error', message: 'Les mots de passe ne correspondent pas.' });
      return;
    }
    if (pwForm.new_password.length < 8) {
      setPwAlert({ type: 'error', message: 'Le mot de passe doit contenir au moins 8 caractères.' });
      return;
    }

    setPwSaving(true);
    try {
      const res = await fetch('/api/users/me/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_password: pwForm.current_password,
          new_password: pwForm.new_password,
        }),
      });

      if (res.status === 204 || res.ok) {
        setPwAlert({ type: 'success', message: 'Mot de passe modifié avec succès.' });
        setPwForm({ current_password: '', new_password: '', confirm_password: '' });
      } else {
        const data = await res.json();
        const msg = Array.isArray(data?.message) ? data.message.join(', ') : (data?.message ?? 'Erreur lors du changement de mot de passe');
        setPwAlert({ type: 'error', message: msg });
      }
    } catch {
      setPwAlert({ type: 'error', message: 'Une erreur est survenue.' });
    } finally {
      setPwSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="dash-page">
        <p style={{ color: 'var(--muted)', fontSize: '0.9375rem' }}>Chargement…</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="dash-page">
        <p style={{ color: 'var(--muted)', fontSize: '0.9375rem' }}>Impossible de charger le profil.</p>
      </div>
    );
  }

  const initials = (profile.full_name || profile.username || '?')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const memberSince = new Date(profile.created_at).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="dash-page" style={{ maxWidth: '680px' }}>
      {/* Header */}
      <div style={{ marginBottom: '40px' }}>
        <p
          style={{
            fontSize: '0.6875rem',
            letterSpacing: '0.2em',
            color: ACCENT,
            fontWeight: 600,
            textTransform: 'uppercase',
            marginBottom: '8px',
          }}
        >
          Profil
        </p>
        <h1
          style={{
            fontFamily: 'var(--font-playfair)',
            fontSize: '2.25rem',
            fontWeight: 700,
            marginBottom: '6px',
          }}
        >
          Mon compte
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.9375rem' }}>
          Gérez vos informations personnelles et votre sécurité.
        </p>
      </div>

      {/* Avatar + meta */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          marginBottom: '40px',
          padding: '20px 24px',
          border: '1px solid var(--border)',
          background: 'var(--surface)',
        }}
      >
        <div
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: ACCENT,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-playfair)',
            fontSize: '1.25rem',
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {initials}
        </div>
        <div>
          <p style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '2px' }}>
            {profile.full_name || profile.username}
          </p>
          <p style={{ fontSize: '0.8125rem', color: 'var(--muted)', marginBottom: '4px' }}>
            {profile.email}
          </p>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {profile.role && (
              <span
                style={{
                  fontSize: '0.625rem',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  color: ACCENT,
                  background: `${ACCENT}1A`,
                  padding: '2px 8px',
                }}
              >
                {profile.role.name}
              </span>
            )}
            <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
              Membre depuis le {memberSince}
            </span>
          </div>
        </div>
      </div>

      {/* Profile info section */}
      <section style={{ marginBottom: '48px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
          }}
        >
          <h2
            style={{
              fontFamily: 'var(--font-playfair)',
              fontSize: '1.25rem',
              fontWeight: 600,
            }}
          >
            Informations personnelles
          </h2>
          {!editing && (
            <button
              onClick={() => { setEditing(true); setProfileAlert(null); }}
              style={{
                fontSize: '0.8125rem',
                color: ACCENT,
                background: 'transparent',
                border: `1px solid ${ACCENT}`,
                padding: '6px 16px',
                cursor: 'pointer',
              }}
            >
              Modifier
            </button>
          )}
        </div>

        {profileAlert && <Alert type={profileAlert.type} message={profileAlert.message} />}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Field
            label="Nom d'utilisateur"
            name="username"
            value={editing ? profileForm.username : profile.username}
            editing={editing}
            onChange={handleProfileChange}
            placeholder="Votre nom d'utilisateur"
          />
          <Field
            label="Nom complet"
            name="full_name"
            value={editing ? profileForm.full_name : (profile.full_name ?? '')}
            editing={editing}
            onChange={handleProfileChange}
            placeholder="Votre nom complet"
          />
          {/* Email — read-only always */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label
              style={{
                fontSize: '0.6875rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--muted)',
                fontWeight: 600,
              }}
            >
              Adresse e-mail
            </label>
            <p
              style={{
                fontSize: '0.9375rem',
                color: 'var(--muted)',
                padding: '10px 0',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              {profile.email}
              <span
                style={{
                  fontSize: '0.6875rem',
                  color: 'var(--muted)',
                  fontStyle: 'italic',
                }}
              >
                non modifiable
              </span>
            </p>
          </div>
          <Field
            label="Téléphone"
            name="phone_number"
            value={editing ? profileForm.phone_number : (profile.phone_number ?? '')}
            editing={editing}
            onChange={handleProfileChange}
            placeholder="+212 6 00 00 00 00"
          />
        </div>

        {editing && (
          <div style={{ display: 'flex', gap: '12px', marginTop: '28px' }}>
            <button
              onClick={handleProfileSave}
              disabled={profileSaving}
              style={{
                padding: '10px 24px',
                background: ACCENT,
                color: '#fff',
                border: 'none',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: profileSaving ? 'not-allowed' : 'pointer',
                opacity: profileSaving ? 0.7 : 1,
              }}
            >
              {profileSaving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
            <button
              onClick={handleEditCancel}
              disabled={profileSaving}
              style={{
                padding: '10px 24px',
                background: 'transparent',
                color: 'var(--foreground)',
                border: '1px solid var(--border)',
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              Annuler
            </button>
          </div>
        )}
      </section>

      {/* Divider */}
      <div style={{ borderTop: '1px solid var(--border)', marginBottom: '40px' }} />

      {/* Password change section */}
      <section>
        <h2
          style={{
            fontFamily: 'var(--font-playfair)',
            fontSize: '1.25rem',
            fontWeight: 600,
            marginBottom: '8px',
          }}
        >
          Changer le mot de passe
        </h2>
        <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '24px' }}>
          Utilisez un mot de passe fort avec des majuscules, minuscules et chiffres.
        </p>

        {pwAlert && <Alert type={pwAlert.type} message={pwAlert.message} />}

        <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {[
            { name: 'current_password', label: 'Mot de passe actuel', placeholder: '••••••••' },
            { name: 'new_password', label: 'Nouveau mot de passe', placeholder: '••••••••' },
            { name: 'confirm_password', label: 'Confirmer le nouveau mot de passe', placeholder: '••••••••' },
          ].map(({ name, label, placeholder }) => (
            <div key={name} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label
                style={{
                  fontSize: '0.6875rem',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--muted)',
                  fontWeight: 600,
                }}
              >
                {label}
              </label>
              <input
                name={name}
                type={showPasswords ? 'text' : 'password'}
                value={pwForm[name as keyof typeof pwForm]}
                onChange={(e) => setPwForm((prev) => ({ ...prev, [name]: e.target.value }))}
                placeholder={placeholder}
                required
                style={{
                  padding: '10px 12px',
                  border: '1px solid var(--border)',
                  background: 'var(--background)',
                  fontSize: '0.9375rem',
                  color: 'var(--foreground)',
                  outline: 'none',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          ))}

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.8125rem',
              color: 'var(--muted)',
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            <input
              type="checkbox"
              checked={showPasswords}
              onChange={(e) => setShowPasswords(e.target.checked)}
              style={{ accentColor: ACCENT }}
            />
            Afficher les mots de passe
          </label>

          <div>
            <button
              type="submit"
              disabled={pwSaving}
              style={{
                padding: '10px 24px',
                background: ACCENT,
                color: '#fff',
                border: 'none',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: pwSaving ? 'not-allowed' : 'pointer',
                opacity: pwSaving ? 0.7 : 1,
              }}
            >
              {pwSaving ? 'Modification…' : 'Changer le mot de passe'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
