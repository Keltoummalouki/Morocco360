'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { gsap, EASE, DUR, prefersReducedMotion } from '@/lib/gsap';

/* ── Page entrance wrapper ─────────────────────────────────
   Wraps a dashboard page and animates:
   - Header stagger reveal
   - Stat cards stagger
   - Content fade-up
   ─────────────────────────────────────────────────────────── */
export function DashboardPage({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      // Header
      const header = el.querySelector('.dash-header');
      if (header) {
        gsap.fromTo(header,
          { y: 24, opacity: 0 },
          { y: 0, opacity: 1, duration: DUR.slow, ease: EASE.expo }
        );
      }

      // Stat cards stagger
      const statCards = el.querySelectorAll('.stat-card');
      if (statCards.length) {
        gsap.fromTo(statCards,
          { y: 32, opacity: 0, scale: 0.96 },
          { y: 0, opacity: 1, scale: 1, stagger: 0.07, duration: DUR.slow, ease: EASE.expo, delay: 0.15 }
        );
      }

      // Table rows stagger
      const rows = el.querySelectorAll('tbody tr');
      if (rows.length) {
        gsap.fromTo(rows,
          { x: -20, opacity: 0 },
          { x: 0, opacity: 1, stagger: 0.04, duration: DUR.normal, ease: EASE.out, delay: 0.3 }
        );
      }

      // Border-glow cards
      const bgCards = el.querySelectorAll('.border-glow-card');
      if (bgCards.length) {
        gsap.fromTo(bgCards,
          { y: 24, opacity: 0 },
          { y: 0, opacity: 1, stagger: 0.08, duration: DUR.slow, ease: EASE.expo, delay: 0.2 }
        );
      }

      // Quick action buttons
      const btns = el.querySelectorAll('.btn-primary, .btn-outline');
      if (btns.length) {
        gsap.fromTo(btns,
          { y: 12, opacity: 0 },
          { y: 0, opacity: 1, stagger: 0.06, duration: DUR.normal, ease: EASE.out, delay: 0.1 }
        );
      }
    }, el);

    return () => ctx.revert();
  }, []);

  return <div ref={ref}>{children}</div>;
}

/* ── Skeleton loader animated with GSAP shimmer ──────────── */
export function SkeletonCard({ height = 120, delay = 0 }: { height?: number; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    gsap.to(el, {
      backgroundPosition: '200% center',
      duration: 1.6,
      ease: 'none',
      repeat: -1,
      delay,
    });
  }, [delay]);

  return (
    <div
      ref={ref}
      style={{
        height,
        background: 'linear-gradient(90deg, var(--surface-2) 0%, var(--surface-3) 45%, var(--surface-2) 100%)',
        backgroundSize: '200% auto',
        borderRadius: '2px',
        border: '1px solid var(--border)',
      }}
    />
  );
}

/* ── Animated progress bar ───────────────────────────────── */
export function AnimatedProgressBar({
  value,
  color = 'var(--primary)',
  height = 4,
  delay = 0,
}: {
  value: number;
  color?: string;
  height?: number;
  delay?: number;
}) {
  const fillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = fillRef.current;
    if (!el) return;
    gsap.fromTo(el,
      { width: '0%' },
      { width: `${value}%`, duration: 1.2, ease: 'power2.out', delay }
    );
  }, [value, delay]);

  return (
    <div style={{ height, background: 'var(--border)', borderRadius: height / 2, overflow: 'hidden' }}>
      <div
        ref={fillRef}
        style={{
          height: '100%',
          background: `linear-gradient(90deg, ${color}, ${color}aa)`,
          borderRadius: height / 2,
          width: '0%',
        }}
      />
    </div>
  );
}

/* ── Stat card with entrance ─────────────────────────────── */
export function AnimatedStatCard({
  label,
  value,
  sub,
  color,
  icon,
  index = 0,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  icon?: string;
  index?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    gsap.fromTo(el,
      { y: 28, opacity: 0, scale: 0.96 },
      { y: 0, opacity: 1, scale: 1, duration: DUR.slow, ease: EASE.expo, delay: index * 0.07 }
    );
  }, [index]);

  return (
    <div ref={ref} className="stat-card" style={{ opacity: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        {icon && <span style={{ color: color ?? 'var(--primary)', fontSize: '1rem' }}>{icon}</span>}
        {color && (
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, boxShadow: `0 0 8px ${color}` }} />
        )}
      </div>
      <p style={{ fontFamily: 'var(--font-playfair)', fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: '4px', color: color ?? 'var(--foreground)' }}>
        {value}
      </p>
      <p style={{ fontSize: '0.75rem', color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: sub ? '3px' : 0 }}>
        {label}
      </p>
      {sub && <p style={{ fontSize: '0.8125rem', color: 'var(--muted-dim)' }}>{sub}</p>}
    </div>
  );
}
