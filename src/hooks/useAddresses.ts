import { useQuery } from '@tanstack/react-query';
import { userApi } from '../api/users';

export function useAddresses(userId: number | undefined) {
  const addressesQuery = useQuery({
    queryKey: ['addresses', userId],
    queryFn: () => userApi.getUserAddresses(userId as number),
    enabled: typeof userId === 'number' && userId > 0,
    staleTime: 2 * 60 * 1000,
  });

  return {
    addresses: addressesQuery.data ?? [],
    isLoading: addressesQuery.isLoading,
    isError: addressesQuery.isError,
    error: addressesQuery.error,
    refetch: addressesQuery.refetch,
  };
}

