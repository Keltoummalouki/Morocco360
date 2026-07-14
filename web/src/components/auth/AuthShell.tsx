import Link from 'next/link';
import Image from 'next/image';
import Logo from '@/components/Logo';

/**
 * Split layout shared by /login and /register.
 * The brand panel is decorative and is dropped entirely below `lg`, so phones
 * get the form full-width with no wasted scroll.
 */
export default function AuthShell({
  children,
  aside,
  image = '/events/hero-marrakech.webp',
}: {
  children: React.ReactNode;
  aside: React.ReactNode;
  /** Background photo for the brand panel (desktop only). */
  image?: string;
}) {
  return (
    <div className="ev min-h-screen lg:grid lg:grid-cols-[45%_1fr]">
      {/* ── Brand panel (desktop only) ─────────────────── */}
      <aside className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between">
        <Image
          src={image}
          alt=""
          fill
          priority
          sizes="45vw"
          className="object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(10,16,23,0.55) 0%, rgba(10,16,23,0.88) 100%)',
          }}
        />

        <div className="relative z-10 p-10">
          <Link href="/" aria-label="Morocco360 — home">
            <Logo tone="light" />
          </Link>
        </div>

        <div className="relative z-10 p-10 text-white">{aside}</div>
      </aside>

      {/* ── Form panel ─────────────────────────────────── */}
      <main className="flex min-h-screen flex-col items-center justify-center px-5 py-12 sm:px-8 lg:min-h-0 lg:py-16">
        <div className="mb-10 self-start lg:hidden">
          <Link href="/" aria-label="Morocco360 — home">
            <Logo />
          </Link>
        </div>
        {children}
      </main>
    </div>
  );
}
