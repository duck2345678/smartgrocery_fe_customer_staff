import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Product } from '../types/product';
import { CartItem } from '../types/cart';

type CartState = {
  items: CartItem[];
  addProduct: (product: Product, quantity?: number) => void;
  setQuantity: (productId: number, quantity: number) => void;
  increment: (productId: number) => void;
  decrement: (productId: number) => void;
  remove: (productId: number) => void;
  clear: () => void;
  getCount: () => number;
  getSubtotal: () => number;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addProduct: (product, quantity = 1) => {
        const q = Math.max(1, Math.floor(quantity));
        set((state) => {
          const existing = state.items.find((i) => i.productId === product.id);
          if (!existing) {
            return {
              items: [
                ...state.items,
                {
                  productId: product.id,
                  name: product.name,
                  price: product.price,
                  unit: product.unit,
                  imageUrl: product.imageUrl,
                  stock: product.stock,
                  quantity: Math.min(q, Math.max(0, product.stock)),
                },
              ].filter((i) => i.quantity > 0),
            };
          }

          return {
            items: state.items.map((i) => {
              if (i.productId !== product.id) return i;
              const next = Math.min(i.quantity + q, Math.max(0, product.stock));
              return { ...i, stock: product.stock, quantity: next };
            }),
          };
        });
      },
      setQuantity: (productId, quantity) => {
        const q = Math.max(0, Math.floor(quantity));
        set((state) => ({
          items: state.items
            .map((i) => {
              if (i.productId !== productId) return i;
              const next = Math.min(q, Math.max(0, i.stock));
              return { ...i, quantity: next };
            })
            .filter((i) => i.quantity > 0),
        }));
      },
      increment: (productId) => {
        set((state) => ({
          items: state.items.map((i) => {
            if (i.productId !== productId) return i;
            return { ...i, quantity: Math.min(i.quantity + 1, Math.max(0, i.stock)) };
          }),
        }));
      },
      decrement: (productId) => {
        set((state) => ({
          items: state.items
            .map((i) => {
              if (i.productId !== productId) return i;
              return { ...i, quantity: Math.max(0, i.quantity - 1) };
            })
            .filter((i) => i.quantity > 0),
        }));
      },
      remove: (productId) => {
        set((state) => ({ items: state.items.filter((i) => i.productId !== productId) }));
      },
      clear: () => {
        set({ items: [] });
      },
      getCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      getSubtotal: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    {
      name: 'smart-grocery-cart',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

