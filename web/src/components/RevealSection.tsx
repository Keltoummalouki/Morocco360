'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { gsap, ScrollTrigger, EASE, prefersReducedMotion } from '@/lib/gsap';

interface RevealSectionProps {
  children: ReactNode;
  /** Animation variant */
  variant?: 'fadeUp' | 'fadeIn' | 'scaleUp' | 'blurUp';
  delay?: number;
}

export default function RevealSection({
  children,
  variant = 'fadeUp',
  delay = 0,
}: RevealSectionProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (prefersReducedMotion()) {
      gsap.set(el, { opacity: 1, y: 0, scale: 1, filter: 'none' });
      return;
    }

    // Initial hidden state per variant
    const from: gsap.TweenVars = { opacity: 0 };
    const to:   gsap.TweenVars = { opacity: 1, duration: 0.9, ease: EASE.expo };

    if (variant === 'fadeUp') {
      from.y = 48;
      to.y   = 0;
    } else if (variant === 'scaleUp') {
      from.scale = 0.94;
      from.y     = 32;
      to.scale   = 1;
      to.y       = 0;
    } else if (variant === 'blurUp') {
      from.y      = 36;
      from.filter = 'blur(12px)';
      to.y        = 0;
      to.filter   = 'blur(0px)';
    }

    gsap.set(el, from);

    const trigger = ScrollTrigger.create({
      trigger: el,
      start: 'top 88%',
      onEnter: () => {
        gsap.to(el, { ...to, delay });
      },
      once: true,
    });

    return () => trigger.kill();
  }, [variant, delay]);

  return (
    <div ref={ref} style={{ willChange: 'transform, opacity' }}>
      {children}
    </div>
  );
}
