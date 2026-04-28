import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import type { Locale } from '@/lib/i18n';
import { LOCALES, LOCALE_COOKIE } from '@/lib/i18n';

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { locale?: string };
  const locale = body.locale;

  if (!locale || !LOCALES.includes(locale as Locale)) {
    return NextResponse.json({ error: 'Invalid locale' }, { status: 400 });
  }

  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: 'lax',
  });

  return NextResponse.json({ ok: true });
}
