'use client';

import { useEffect, useRef, useState } from 'react';
import { searchUsers, type UserSearchResult } from '@/lib/admin/events';

/**
 * Debounced searchable picker for assigning a user by role. Calls the
 * /admin/users/search endpoint and calls onSelect with the chosen user.
 */
export default function UserPicker({
  role,
  onSelect,
  placeholder,
}: {
  role: 'ORGANIZER' | 'STAFF';
  onSelect: (user: UserSearchResult) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true);
      searchUsers(role, query)
        .then((r) => setResults(r))
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [query, role]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div ref={boxRef} style={{ position: 'relative' }}>
      <input
        type="search"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder ?? 'Rechercher…'}
        className="search-input"
        style={{ width: '100%' }}
      />
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            insetInlineStart: 0,
            insetInlineEnd: 0,
            background: 'var(--background)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            boxShadow: '0 12px 32px -8px var(--shadow)',
            zIndex: 20,
            maxHeight: '240px',
            overflowY: 'auto',
          }}
        >
          {loading && (
            <p style={{ padding: '12px', fontSize: '0.8125rem', color: 'var(--muted)' }}>
              Recherche…
            </p>
          )}
          {!loading && results.length === 0 && (
            <p style={{ padding: '12px', fontSize: '0.8125rem', color: 'var(--muted)' }}>
              Aucun résultat.
            </p>
          )}
          {!loading &&
            results.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => {
                  onSelect(u);
                  setQuery('');
                  setOpen(false);
                }}
                className="hover-row"
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'start',
                  padding: '10px 12px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--foreground)',
                }}
              >
                <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                  {u.full_name || u.username}
                </span>
                <span
                  style={{
                    display: 'block',
                    fontSize: '0.75rem',
                    color: 'var(--muted)',
                  }}
                >
                  {u.email}
                </span>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
