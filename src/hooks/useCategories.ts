import { useState, useEffect, useCallback } from 'react';
import type { Category } from '../models/types';
import { getCategories as fetchCategories, updateCategoryPrice, insertCategory, deleteCategory } from '../services/database';

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchCategories();
      setCategories(list);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updatePrice = useCallback(async (id: number, price: number) => {
    await updateCategoryPrice(id, price);
    await load();
  }, [load]);

  const addCategory = useCallback(async (name: string, price: number) => {
    await insertCategory(name, price, 1);
    await load();
  }, [load]);

  const removeCategory = useCallback(async (id: number) => {
    await deleteCategory(id);
    await load();
  }, [load]);

  return { categories, loading, error, reload: load, updatePrice, addCategory, removeCategory };
}
