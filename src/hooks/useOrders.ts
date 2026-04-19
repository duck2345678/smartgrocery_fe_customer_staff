import { useQuery } from '@tanstack/react-query';
import { orderApi } from '../api/orders';

export function useOrders() {
  const ordersQuery = useQuery({
    queryKey: ['orders'],
    queryFn: () => orderApi.getOrders(),
    staleTime: 2 * 60 * 1000,
  });

  return {
    orders: ordersQuery.data ?? [],
    isLoading: ordersQuery.isLoading,
    isError: ordersQuery.isError,
    error: ordersQuery.error,
    refetch: ordersQuery.refetch,
  };
}

