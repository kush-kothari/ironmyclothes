import { useState, useEffect, useCallback } from 'react';
import type { EntryListItem, DashboardStats } from '../models/types';
import { getEntries, getDashboardStats } from '../services/database';

export function useEntries() {
  const [entries, setEntries] = useState<EntryListItem[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    console.log('[useEntries] load() start');
    try {
      const [list, dashboardStats] = await Promise.all([getEntries(), getDashboardStats()]);
      console.log('[useEntries] getEntries/getDashboardStats done, entries:', list?.length, 'stats:', !!dashboardStats);
      setEntries(list);
      setStats(dashboardStats);
    } catch (e) {
      console.error('[useEntries] load() failed:', e);
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setLoading(false);
      console.log('[useEntries] load() end');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { entries, stats, loading, error, reload: load };
}
