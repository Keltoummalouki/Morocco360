'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocale } from '@/components/LocaleProvider';
import { getMinPrice } from '@/lib/event-filters';
import { formatEventDate, type UserEvent } from '@/lib/user-events';

/**
 * Leaflet popups render on a white surface regardless of theme, so the accent
 * is the fixed light-mode Atlas Blue rather than var(--primary) — which flips
 * to a pale blue in dark mode and would be unreadable on white.
 */
const ATLAS = '#003E7A';

/**
 * Build the popup as real DOM nodes.
 *
 * SECURITY: `title` and `place` are organizer-supplied and stored in the DB.
 * Interpolating them into an HTML string (Leaflet's setContent accepts raw
 * HTML) is stored XSS — an event titled `<img src=x onerror=...>` would run in
 * every viewer's browser. `textContent` never parses markup, so this is safe by
 * construction rather than by remembering to escape.
 */
function buildPopupElement({
  id,
  title,
  place,
  date,
  price,
  reserveLabel,
}: {
  id: number;
  title: string;
  place: string;
  date: string;
  price: string;
  reserveLabel: string;
}): HTMLElement {
  const root = document.createElement('div');
  root.style.cssText = 'font-family:system-ui,sans-serif;padding:2px;min-width:180px;';

  const titleEl = document.createElement('div');
  titleEl.textContent = title;
  titleEl.style.cssText =
    'font-size:0.9rem;font-weight:700;line-height:1.3;margin-bottom:4px;color:#161d1f;';

  const placeEl = document.createElement('div');
  placeEl.textContent = place;
  placeEl.style.cssText = 'font-size:0.75rem;color:#555;margin-bottom:2px;';

  const dateEl = document.createElement('div');
  dateEl.textContent = date;
  dateEl.style.cssText = 'font-size:0.75rem;color:#555;margin-bottom:8px;';

  const row = document.createElement('div');
  row.style.cssText =
    'display:flex;justify-content:space-between;align-items:center;gap:8px;';

  const priceEl = document.createElement('span');
  priceEl.textContent = price;
  priceEl.style.cssText = `font-size:0.75rem;font-weight:700;color:${ATLAS};`;

  const link = document.createElement('a');
  // `id` is a number from the API, but encode anyway so the href can never be
  // broken out of.
  link.setAttribute('href', `/user/events/${encodeURIComponent(String(id))}`);
  link.textContent = reserveLabel;
  link.style.cssText = `font-size:0.75rem;color:#fff;background:${ATLAS};padding:5px 12px;border-radius:8px;text-decoration:none;font-weight:600;`;

  row.append(priceEl, link);
  root.append(titleEl, placeEl, dateEl, row);
  return root;
}

export default function EventsMap({ events }: { events: UserEvent[] }) {
  const { t, locale } = useLocale();
  const te = t.events;
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);
  /** Leaflet loads asynchronously; the marker effect must wait for it. */
  const [ready, setReady] = useState(false);

  const mappable = events.filter((e) => e.latitude != null && e.longitude != null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    let cancelled = false;

    void import('leaflet').then((L) => {
      if (cancelled || !mapRef.current || mapInstanceRef.current) return;

      const map = L.map(mapRef.current).setView([31.7917, -7.0926], 6);
      mapInstanceRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map);

      // Unblocks the marker effect below — without this it runs once while the
      // map is still null, bails, and never draws a single pin.
      setReady(true);
    });

    return () => {
      cancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Re-draw markers once the map exists, and whenever the filtered set changes.
  useEffect(() => {
    if (!ready) return;
    const map = mapInstanceRef.current;
    if (!map) return;

    void import('leaflet').then((L) => {
      map.eachLayer((layer: unknown) => {
        if (layer instanceof L.Marker) map.removeLayer(layer);
      });

      const icon = L.divIcon({
        className: '',
        html: `<div style="width:26px;height:26px;background:${ATLAS};border:2.5px solid #fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>`,
        iconSize: [26, 26],
        iconAnchor: [13, 26],
        popupAnchor: [0, -28],
      });

      mappable.forEach((event) => {
        const min = getMinPrice(event.categories);
        const price =
          min === null ? '—' : min === 0 ? te.free : `${te.from} ${min.toFixed(0)} ${te.currency}`;
        const place = event.city ?? event.location_name;

        const popupEl = buildPopupElement({
          id: event.id,
          title: event.title,
          place,
          date: formatEventDate(event.date_start, locale),
          price,
          reserveLabel: te.reserve,
        });

        L.marker([event.latitude as number, event.longitude as number], { icon })
          .bindPopup(L.popup({ maxWidth: 250 }).setContent(popupEl))
          .addTo(map);
      });

      if (mappable.length > 0) {
        const bounds = L.latLngBounds(
          mappable.map((e) => [e.latitude as number, e.longitude as number]),
        );
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 9 });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, mappable, locale]);

  if (mappable.length === 0) {
    return (
      <div className="flex h-80 items-center justify-center rounded-xl border border-border bg-muted text-sm text-muted-foreground">
        {te.noMapCoords}
      </div>
    );
  }

  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div
        ref={mapRef}
        className="rounded-xl border border-border"
        style={{ height: '480px', width: '100%', zIndex: 0 }}
      />
    </>
  );
}
