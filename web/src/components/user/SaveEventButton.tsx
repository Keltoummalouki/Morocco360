'use client';

import { useState } from 'react';
import { Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocale } from '@/components/LocaleProvider';

export default function SaveEventButton({
  eventId,
  initialSaved,
}: {
  eventId: number;
  initialSaved: boolean;
}) {
  const { t } = useLocale();
  const [saved, setSaved] = useState(initialSaved);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    const next = !saved;
    setSaved(next); // optimistic
    setBusy(true);
    try {
      const res = await fetch(`/api/events/${eventId}/save`, {
        method: next ? 'POST' : 'DELETE',
      });
      if (!res.ok) throw new Error('save failed');
    } catch {
      setSaved(!next); // roll back
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      type="button"
      variant={saved ? 'secondary' : 'outline'}
      onClick={toggle}
      disabled={busy}
      aria-pressed={saved}
    >
      <Bookmark className="size-4" fill={saved ? 'currentColor' : 'none'} aria-hidden="true" />
      {saved ? t.app.unsave : t.app.save}
    </Button>
  );
}
