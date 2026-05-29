'use client';

import { useRef, type ReactNode } from 'react';
import { gsap, EASE, prefersReducedMotion } from '@/lib/gsap';

interface Props {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export default function SpotlightCard({ children, className = '', style }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const spotRef = useRef<HTMLDivElement>(null);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect || !spotRef.current) return;
    const x = ((e.clientX - rect.left) / rect.width)  * 100;
    const y = ((e.clientY - rect.top)  / rect.height) * 100;
    spotRef.current.style.setProperty('--mx', `${x}%`);
    spotRef.current.style.setProperty('--my', `${y}%`);
  };

  const onEnter = () => {
    if (prefersReducedMotion() || !cardRef.current) return;
    gsap.to(cardRef.current, { y: -6, duration: 0.4, ease: EASE.out });
    gsap.to(spotRef.current, { opacity: 1, duration: 0.3 });
  };

  const onLeave = () => {
    if (!cardRef.current) return;
    gsap.to(cardRef.current, { y: 0, duration: 0.6, ease: EASE.expo });
    gsap.to(spotRef.current, { opacity: 0, duration: 0.3 });
  };

  return (
    <div
      ref={cardRef}
      className={`feature-card ${className}`}
      style={{ ...style, willChange: 'transform' }}
      onMouseMove={onMove}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      <div
        ref={spotRef}
        className="spotlight"
        aria-hidden="true"
        style={{ opacity: 0 }}
      />
      {children}
    </div>
  );
}
