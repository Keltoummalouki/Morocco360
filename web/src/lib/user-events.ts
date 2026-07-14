/** Shapes + formatting shared across the /user app surfaces. */

export interface EventTicketCategory {
  id: number;
  name: string;
  price: string;
  stock_allocated: number;
  stock_remaining?: number;
}

export interface UserEvent {
  id: number;
  title: string;
  description: string;
  date_start: string;
  date_end: string;
  location_name: string;
  city: string | null;
  category: string | null;
  latitude: number | null;
  longitude: number | null;
  image_url: string | null;
  total_stock: number;
  is_active: boolean;
  is_sold_out?: boolean;
  categories: EventTicketCategory[];
}

/** Map an app locale to a BCP-47 tag for Intl formatting. */
export function bcpFor(locale: string): string {
  return locale === 'ar' ? 'ar-MA' : locale === 'fr' ? 'fr-FR' : 'en-GB';
}

export function formatEventDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(bcpFor(locale), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatEventDateLong(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(bcpFor(locale), {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
