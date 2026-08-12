import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ShieldCheck, Ticket, QrCode, CalendarHeart } from 'lucide-react';
import AuthShell from '@/components/auth/AuthShell';
import RegisterForm from '@/components/RegisterForm';

export const metadata: Metadata = {
  title: 'Create account',
  description: 'Create a free Morocco360 account to book tickets to events across Morocco.',
};

const PERKS = [
  { Icon: Ticket, label: 'Book in seconds', desc: 'Concerts, festivals, matches and culture' },
  { Icon: ShieldCheck, label: 'Secure payments', desc: 'Protected checkout, receipt emailed instantly' },
  { Icon: QrCode, label: 'Instant QR tickets', desc: 'Scan at the gate — no paper, no queue' },
  { Icon: CalendarHeart, label: 'Save what you love', desc: 'Track bookings and never miss a date' },
];

export default function RegisterPage() {
  return (
    <AuthShell
      image="/events/gnaoua.webp"
      aside={
        <>
          <p className="text-[0.6875rem] font-semibold tracking-[0.24em] text-white/70 uppercase">
            Join the community
          </p>
          <h2 className="ev-display mt-3 max-w-[16ch] text-[clamp(1.6rem,2.2vw,2.125rem)] text-white">
            Every Moroccan event, one account
          </h2>

          <div className="mt-8 flex flex-col gap-5">
            {PERKS.map(({ Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-3.5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white">
                  <Icon size={17} aria-hidden="true" />
                </span>
                <div>
                  <p className="text-[0.9375rem] font-medium text-white">{label}</p>
                  <p className="text-[0.8125rem] text-white/65">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      }
    >
      <Suspense
        fallback={
          <div className="w-full max-w-md text-sm text-muted-foreground">Loading…</div>
        }
      >
        <RegisterForm />
      </Suspense>
    </AuthShell>
  );
}
