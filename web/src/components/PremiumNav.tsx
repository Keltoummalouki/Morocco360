'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import ThemeToggle from './ThemeToggle';
import { gsap, EASE, prefersReducedMotion } from '@/lib/gsap';

const NAV_LINKS = ['Experiences', 'Destinations', 'Gallery', 'About'];

/* ── Magnetic CTA wrapper ─────────────────────────────── */
function MagneticCTA({ children, href }: { children: React.ReactNode; href: string }) {
  const ref = useRef<HTMLAnchorElement>(null);

  const onMove = (e: React.MouseEvent) => {
    if (prefersReducedMotion() || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const dx = (e.clientX - (rect.left + rect.width  / 2)) * 0.35;
    const dy = (e.clientY - (rect.top  + rect.height / 2)) * 0.35;
    gsap.to(ref.current, { x: dx, y: dy, duration: 0.4, ease: EASE.out });
  };

  const onLeave = () => {
    if (!ref.current) return;
    gsap.to(ref.current, { x: 0, y: 0, duration: 0.6, ease: EASE.expo });
  };

  return (
    <Link
      ref={ref}
      href={href}
      className="btn-magnetic"
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ display: 'inline-block' }}
    >
      <span>{children}</span>
    </Link>
  );
}

export default function PremiumNav() {
  const [menuOpen, setMenuOpen]   = useState(false);
  const navRef   = useRef<HTMLElement>(null);
  const menuRef  = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLSpanElement>(null);

  /* ── Entrance animation ─────────────────────────────── */
  useEffect(() => {
    const nav = navRef.current;
    if (!nav || prefersReducedMotion()) return;
    gsap.fromTo(nav,
      { y: -60, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: EASE.expo, delay: 0.1 }
    );
  }, []);

  /* ── Scroll glass blur transition ──────────────────── */
  useEffect(() => {
    const nav = navRef.current;
    if (!nav || prefersReducedMotion()) return;

    const onScroll = () => {
      const past = window.scrollY > 20;
      gsap.to(nav, {
        boxShadow: past
          ? '0 8px 48px -8px rgba(0,0,0,0.35)'
          : '0 0px 0px rgba(0,0,0,0)',
        backdropFilter: past ? 'blur(28px) saturate(1.6)' : 'blur(16px) saturate(1.2)',
        duration: 0.5,
        ease: EASE.out,
        overwrite: 'auto',
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* ── Mobile menu GSAP animation ─────────────────────── */
  useEffect(() => {
    const menu = menuRef.current;
    if (!menu || prefersReducedMotion()) return;

    if (menuOpen) {
      gsap.fromTo(menu,
        { y: -12, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.35, ease: EASE.out }
      );
      const items = menu.querySelectorAll('[data-menu-item]');
      gsap.fromTo(items,
        { x: -16, opacity: 0 },
        { x: 0, opacity: 1, stagger: 0.05, duration: 0.3, ease: EASE.out, delay: 0.05 }
      );
    }
  }, [menuOpen]);

  /* ── Nav link hover active indicator ───────────────── */
  const onLinkEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (prefersReducedMotion() || !activeLineRef.current) return;
    const link = e.currentTarget;
    const rect  = link.getBoundingClientRect();
    const navRect = navRef.current?.getBoundingClientRect();
    if (!navRect) return;
    gsap.to(activeLineRef.current, {
      x: rect.left - navRect.left,
      width: rect.width,
      opacity: 1,
      duration: 0.3,
      ease: EASE.out,
    });
  };
  const onLinkLeave = () => {
    if (!activeLineRef.current) return;
    gsap.to(activeLineRef.current, { opacity: 0, duration: 0.2 });
  };

  return (
    <>
      <nav
        ref={navRef}
        className="nav-glass fixed top-0 left-0 right-0 z-50"
        style={{ opacity: 0 }}
        aria-label="Main navigation"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex items-center justify-between h-16 relative">
          <Link href="/" className="font-playfair text-xl font-bold shrink-0 flex items-center gap-0.5">
            Morocco<span style={{ color: 'var(--primary)' }}>360</span>
          </Link>

          {/* Desktop links + floating active indicator */}
          <div className="hidden md:flex items-center gap-10 relative">
            <span
              ref={activeLineRef}
              aria-hidden="true"
              style={{
                position: 'absolute',
                bottom: '-2px',
                left: 0,
                height: '1.5px',
                width: 0,
                background: 'var(--primary)',
                borderRadius: '2px',
                opacity: 0,
                pointerEvents: 'none',
              }}
            />
            {NAV_LINKS.map((item) => (
              <Link
                key={item}
                href="#"
                className="nav-link-premium"
                onMouseEnter={onLinkEnter}
                onMouseLeave={onLinkLeave}
              >
                {item}
              </Link>
            ))}
          </div>

          {/* Desktop right */}
          <div className="hidden md:flex items-center gap-4">
            <ThemeToggle />
            <Link href="/login" className="nav-link-premium" onMouseEnter={onLinkEnter} onMouseLeave={onLinkLeave}>
              Sign in
            </Link>
            <MagneticCTA href="/register">Get Started</MagneticCTA>
          </div>

          {/* Mobile right */}
          <div className="flex md:hidden items-center gap-3">
            <ThemeToggle />
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              style={{
                background: 'none',
                border: '1.5px solid var(--border)',
                cursor: 'pointer',
                color: 'var(--foreground)',
                padding: '6px 10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                borderRadius: '2px',
              }}
            >
              <span style={{ display: 'block', width: '18px', height: '1.5px', background: 'currentColor', transition: 'transform 0.25s ease, opacity 0.25s ease', transform: menuOpen ? 'rotate(45deg) translateY(5.5px)' : 'none' }} />
              <span style={{ display: 'block', width: '14px', height: '1.5px', background: 'currentColor', opacity: menuOpen ? 0 : 1, transition: 'opacity 0.25s ease' }} />
              <span style={{ display: 'block', width: '18px', height: '1.5px', background: 'currentColor', transition: 'transform 0.25s ease', transform: menuOpen ? 'rotate(-45deg) translateY(-5.5px)' : 'none' }} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile dropdown */}
      {menuOpen && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, top: '64px', zIndex: 48, background: 'transparent' }}
            onClick={() => setMenuOpen(false)}
          />
          <div ref={menuRef} className="mobile-menu" style={{ zIndex: 49, opacity: 0 }}>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '16px' }}>
              {NAV_LINKS.map((item) => (
                <Link
                  key={item}
                  href="#"
                  data-menu-item
                  onClick={() => setMenuOpen(false)}
                  style={{ padding: '10px 0', fontSize: '0.9375rem', color: 'var(--foreground)', borderBottom: '1px solid var(--border)', fontWeight: 400 }}
                >
                  {item}
                </Link>
              ))}
            </nav>
            <div data-menu-item style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Link href="/login" onClick={() => setMenuOpen(false)} className="btn-premium-outline" style={{ textAlign: 'center' }}>
                <span>Sign in</span>
              </Link>
              <Link href="/register" onClick={() => setMenuOpen(false)} className="btn-premium" style={{ textAlign: 'center' }}>
                Get Started
              </Link>
            </div>
          </div>
        </>
      )}
    </>
  );
}
