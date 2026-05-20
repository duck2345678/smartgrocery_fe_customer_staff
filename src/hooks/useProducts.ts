import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { productApi, type Category } from '../api/products';
import type { Product } from '../types/product';

export function useProducts() {
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [search, setSearch] = useState('');

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: () => productApi.getCategories(),
    staleTime: 10 * 60 * 1000, // 10 minutes — categories rarely change
  });

  const productsQuery = useQuery({
    queryKey: ['products', { categoryId, search: search.trim() || undefined }],
    queryFn: () =>
      productApi.getProducts({
        categoryId,
        search: search.trim() || undefined,
      }),
    staleTime: 5 * 60 * 1000,
  });

  const categories: Category[] = useMemo(
    () => categoriesQuery.data ?? [],
    [categoriesQuery.data]
  );

  const products: Product[] = useMemo(
    () => productsQuery.data ?? [],
    [productsQuery.data]
  );

  const selectCategory = useCallback((id: number | undefined) => {
    setCategoryId(id);
  }, []);

  const setSearchQuery = useCallback((q: string) => {
    setSearch(q);
  }, []);

  return {
    products,
    categories,
    categoryId,
    search,
    selectCategory,
    setSearchQuery,
    isLoading: productsQuery.isLoading,
    isError: productsQuery.isError,
    error: productsQuery.error,
    refetch: productsQuery.refetch,
    isCategoriesLoading: categoriesQuery.isLoading,
  };
}
