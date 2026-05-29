'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';
import type { Role } from '@/lib/auth';

interface DashboardShellProps {
  role: Role;
  name: string;
  children: React.ReactNode;
}

export default function DashboardShell({ role, name, children }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const displayName = decodeURIComponent(name).split(' ')[0];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--background)' }}>
      <Sidebar
        role={role}
        name={name}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        {/* Mobile top bar */}
        <header
          className="lg:hidden"
          style={{
            height: '56px',
            borderBottom: '1px solid var(--border)',
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 20px',
            flexShrink: 0,
            position: 'sticky',
            top: 0,
            zIndex: 30,
          }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
            style={{
              background: 'none',
              border: '1px solid var(--border)',
              cursor: 'pointer',
              color: 'var(--foreground)',
              padding: '7px 11px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              borderRadius: '6px',
              transition: 'border-color 0.2s ease',
            }}
          >
            <span style={{ display: 'block', width: '16px', height: '1.5px', background: 'currentColor' }} />
            <span style={{ display: 'block', width: '12px', height: '1.5px', background: 'currentColor' }} />
            <span style={{ display: 'block', width: '16px', height: '1.5px', background: 'currentColor' }} />
          </button>

          <span style={{ fontFamily: 'var(--font-playfair)', fontSize: '1rem', fontWeight: 700 }}>
            Morocco<span style={{ color: 'var(--primary)' }}>360</span>
          </span>

          {/* Avatar */}
          <div style={{
            width: '32px', height: '32px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, var(--primary-dark), var(--primary))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.75rem', fontWeight: 700, color: '#FAFAF8',
            flexShrink: 0,
          }}>
            {displayName.charAt(0).toUpperCase()}
          </div>
        </header>

        <main style={{ flex: 1, overflow: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
