import { useState, useEffect, useCallback } from 'react';
import type { EntryWithItems } from '../models/types';
import { getEntryById, updateEntryItemReturned } from '../services/database';

export function useEntryDetail(entryId: number | null) {
  const [entry, setEntry] = useState<EntryWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    if (entryId == null) {
      setEntry(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getEntryById(entryId);
      setEntry(data);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setLoading(false);
    }
  }, [entryId]);

  useEffect(() => {
    load();
  }, [load]);

  const markReturned = useCallback(async (itemId: number, quantityReturned: number) => {
    await updateEntryItemReturned(itemId, quantityReturned);
    await load();
  }, [load]);

  return { entry, loading, error, reload: load, markReturned };
}
