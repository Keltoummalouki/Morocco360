'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { useLocale } from '@/components/LocaleProvider';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import PhoneInput from '@/components/PhoneInput';
import { bcpFor } from '@/lib/user-events';

interface UserProfile {
  id: number;
  username: string;
  email: string;
  full_name: string | null;
  phone_number: string | null;
  created_at: string;
  role: { name: string } | null;
}

type FieldKey = 'username' | 'email' | 'phone_number' | 'general';

/** The API returns a single message; route it to the field it's about. */
function fieldForMessage(message: string): FieldKey {
  const m = message.toLowerCase();
  if (m.includes('username')) return 'username';
  if (m.includes('email')) return 'email';
  if (m.includes('phone')) return 'phone_number';
  return 'general';
}

function Alert({ kind, children }: { kind: 'error' | 'success'; children: React.ReactNode }) {
  const color = kind === 'error' ? 'var(--error)' : 'var(--success)';
  const bg = kind === 'error' ? 'var(--error-bg)' : 'var(--success-bg)';
  const Icon = kind === 'error' ? AlertCircle : CheckCircle2;
  return (
    <div
      role={kind === 'error' ? 'alert' : 'status'}
      className="mb-4 flex items-center gap-2.5 rounded-md border p-3 text-sm"
      style={{ borderColor: color, background: bg, color }}
    >
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      {children}
    </div>
  );
}

