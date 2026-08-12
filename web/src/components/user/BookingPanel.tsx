'use client';

import { useState } from 'react';
import { Minus, Plus, Lock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useLocale } from '@/components/LocaleProvider';
import { formatEventDate, type EventTicketCategory } from '@/lib/user-events';

export default function BookingPanel({
  eventId,
  categories,
  dateStart,
  dateEnd,
  totalStock,
}: {
  eventId: number;
  categories: EventTicketCategory[];
  dateStart: string;
  dateEnd: string;
  totalStock: number;
}) {
  const { t, locale } = useLocale();
  const te = t.events;
  const ta = t.app;

  const [selectedId, setSelectedId] = useState<number>(categories[0]?.id ?? 0);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selected = categories.find((c) => c.id === selectedId);
  const unitPrice = selected ? Number(selected.price) : 0;
  const total = unitPrice * quantity;
  const isFree = unitPrice === 0;
  // `??` keeps a real 0 (sold out) — don't fall back to totalStock on zero.
  const stockLeft = selected?.stock_remaining ?? totalStock;
  const soldOut = stockLeft <= 0;
  const maxQuantity = Math.min(10, Math.max(1, stockLeft));

  function pickCategory(id: number) {
    setSelectedId(id);
    setQuantity(1); // stock differs per category — never carry a now-invalid qty
  }

  async function handleCheckout() {
    if (!selected) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, categoryId: selected.id, quantity }),
      });
      const data = (await res.json()) as { url?: string; message?: string };
      if (!res.ok) {
        setError(data.message ?? ta.genericError);
        return;
      }
      if (data.url) window.location.href = data.url;
    } catch {
      setError(ta.genericError);
    } finally {
      setLoading(false);
    }
  }

  const minPrice = categories.length
    ? Math.min(...categories.map((c) => Number(c.price)))
    : 0;

  return (
    <Card className="w-full gap-4 p-6 lg:sticky lg:top-24 lg:w-80">
      <div>
        <p className="ev-display text-2xl">
          {minPrice === 0 ? te.free : `${te.from} ${minPrice.toFixed(0)} ${te.currency}`}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {formatEventDate(dateStart, locale)} — {formatEventDate(dateEnd, locale)}
        </p>
      </div>

      {/* Category */}
      <fieldset>
        <legend className="mb-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          {ta.category}
        </legend>
        <div className="flex flex-col gap-1.5">
          {categories.map((cat) => {
            const active = cat.id === selectedId;
            const free = Number(cat.price) === 0;
            const left = cat.stock_remaining ?? cat.stock_allocated;
            const catSoldOut = left <= 0;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => pickCategory(cat.id)}
                aria-pressed={active}
                disabled={catSoldOut}
                className={`flex items-center justify-between rounded-md border p-3 text-start transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                  active
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-accent'
                }`}
              >
                <span>
                  <span className={`block text-sm ${active ? 'font-semibold text-primary' : 'text-foreground'}`}>
                    {cat.name}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {catSoldOut ? te.soldOut : `${left} ${ta.placesLeft}`}
                  </span>
                </span>
                <span className="shrink-0 text-sm font-semibold">
                  {free ? te.free : `${Number(cat.price).toFixed(0)} ${te.currency}`}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Quantity */}
      <div>
        <p className="mb-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          {ta.quantity}
        </p>
        <div className="flex w-fit items-center rounded-md border border-border">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-e-none"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
            aria-label="-"
          >
            <Minus className="size-4" aria-hidden="true" />
          </Button>
          <span
            className="w-12 border-x border-border text-center text-sm font-semibold leading-9"
            aria-live="polite"
          >
            {quantity}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-s-none"
            onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
            disabled={quantity >= maxQuantity}
            aria-label="+"
          >
            <Plus className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

      {!isFree && (
        <div className="flex items-center justify-between border-y border-border py-3">
          <span className="text-sm text-muted-foreground">{ta.total}</span>
          <span className="text-lg font-bold">
            {total.toFixed(0)} {te.currency}
          </span>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-md border p-3 text-sm"
          style={{ borderColor: 'var(--error)', background: 'var(--error-bg)', color: 'var(--error)' }}
        >
          <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
          {error}
        </div>
      )}

      <Button
        type="button"
        size="lg"
        className="w-full"
        onClick={handleCheckout}
        disabled={loading || !selected || soldOut}
      >
        {loading
          ? ta.redirecting
          : soldOut
            ? te.soldOut
            : isFree
              ? ta.payFree
              : `${ta.payPrefix} ${total.toFixed(0)} ${te.currency}`}
      </Button>

      {!isFree && (
        <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <Lock className="size-3" aria-hidden="true" /> {ta.secure}
        </p>
      )}

      <p className="text-center text-xs text-muted-foreground">
        {totalStock} {ta.placesTotal}
      </p>
    </Card>
  );
}
