'use client';

import { type ReactNode } from 'react';
import Paginator from '@/components/user/Paginator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Radix Select forbids an item with value="" — this sentinel represents
// the "all statuses" option and is translated back to '' below.
const ALL_STATUS_VALUE = '__all__';

export interface Column<T> {
  header: string;
  cell: (row: T) => ReactNode;
  width?: string;
  align?: 'start' | 'end' | 'center';
}

interface AdminListShellProps<T> {
  eyebrow: string;
  title: string;
  subtitle?: string;

  searchPlaceholder: string;
  searchValue: string;
  onSearchChange: (value: string) => void;

  statusValue?: string;
  onStatusChange?: (value: string) => void;
  extraFilters?: ReactNode;

  addLabel?: string;
  onAdd?: () => void;

  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;

  loading: boolean;
  error: string | null;
  emptyMessage: string;
  onRetry: () => void;

  page: number;
  pageCount: number;
  total: number;
  onPageChange: (page: number) => void;
}

const th: React.CSSProperties = {
  padding: '11px 20px',
  textAlign: 'start',
  fontSize: '0.625rem',
  color: 'var(--muted)',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  fontWeight: 600,
  whiteSpace: 'nowrap',
};

const td: React.CSSProperties = {
  padding: '14px 20px',
  fontSize: '0.875rem',
  verticalAlign: 'middle',
};

export default function AdminListShell<T>({
  eyebrow,
  title,
  subtitle,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  statusValue,
  onStatusChange,
  extraFilters,
  addLabel,
  onAdd,
  columns,
  rows,
  rowKey,
  loading,
  error,
  emptyMessage,
  onRetry,
  page,
  pageCount,
  total,
  onPageChange,
}: AdminListShellProps<T>) {
  return (
    <div className="dash-page">
      {/* Header */}
      <div
        className="dash-header"
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap',
          marginBottom: '28px',
        }}
      >
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {addLabel && onAdd && (
          <button type="button" onClick={onAdd} className="btn-primary btn-sm">
            + {addLabel}
          </button>
        )}
      </div>

      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          marginBottom: '20px',
          alignItems: 'center',
        }}
      >
        <div style={{ position: 'relative', flex: '1 1 260px', minWidth: 0 }}>
          <input
            type="search"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="search-input"
            style={{ width: '100%' }}
            aria-label={searchPlaceholder}
          />
        </div>

        {onStatusChange && (
          <Select
            value={statusValue || ALL_STATUS_VALUE}
            onValueChange={(v) => onStatusChange(v === ALL_STATUS_VALUE ? '' : v)}
          >
            <SelectTrigger className="w-[160px] flex-none" aria-label="Filtrer par statut">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_STATUS_VALUE}>Tous les statuts</SelectItem>
              <SelectItem value="ACTIVE">Actif</SelectItem>
              <SelectItem value="SUSPENDED">Suspendu</SelectItem>
            </SelectContent>
          </Select>
        )}

        {extraFilters}
      </div>

      {/* Table */}
      <div
        style={{
          border: '1px solid var(--border)',
          background: 'var(--surface)',
          borderRadius: '2px',
        }}
      >
        <div className="table-responsive">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {columns.map((c) => (
                  <th
                    key={c.header}
                    style={{
                      ...th,
                      textAlign: c.align ?? 'start',
                      width: c.width,
                    }}
                  >
                    {c.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <tr
                    key={`sk-${i}`}
                    style={{ borderBottom: '1px solid var(--border)' }}
                  >
                    {columns.map((c) => (
                      <td key={c.header} style={td}>
                        <div
                          className="shimmer"
                          style={{
                            height: '14px',
                            borderRadius: '4px',
                            width: `${50 + ((i * 7 + c.header.length) % 40)}%`,
                          }}
                        />
                      </td>
                    ))}
                  </tr>
                ))}

              {!loading &&
                !error &&
                rows.map((row) => (
                  <tr
                    key={rowKey(row)}
                    className="hover-row"
                    style={{ borderBottom: '1px solid var(--border)' }}
                  >
                    {columns.map((c) => (
                      <td
                        key={c.header}
                        style={{ ...td, textAlign: c.align ?? 'start' }}
                      >
                        {c.cell(row)}
                      </td>
                    ))}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Error state */}
        {!loading && error && (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <p
              style={{
                color: '#C4623F',
                fontSize: '0.9375rem',
                marginBottom: '16px',
              }}
            >
              {error}
            </p>
            <button
              type="button"
              onClick={onRetry}
              className="btn-outline btn-sm"
            >
              <span>Réessayer</span>
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && rows.length === 0 && (
          <div style={{ padding: '56px 24px', textAlign: 'center' }}>
            <p style={{ color: 'var(--muted)', fontSize: '0.9375rem' }}>
              {emptyMessage}
            </p>
          </div>
        )}
      </div>

      {/* Footer: count + pagination */}
      {!loading && !error && total > 0 && (
        <div
          style={{
            marginTop: '16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <Paginator page={page} pageCount={pageCount} onChange={onPageChange} />
          <p style={{ fontSize: '0.75rem', color: 'var(--muted-dim)' }}>
            {total} résultat{total > 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
}
