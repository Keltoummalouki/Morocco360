import type { Metadata } from 'next';
import { Inter, Playfair_Display, Noto_Sans_Arabic, Plus_Jakarta_Sans, Work_Sans } from 'next/font/google';
import { cookies } from 'next/headers';
import './globals.css';

import { LocaleProvider } from '@/components/LocaleProvider';
import { ThemeProvider } from '@/components/ThemeProvider';
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

/* ── Imperial Trinity fonts (events home + app) ───────────── */
const jakarta = Plus_Jakarta_Sans({
  variable: '--font-jakarta',
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
});

const workSans = Work_Sans({
  variable: '--font-work-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
});

export const metadata: Metadata = {
  title: {
    default: 'EventHub — Discover & book events across Morocco',
    template: '%s · EventHub',
  },
  description:
    'Discover concerts, festivals, matches and cultural events across Morocco — and book secure tickets in seconds. From the medina to the main stage.',
  keywords: ['Morocco', 'events', 'tickets', 'concerts', 'festivals', 'Marrakech', 'Casablanca', 'booking'],
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
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <head>
        {/* Prevent flash of wrong theme on load */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('theme')||(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');if(t==='dark')document.documentElement.setAttribute('data-theme','dark');}catch(e){}`,
          }}
        />
      </head>
      <body
        suppressHydrationWarning
        className={`${inter.variable} ${playfair.variable} ${notoArabic.variable} ${jakarta.variable} ${workSans.variable} antialiased`}
        style={locale === 'ar' ? { fontFamily: 'var(--font-arabic), system-ui' } : undefined}
      >
        <ThemeProvider>
          <LocaleProvider locale={locale}>{children}</LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
