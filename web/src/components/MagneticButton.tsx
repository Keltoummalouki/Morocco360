'use client';

import { useRef, type ReactNode, type CSSProperties } from 'react';
import { gsap, EASE, prefersReducedMotion } from '@/lib/gsap';

interface Props {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  strength?: number;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
}

export default function MagneticButton({
  children,
  className = 'btn-primary',
  style,
  strength = 0.4,
  onClick,
  type = 'button',
  disabled,
}: Props) {
  const btnRef = useRef<HTMLButtonElement>(null);

  const onMove = (e: React.MouseEvent) => {
    if (prefersReducedMotion() || !btnRef.current || disabled) return;
    const rect = btnRef.current.getBoundingClientRect();
    const dx = (e.clientX - (rect.left + rect.width  / 2)) * strength;
    const dy = (e.clientY - (rect.top  + rect.height / 2)) * strength;
    gsap.to(btnRef.current, { x: dx, y: dy, duration: 0.35, ease: EASE.out });
  };

  const onLeave = () => {
    if (!btnRef.current) return;
    gsap.to(btnRef.current, { x: 0, y: 0, duration: 0.6, ease: EASE.expo });
  };

  const onPress = () => {
    if (prefersReducedMotion() || !btnRef.current) return;
    gsap.to(btnRef.current, { scale: 0.96, duration: 0.12, ease: 'power2.in',
      onComplete: () => gsap.to(btnRef.current, { scale: 1, duration: 0.4, ease: EASE.expo }),
    });
  };

  return (
    <button
      ref={btnRef}
      type={type}
      className={className}
      style={{ display: 'inline-block', willChange: 'transform', ...style }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onMouseDown={onPress}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
