import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { cartApi } from '../api/cart';
import { type CartItem } from '../types/cart';
import { type Product } from '../types/product';

type Cart = { items: CartItem[] };

const calculateSubtotal = (items: CartItem[]) => items.reduce((sum, i) => sum + i.price * i.quantity, 0);
const calculateCount = (items: CartItem[]) => items.reduce((sum, i) => sum + i.quantity, 0);

export function useCart() {
  const queryClient = useQueryClient();

  const cartQuery = useQuery({
    queryKey: ['cart'],
    queryFn: () => cartApi.getCart(),
    staleTime: 3000,
  });

  const updateQuantity = useMutation({
    mutationFn: (input: { cartItemId: number; quantity: number }) =>
      cartApi.updateItemQuantity({ cartItemId: input.cartItemId, quantity: input.quantity }),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ['cart'] });
      const previous = queryClient.getQueryData<Cart>(['cart']);

      queryClient.setQueryData<Cart>(['cart'], (current) => {
        const base = current?.items ?? [];
        const nextItems = base.map((it) => {
          if (it.cartItemId !== input.cartItemId) return it;
          return { ...it, quantity: input.quantity };
        });
        return { items: nextItems };
      });

      return { previous };
    },
    onError: (err, _input, context) => {
      if (context?.previous) queryClient.setQueryData(['cart'], context.previous);
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['cart'], data);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  const removeItem = useMutation({
    mutationFn: (input: { cartItemId: number }) => cartApi.removeItem({ cartItemId: Number(input.cartItemId) }),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ['cart'] });
      const previous = queryClient.getQueryData<Cart>(['cart']);

      queryClient.setQueryData<Cart>(['cart'], (current) => {
        const base = current?.items ?? [];
        const nextItems = base.filter((it) => it.cartItemId !== input.cartItemId);
        return { items: nextItems };
      });

      return { previous };
    },
    onError: (err, _input, context) => {
      if (context?.previous) queryClient.setQueryData(['cart'], context.previous);
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['cart'], data);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  const addProduct = useMutation({
    mutationFn: (input: { product: Product; quantity?: number }) =>
      cartApi.addItem({ product: input.product, quantity: input.quantity }),
    onSuccess: (data) => {
      queryClient.setQueryData(['cart'], data);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  const items = useMemo(() => {
    const raw = cartQuery.data?.items ?? [];
    return raw.filter(it => it.quantity > 0 && it.cartItemId);
  }, [cartQuery.data?.items]);

  const subtotal = useMemo(() => calculateSubtotal(items), [items]);
  const count = useMemo(() => calculateCount(items), [items]);

  return {
    items,
    subtotal,
    count,
    isLoading: cartQuery.isLoading,
    isError: cartQuery.isError,
    error: cartQuery.error,
    refetch: cartQuery.refetch,
    updateQuantity: updateQuantity.mutateAsync,
    removeItem: removeItem.mutateAsync,
    addProduct: addProduct.mutateAsync,
    isUpdating: updateQuantity.isPending || removeItem.isPending || addProduct.isPending,
  };
}
