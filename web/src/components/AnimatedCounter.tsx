'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap, ScrollTrigger, prefersReducedMotion } from '@/lib/gsap';

interface Props {
  /** Target number */
  to: number;
  /** Optional prefix (e.g. '$') */
  prefix?: string;
  /** Optional suffix (e.g. 'K+', '%') */
  suffix?: string;
  /** Animation duration in seconds */
  duration?: number;
  /** Decimal places */
  decimals?: number;
  /** CSS class for the number element */
  className?: string;
  style?: React.CSSProperties;
}

export default function AnimatedCounter({
  to,
  prefix = '',
  suffix = '',
  duration = 1.4,
  decimals = 0,
  className = '',
  style,
}: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(`${prefix}0${suffix}`);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;

    const obj = { val: 0 };
    let tween: gsap.core.Tween | null = null;

    const trigger = ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      onEnter: () => {
        tween = gsap.to(obj, {
          val: to,
          duration,
          ease: 'power2.out',
          onUpdate: () => {
            setDisplay(`${prefix}${obj.val.toFixed(decimals)}${suffix}`);
          },
        });
      },
      once: true,
    });

    return () => {
      trigger.kill();
      tween?.kill();
    };
  }, [to, prefix, suffix, duration, decimals]);

  const renderedDisplay = prefersReducedMotion()
    ? `${prefix}${to.toFixed(decimals)}${suffix}`
    : display;

  return (
    <span ref={ref} className={className} style={style}>
      {renderedDisplay}
    </span>
  );
}
