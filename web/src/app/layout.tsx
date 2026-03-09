import type { Metadata } from 'next';
import { Inter, Playfair_Display, Noto_Sans_Arabic } from 'next/font/google';
import { cookies } from 'next/headers';
import './globals.css';

import { LocaleProvider } from '@/components/LocaleProvider';
import type { Locale } from '@/lib/i18n';
import { DEFAULT_LOCALE, LOCALES, LOCALE_COOKIE, isRTL } from '@/lib/i18n';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
});

const playfair = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
});

const notoArabic = Noto_Sans_Arabic({
  variable: '--font-arabic',
  subsets: ['arabic'],
  weight: ['300', '400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Morocco360 — Discover the Kingdom',
  description:
    'Explore Morocco through immersive 360° panoramic experiences. Ancient medinas, golden deserts, and coastal cities await.',
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const raw = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale: Locale = LOCALES.includes(raw as Locale)
    ? (raw as Locale)
    : DEFAULT_LOCALE;
  const dir = isRTL(locale) ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={dir}>
      <body
        className={`${inter.variable} ${playfair.variable} ${notoArabic.variable} antialiased`}
        style={locale === 'ar' ? { fontFamily: 'var(--font-arabic), system-ui' } : undefined}
      >
        <LocaleProvider locale={locale}>{children}</LocaleProvider>
      </body>
    </html>
  );
}
