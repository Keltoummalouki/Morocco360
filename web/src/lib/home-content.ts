/**
 * Curated placeholder content for the events home page (matches the Stitch
 * "Trending Experiences" design). Swap for real API data via the BFF proxy
 * later — the shapes here are the contract the home sections render against.
 *
 * Images are branded gradient placeholders (`tint`) until real photos land in
 * /public; drop a real `image` path in and the card uses it.
 */

export type CardVariant = 'fill' | 'stacked' | 'split';

export interface EventItem {
  id: string;
  title: string;
  /** display label, e.g. "Music", "Culture & Food" */
  category: string;
  /** category color for the tinted badge on a light surface */
  categoryColor: string;
  /** lightened variant used on the dark surface — keeps the badge at >=4.5:1 */
  categoryColorDark: string;
  city: string;
  /** display string as shown on the card, e.g. "Jun 22-24", "Daily" */
  dateLabel: string;
  /** lowest ticket price; null = free entry */
  price: number | null;
  currency: string;
  variant: CardVariant;
  /** CSS gradient used as the placeholder media background */
  tint: string;
  /** optional real image path in /public */
  image?: string;
  /** `fill` cards only — render at the taller bento height */
  tall?: boolean;
}

export const TRENDING: EventItem[] = [
  {
    id: 'gnaoua',
    title: 'Gnaoua World Music Festival',
    category: 'Music',
    categoryColor: '#0055A4',
    categoryColorDark: '#8FBCFF',
    city: 'Essaouira',
    dateLabel: 'Jun 22-24',
    price: 150,
    currency: 'DH',
    variant: 'fill',
    tint: 'linear-gradient(150deg, #0A6ED1 0%, #0B3D91 55%, #061E4A 130%)',
    image: '/events/gnaoua.webp',
    tall: true,
  },
  {
    id: 'taghazout-surf',
    title: 'Taghazout Surf Pro',
    category: 'Sports',
    categoryColor: '#0E7490',
    categoryColorDark: '#6FD8EC',
    city: 'Agadir',
    dateLabel: 'Oct 12',
    price: 400,
    currency: 'DH',
    variant: 'stacked',
    tint: 'linear-gradient(150deg, #086E86 0%, #0A6ED1 100%)',
    image: '/events/taghazout.webp',
  },
  {
    id: 'medina-culinary',
    title: 'Medina Culinary Tour',
    category: 'Culture & Food',
    categoryColor: '#7B5800',
    categoryColorDark: '#FDD589',
    city: 'Marrakech',
    dateLabel: 'Daily',
    price: 250,
    currency: 'DH',
    variant: 'fill',
    tint: 'linear-gradient(150deg, #00B8D9 0%, #0B3D91 90%)',
    image: '/events/medina.webp',
  },
  {
    id: 'casa-art-fair',
    title: 'Casa Contemporary Art Fair',
    category: 'Art & Design',
    categoryColor: '#5B21B6',
    categoryColorDark: '#CBB4F7',
    city: 'Casablanca',
    dateLabel: 'Nov 5-8',
    price: null,
    currency: 'DH',
    variant: 'split',
    tint: 'linear-gradient(150deg, #22303D 0%, #4A6072 100%)',
    image: '/events/casa.webp',
  },
];

const FROM_LABEL: Record<string, string> = { fr: 'Dès', ar: 'من', en: 'From' };

/** "From 150 DH" for paid events; callers render the free label themselves. */
export function formatPrice(price: number, currency: string, locale: string): string {
  const label = FROM_LABEL[locale] ?? FROM_LABEL.en;
  return `${label} ${price} ${currency}`;
}
