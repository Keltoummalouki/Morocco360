'use client';

import { useEffect, useRef } from 'react';

export default function CursorGlow() {
  const glowRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: 0, y: 0 });
  const curr = useRef({ x: 0, y: 0 });
  const raf = useRef<number>(0);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY };
    };

    const animate = () => {
      curr.current.x += (pos.current.x - curr.current.x) * 0.08;
      curr.current.y += (pos.current.y - curr.current.y) * 0.08;
      if (glowRef.current) {
        glowRef.current.style.left = `${curr.current.x}px`;
        glowRef.current.style.top = `${curr.current.y}px`;
      }
      raf.current = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    raf.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(raf.current);
    };
  }, []);

  return (
    <div
      ref={glowRef}
      className="cursor-glow"
      style={{ left: '-200px', top: '-200px', position: 'fixed' }}
      aria-hidden="true"
    />
  );
}
