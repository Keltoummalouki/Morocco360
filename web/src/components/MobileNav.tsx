'use client';

import { useState } from 'react';
import Link from 'next/link';

const NAV_LINKS = ["Experiences", "Destinations", "Gallery", "About"];

export default function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Hamburger button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
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
          transition: 'border-color 0.2s ease',
        }}
      >
        <span style={{ display: 'block', width: '18px', height: '1.5px', background: 'currentColor', transition: 'transform 0.2s ease, opacity 0.2s ease', transform: open ? 'rotate(45deg) translateY(5.5px)' : 'none' }} />
        <span style={{ display: 'block', width: '14px', height: '1.5px', background: 'currentColor', opacity: open ? 0 : 1, transition: 'opacity 0.2s ease' }} />
        <span style={{ display: 'block', width: '18px', height: '1.5px', background: 'currentColor', transition: 'transform 0.2s ease', transform: open ? 'rotate(-45deg) translateY(-5.5px)' : 'none' }} />
      </button>

      {/* Mobile dropdown menu */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            style={{
              position: 'fixed',
              inset: 0,
              top: '64px',
              zIndex: 48,
              background: 'transparent',
            }}
            onClick={() => setOpen(false)}
          />
          <div className="mobile-menu">
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '16px' }}>
              {NAV_LINKS.map((item) => (
                <Link
                  key={item}
                  href="#"
                  onClick={() => setOpen(false)}
                  style={{
                    padding: '10px 0',
                    fontSize: '0.9375rem',
                    color: 'var(--foreground)',
                    borderBottom: '1px solid var(--border)',
                    fontWeight: 400,
                  }}
                >
                  {item}
                </Link>
              ))}
            </nav>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="btn-outline"
                style={{ textAlign: 'center', padding: '11px 24px' }}
              >
                Sign in
              </Link>
              <Link
                href="/register"
                onClick={() => setOpen(false)}
                className="btn-primary"
                style={{ textAlign: 'center' }}
              >
                Get Started
              </Link>
            </div>
          </div>
        </>
      )}
    </>
  );
}
