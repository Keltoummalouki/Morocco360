'use client';

import { useState, useRef, useEffect } from 'react';

const CATEGORIES = ['All', 'Medinas', 'Desert', 'Coasts', 'Mountains', 'Cities'];

const SUGGESTIONS = [
  'Marrakech medina at sunset',
  'Sahara desert panorama',
  'Chefchaouen blue streets',
  'Fez ancient tanneries',
  'Atlas Mountains peaks',
  'Essaouira coastal breeze',
  'Ouarzazate kasbahs',
];

export default function PremiumSearch() {
  const [focused, setFocused] = useState(false);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const filtered = query.length > 0
    ? SUGGESTIONS.filter((s) => s.toLowerCase().includes(query.toLowerCase()))
    : SUGGESTIONS.slice(0, 4);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        inputRef.current?.blur();
        setFocused(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  return (
    <div ref={wrapRef} className="search-wrap" style={{ maxWidth: '600px', margin: '0 auto', position: 'relative' }}>
      {/* Backdrop blur when focused */}
      {focused && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.15)',
            backdropFilter: 'blur(4px)',
            zIndex: 40,
          }}
          onClick={() => setFocused(false)}
          aria-hidden="true"
        />
      )}

      <div style={{ position: 'relative', zIndex: focused ? 41 : 'auto' }}>
        {/* Search icon */}
        <svg
          style={{
            position: 'absolute',
            left: '16px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '16px',
            height: '16px',
            color: focused ? 'var(--primary)' : 'var(--muted)',
            transition: 'color 0.25s ease',
            pointerEvents: 'none',
          }}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          viewBox="0 0 24 24"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>

        <input
          ref={inputRef}
          type="text"
          className="search-input"
          placeholder="Search destinations, experiences… ⌘K"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          aria-label="Search panoramic experiences"
          aria-expanded={focused}
          role="combobox"
          aria-autocomplete="list"
          aria-controls="search-listbox"
        />

        {/* Keyboard shortcut badge */}
        {!focused && (
          <kbd style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '4px',
            padding: '2px 6px',
            fontSize: '0.625rem',
            letterSpacing: '0.05em',
            color: 'var(--muted)',
            fontFamily: 'var(--font-inter), system-ui',
            pointerEvents: 'none',
          }}>
            ⌘K
          </kbd>
        )}

        {/* Suggestions dropdown */}
        {focused && (
          <div
            id="search-listbox"
            role="listbox"
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              left: 0,
              right: 0,
              background: 'var(--background)',
              border: '1.5px solid var(--primary-glow-soft)',
              boxShadow: '0 24px 60px -8px var(--shadow-deep), 0 0 0 1px var(--primary-glow-soft)',
              zIndex: 42,
              padding: '8px',
              animation: 'fadeUp 0.2s cubic-bezier(0.16,1,0.3,1) forwards',
            }}
          >
            {/* Category pills */}
            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', padding: '4px 4px 10px', borderBottom: '1px solid var(--border)', scrollbarWidth: 'none' }}>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  className={`cat-pill${activeCategory === cat ? ' active' : ''}`}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Results */}
            <div style={{ paddingTop: '8px' }}>
              {filtered.length === 0 ? (
                <p style={{ padding: '12px 12px', fontSize: '0.875rem', color: 'var(--muted)' }}>
                  No results found
                </p>
              ) : (
                filtered.map((suggestion) => (
                  <button
                    key={suggestion}
                    role="option"
                    aria-selected="false"
                    onClick={() => { setQuery(suggestion); setFocused(false); }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '10px 12px',
                      fontSize: '0.875rem',
                      color: 'var(--foreground)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      borderRadius: '2px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      transition: 'background 0.15s ease',
                      fontFamily: 'var(--font-inter), system-ui',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--surface)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'none'; }}
                  >
                    <svg width="14" height="14" fill="none" stroke="var(--muted)" strokeWidth="1.5" viewBox="0 0 24 24" aria-hidden="true">
                      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                    </svg>
                    {suggestion}
                  </button>
                ))
              )}
            </div>

            <div style={{ borderTop: '1px solid var(--border)', padding: '8px 12px 4px', display: 'flex', gap: '12px' }}>
              <span style={{ fontSize: '0.625rem', color: 'var(--muted)', letterSpacing: '0.06em' }}>↑↓ navigate</span>
              <span style={{ fontSize: '0.625rem', color: 'var(--muted)', letterSpacing: '0.06em' }}>↵ select</span>
              <span style={{ fontSize: '0.625rem', color: 'var(--muted)', letterSpacing: '0.06em' }}>ESC close</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
