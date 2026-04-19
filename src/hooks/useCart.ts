import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cartApi } from '../api/cart';
import { type CartItem } from '../types/cart';
import { type Product } from '../types/product';

type Cart = { items: CartItem[] };

const getSubtotal = (items: CartItem[]) => items.reduce((sum, i) => sum + i.price * i.quantity, 0);

export function useCart() {
  const queryClient = useQueryClient();

  const cartQuery = useQuery({
    queryKey: ['cart'],
    queryFn: () => cartApi.getCart(),
  });

  const updateQuantity = useMutation({
    mutationFn: (input: { cartItemId?: number; productId: number; quantity: number }) => {
      if (typeof input.cartItemId === 'number') {
        return cartApi.updateItemQuantity({ cartItemId: input.cartItemId, quantity: input.quantity });
      }
      return cartApi.updateItemQuantity({ productId: input.productId, quantity: input.quantity });
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ['cart'] });
      const previous = queryClient.getQueryData<Cart>(['cart']);

      queryClient.setQueryData<Cart>(['cart'], (current) => {
        const base = current?.items ?? [];
        const nextItems = base
          .map((it) => {
            const match = typeof input.cartItemId === 'number' ? it.cartItemId === input.cartItemId : it.productId === input.productId;
            if (!match) return it;
            const nextQty = Math.max(0, Math.min(input.quantity, Math.max(0, it.stock)));
            return { ...it, quantity: nextQty };
          })
          .filter((it) => it.quantity > 0);
        return { items: nextItems };
      });

      return { previous };
    },
    onError: (err, _input, context) => {
      if (context?.previous) queryClient.setQueryData(['cart'], context.previous);
      throw err;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['cart'], data);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  const removeItem = useMutation({
    mutationFn: (input: { cartItemId?: number; productId: number }) => {
      if (typeof input.cartItemId === 'number') return cartApi.removeItem({ cartItemId: input.cartItemId });
      return cartApi.removeItem({ productId: input.productId });
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ['cart'] });
      const previous = queryClient.getQueryData<Cart>(['cart']);

      queryClient.setQueryData<Cart>(['cart'], (current) => {
        const base = current?.items ?? [];
        const nextItems = base.filter((it) => {
          const match = typeof input.cartItemId === 'number' ? it.cartItemId === input.cartItemId : it.productId === input.productId;
          return !match;
        });
        return { items: nextItems };
      });

      return { previous };
    },
    onError: (err, _input, context) => {
      if (context?.previous) queryClient.setQueryData(['cart'], context.previous);
      throw err;
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
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ['cart'] });
      const previous = queryClient.getQueryData<Cart>(['cart']);

      const q = Math.max(1, Math.floor(input.quantity ?? 1));

      queryClient.setQueryData<Cart>(['cart'], (current) => {
        const base = current?.items ?? [];
        const existing = base.find((it) => it.productId === input.product.id);
        if (!existing) {
          const nextItem: CartItem = {
            productId: input.product.id,
            variantId: input.product.id,
            name: input.product.name,
            price: input.product.price,
            unit: input.product.unit,
            imageUrl: input.product.imageUrl,
            stock: input.product.stock,
            quantity: Math.min(q, Math.max(0, input.product.stock)),
          };
          return { items: [...base, nextItem].filter((it) => it.quantity > 0) };
        }

        const nextItems = base.map((it) => {
          if (it.productId !== input.product.id) return it;
          const nextQty = Math.min(it.quantity + q, Math.max(0, input.product.stock));
          return { ...it, quantity: nextQty, stock: input.product.stock };
        });

        return { items: nextItems.filter((it) => it.quantity > 0) };
      });

      return { previous };
    },
    onError: (err, _input, context) => {
      if (context?.previous) queryClient.setQueryData(['cart'], context.previous);
      throw err;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['cart'], data);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  const items = cartQuery.data?.items ?? [];

  return {
    items,
    subtotal: getSubtotal(items),
    count: items.reduce((sum, i) => sum + i.quantity, 0),
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
