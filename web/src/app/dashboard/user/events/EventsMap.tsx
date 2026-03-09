'use client';

import { useEffect, useRef } from 'react';
import { useLocale } from '@/components/LocaleProvider';

interface TicketCategory {
  id: number;
  name: string;
  price: string;
  stock_allocated: number;
}

export interface EventWithCoords {
  id: number;
  title: string;
  date_start: string;
  location_name: string;
  city: string | null;
  category: string | null;
  latitude: number | null;
  longitude: number | null;
  categories: TicketCategory[];
}

const ACCENT = '#4A7C6F';

export default function EventsMap({ events }: { events: EventWithCoords[] }) {
  const { t, locale } = useLocale();
  const te = t.events;
  const mapRef         = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);

  const mappable = events.filter((e) => e.latitude != null && e.longitude != null);

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString(
      locale === 'ar' ? 'ar-MA' : locale === 'en' ? 'en-GB' : 'fr-FR',
      { day: 'numeric', month: 'short', year: 'numeric' },
    );
  }

  function minPriceLabel(categories: TicketCategory[]) {
    if (!categories.length) return te.free;
    const min = Math.min(...categories.map((c) => Number(c.price)));
    return min === 0 ? te.free : `${te.from} ${min.toFixed(0)} ${te.currency}`;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function buildMarkerIcon(L: any) {
    return L.divIcon({
      className: '',
      html: `<div style="width:28px;height:28px;background:${ACCENT};border:2.5px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 28],
      popupAnchor: [0, -30],
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function buildPopup(L: any, event: EventWithCoords) {
    const price    = minPriceLabel(event.categories);
    const date     = formatDate(event.date_start);
    const location = event.city ?? event.location_name;

    return L.popup({ maxWidth: 240 }).setContent(`
      <div style="font-family:system-ui,sans-serif;padding:4px 2px;">
        ${event.category
          ? `<span style="font-size:0.6rem;letter-spacing:0.12em;text-transform:uppercase;font-weight:600;color:${ACCENT};background:${ACCENT}1A;padding:2px 6px;display:inline-block;margin-bottom:6px;">${event.category}</span>`
          : ''}
        <div style="font-size:0.9rem;font-weight:700;line-height:1.3;margin-bottom:4px;color:#1a1a1a;">${event.title}</div>
        <div style="font-size:0.75rem;color:#666;margin-bottom:2px;">📍 ${location}</div>
        <div style="font-size:0.75rem;color:#666;margin-bottom:8px;">📅 ${date}</div>
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:0.75rem;font-weight:600;color:${ACCENT};">${price}</span>
          <a href="/dashboard/user/events/${event.id}"
            style="font-size:0.75rem;color:white;background:${ACCENT};padding:4px 10px;text-decoration:none;font-weight:500;">
            ${te.see}
          </a>
        </div>
      </div>
    `);
  }

  // Initial mount — create map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    import('leaflet').then((L) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl:        'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl:  'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl:      'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      if (!mapRef.current || mapInstanceRef.current) return;

      const map = L.map(mapRef.current).setView([31.7917, -7.0926], 6);
      mapInstanceRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map);

      const icon = buildMarkerIcon(L);
      mappable.forEach((event) => {
        L.marker([event.latitude as number, event.longitude as number], { icon })
          .bindPopup(buildPopup(L, event))
          .addTo(map);
      });

      if (mappable.length > 0) {
        const bounds = L.latLngBounds(
          mappable.map((e) => [e.latitude as number, e.longitude as number]),
        );
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 8 });
      }
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update markers when filtered events change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    import('leaflet').then((L) => {
      map.eachLayer((layer: unknown) => {
        if (layer instanceof L.Marker) map.removeLayer(layer);
      });

      const icon = buildMarkerIcon(L);
      mappable.forEach((event) => {
        L.marker([event.latitude as number, event.longitude as number], { icon })
          .bindPopup(buildPopup(L, event))
          .addTo(map);
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mappable]);

  if (mappable.length === 0) {
    return (
      <div
        style={{
          border: '1px solid var(--border)',
          height: '320px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--surface)',
          color: 'var(--muted)',
          fontSize: '0.875rem',
        }}
      >
        {te.noMapCoords}
      </div>
    );
  }

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div
        ref={mapRef}
        style={{ height: '420px', width: '100%', border: '1px solid var(--border)', zIndex: 0 }}
      />
    </>
  );
}
