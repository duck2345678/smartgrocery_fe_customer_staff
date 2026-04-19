import { useMutation, useQueryClient } from '@tanstack/react-query';
import { orderApi } from '../api/orders';

export function useCheckout() {
  const queryClient = useQueryClient();

  const createOrder = useMutation({
    mutationFn: (input: {
      addressId: number;
      paymentMethod: 'COD' | 'VNPAY';
      note?: string;
      items: Array<{ variantId: number; quantity: number; allowSubstitution: boolean }>;
    }) => orderApi.createOrderFromCart(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  return {
    createOrder: createOrder.mutateAsync,
    isPlacingOrder: createOrder.isPending,
    error: createOrder.error,
  };
}