export default function UserProfilePage() {
  const { t, locale } = useLocale();
  const ta = t.app;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ username: '', full_name: '', email: '', phone_number: '' });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [okMsg, setOkMsg] = useState('');

  const [pw, setPw] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwOk, setPwOk] = useState('');
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    fetch('/api/users/me', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: UserProfile | null) => {
        if (!data) return;
        setProfile(data);
        setForm({
          username: data.username ?? '',
          full_name: data.full_name ?? '',
          email: data.email ?? '',
          phone_number: data.phone_number ?? '',
        });
      })
      .finally(() => setLoading(false));
  }, []);

  function resetEdit() {
    if (profile) {
      setForm({
        username: profile.username ?? '',
        full_name: profile.full_name ?? '',
        email: profile.email ?? '',
        phone_number: profile.phone_number ?? '',
      });
    }
    setErrors({});
    setOkMsg('');
    setEditing(false);
  }

  async function saveProfile() {
    setSaving(true);
    setErrors({});
    setOkMsg('');
    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        const raw = Array.isArray(data?.message) ? data.message.join(', ') : (data?.message ?? ta.genericError);
        setErrors({ [fieldForMessage(String(raw))]: String(raw) });
        return;
      }

      setProfile(data as UserProfile);
      setEditing(false);
      setOkMsg(ta.profileUpdated);
    } catch {
      setErrors({ general: ta.genericError });
    } finally {
      setSaving(false);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError('');
    setPwOk('');

    if (pw.new_password !== pw.confirm_password) {
      setPwError(ta.passwordMismatch);
      return;
    }
    if (pw.new_password.length < 8) {
      setPwError(ta.passwordTooShort);
      return;
    }

    setPwSaving(true);
    try {
      const res = await fetch('/api/users/me/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_password: pw.current_password,
          new_password: pw.new_password,
        }),
      });

      if (res.status === 204 || res.ok) {
        setPwOk(ta.passwordUpdated);
        setPw({ current_password: '', new_password: '', confirm_password: '' });
      } else {
        const data = await res.json();
        const raw = Array.isArray(data?.message) ? data.message.join(', ') : (data?.message ?? ta.genericError);
        setPwError(String(raw));
      }
    } catch {
      setPwError(ta.genericError);
    } finally {
      setPwSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="ev-container py-8 sm:py-12">
        <Skeleton className="mb-4 h-10 w-64" />
        <Skeleton className="mb-8 h-5 w-96 max-w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="ev-container py-8 sm:py-12">
        <p className="text-muted-foreground">{ta.loadError}</p>
      </div>
    );
  }

  const initials = (profile.full_name || profile.username || '?')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const memberSince = new Date(profile.created_at).toLocaleDateString(bcpFor(locale), {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="ev-container py-8 sm:py-12">
      <header className="mb-8">
        <div className="eyebrow mb-3">{ta.tabProfile}</div>
        <h1 className="ev-display text-[clamp(1.7rem,4.5vw,2.6rem)]">{ta.profileTitle}</h1>
        <p className="ev-sub">{ta.profileSubtitle}</p>
      </header>

      {/* Identity */}
      <Card className="mb-8 flex-row items-center gap-4 p-5">
        <Avatar className="size-14">
          <AvatarFallback className="bg-primary text-lg font-bold text-primary-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate font-semibold">{profile.full_name || profile.username}</p>
          <p className="truncate text-sm text-muted-foreground">{profile.email}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {profile.role?.name ? `${profile.role.name} · ` : ''}
            {ta.memberSince} {memberSince}
          </p>
        </div>
      </Card>

      {/* Personal info */}
      <section className="mb-10">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="ev-h2 text-xl">{ta.personalInfo}</h2>
          {!editing && (
            <Button variant="outline" size="sm" onClick={() => { setEditing(true); setOkMsg(''); }}>
              {ta.edit}
            </Button>
          )}
        </div>

        {okMsg && <Alert kind="success">{okMsg}</Alert>}
        {errors.general && <Alert kind="error">{errors.general}</Alert>}

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="username">{ta.username}</Label>
            <Input
              id="username"
              value={form.username}
              disabled={!editing}
              aria-invalid={!!errors.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              className="h-11"
            />
            {errors.username && (
              <p className="text-xs" style={{ color: 'var(--error)' }}>{errors.username}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="full_name">{ta.fullName}</Label>
            <Input
              id="full_name"
              value={form.full_name}
              disabled={!editing}
              onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
              className="h-11"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email">{ta.email}</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              disabled={!editing}
              aria-invalid={!!errors.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="h-11"
            />
            {errors.email && (
              <p className="text-xs" style={{ color: 'var(--error)' }}>{errors.email}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="phone">{ta.phone}</Label>
            {/* `key` remounts on edit/cancel so the input reseeds from the
                real value — otherwise Cancel leaves the abandoned number on
                screen while the form state says otherwise. */}
            <PhoneInput
              key={editing ? 'phone-edit' : 'phone-view'}
              id="phone"
              value={form.phone_number}
              disabled={!editing}
              onChange={(v) => setForm((f) => ({ ...f, phone_number: v }))}
            />
            {errors.phone_number && (
              <p className="text-xs" style={{ color: 'var(--error)' }}>{errors.phone_number}</p>
            )}
          </div>
        </div>

        {editing && (
          <div className="mt-6 flex gap-3">
            <Button onClick={saveProfile} disabled={saving}>
              {saving ? ta.saving : ta.saveBtn}
            </Button>
            <Button variant="outline" onClick={resetEdit} disabled={saving}>
              {ta.cancel}
            </Button>
          </div>
        )}
      </section>

      {/* Password */}
      <section className="border-t border-border pt-8">
        <h2 className="ev-h2 mb-1 text-xl">{ta.changePassword}</h2>
        <p className="mb-5 text-sm text-muted-foreground">{ta.passwordHint}</p>

        {pwOk && <Alert kind="success">{pwOk}</Alert>}
        {pwError && <Alert kind="error">{pwError}</Alert>}

        <form onSubmit={changePassword} className="grid max-w-md gap-4">
          {(
            [
              ['current_password', ta.currentPassword, 'current-password'],
              ['new_password', ta.newPassword, 'new-password'],
              ['confirm_password', ta.confirmPassword, 'new-password'],
            ] as const
          ).map(([name, label, autoComplete]) => (
            <div key={name} className="grid gap-2">
              <Label htmlFor={name}>{label}</Label>
              <Input
                id={name}
                name={name}
                type={showPw ? 'text' : 'password'}
                autoComplete={autoComplete}
                required
                value={pw[name]}
                onChange={(e) => setPw((p) => ({ ...p, [name]: e.target.value }))}
                className="h-11"
              />
            </div>
          ))}

          <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground select-none">
            <input
              type="checkbox"
              checked={showPw}
              onChange={(e) => setShowPw(e.target.checked)}
              className="accent-[var(--primary)]"
            />
            {ta.showPasswords}
          </label>

          <div>
            <Button type="submit" disabled={pwSaving}>
              {pwSaving ? ta.updating : ta.updatePassword}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
