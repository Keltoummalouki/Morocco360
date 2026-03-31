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
            background: 'var(--background)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 16px',
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
            <span style={{ display: 'block', width: '18px', height: '1.5px', background: 'currentColor' }} />
            <span style={{ display: 'block', width: '14px', height: '1.5px', background: 'currentColor' }} />
            <span style={{ display: 'block', width: '18px', height: '1.5px', background: 'currentColor' }} />
          </button>

          <span style={{ fontFamily: 'var(--font-playfair)', fontSize: '1rem', fontWeight: 700 }}>
            Morocco<span style={{ color: 'var(--primary)' }}>360</span>
          </span>

          {/* Spacer to centre logo */}
          <div style={{ width: '38px' }} />
        </header>

        <main style={{ flex: 1, overflow: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
