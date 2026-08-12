'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Paginated, PageMeta, SettingStatus } from './settings';

export interface AdminListQuery {
  page: number;
  search: string;
  status: SettingStatus | '';
}

/**
 * Owns the query state (page, debounced search, status filter) and the
 * loading/error/data lifecycle for an admin list page. The `fetcher` is held
 * in a ref so passing an inline function does not retrigger the effect.
 */
export function useAdminList<T>(
  fetcher: (q: AdminListQuery) => Promise<Paginated<T>>,
  /**
   * Extra values that should also trigger a reload when they change (e.g. a
   * country filter that lives in the page, not in this hook). Keep the array
   * length constant across renders.
   */
  extraDeps: unknown[] = [],
) {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<SettingStatus | ''>('');

  const [data, setData] = useState<T[]>([]);
  const [meta, setMeta] = useState<PageMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const reqId = useRef(0);

  // Debounce the search box; reset to page 1 whenever the term settles.
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const load = useCallback(async () => {
    const id = ++reqId.current;
    setLoading(true);
    setError(null);
    try {
      const res = await fetcherRef.current({ page, search, status });
      if (id !== reqId.current) return; // a newer request superseded this one
      setData(res.data);
      setMeta(res.meta);
    } catch (e) {
      if (id !== reqId.current) return;
      setError(e instanceof Error ? e.message : 'Erreur de chargement');
    } finally {
      if (id === reqId.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, status, ...extraDeps]);

  useEffect(() => {
    void load();
  }, [load]);

  const onStatus = useCallback((next: SettingStatus | '') => {
    setStatus(next);
    setPage(1);
  }, []);

  return {
    page,
    setPage,
    searchInput,
    setSearchInput,
    status,
    onStatus,
    data,
    meta,
    loading,
    error,
    reload: load,
  };
}
