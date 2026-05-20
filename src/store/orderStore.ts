import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Order } from '../types/order';

type OrderState = {
  orders: Order[];
  addOrder: (order: Order) => void;
  clearOrders: () => void;
  getById: (id: number) => Order | undefined;
};

export const useOrderStore = create<OrderState>()(
  persist(
    (set, get) => ({
      orders: [],
      addOrder: (order) => {
        set((s) => ({ orders: [order, ...s.orders] }));
      },
      clearOrders: () => {
        set({ orders: [] });
      },
      getById: (id) => get().orders.find((o) => o.id === id),
    }),
    {
      name: 'smart-grocery-orders',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

