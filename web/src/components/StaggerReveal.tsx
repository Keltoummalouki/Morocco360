'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { gsap, ScrollTrigger, EASE, prefersReducedMotion } from '@/lib/gsap';

interface Props {
  children: ReactNode;
  /** CSS selector for items inside the wrapper to stagger */
  itemSelector?: string;
  stagger?: number;
  duration?: number;
  fromY?: number;
  fromScale?: number;
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function StaggerReveal({
  children,
  itemSelector = ':scope > *',
  stagger = 0.08,
  duration = 0.75,
  fromY = 40,
  fromScale = 1,
  delay = 0,
  className,
  style,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const items = Array.from(el.querySelectorAll(itemSelector)) as HTMLElement[];
    if (!items.length) return;

    if (prefersReducedMotion()) {
      gsap.set(items, { opacity: 1, y: 0, scale: 1 });
      return;
    }

    gsap.set(items, { opacity: 0, y: fromY, scale: fromScale });

    const trigger = ScrollTrigger.create({
      trigger: el,
      start: 'top 86%',
      onEnter: () => {
        gsap.to(items, {
          opacity: 1,
          y: 0,
          scale: 1,
          stagger,
          duration,
          ease: EASE.expo,
          delay,
        });
      },
      once: true,
    });

    return () => trigger.kill();
  }, [itemSelector, stagger, duration, fromY, fromScale, delay]);

  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  );
}
