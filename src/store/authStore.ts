import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { useCartStore } from "./cartStore";
import { useOrderStore } from "./orderStore";

export type UserDto = {
  id: number;
  email: string;
  fullName?: string | null;
  role: 'CUSTOMER' | 'STAFF' | 'ADMIN';
};

const isSupportedRole = (role: UserDto['role'] | undefined | null): role is 'CUSTOMER' | 'STAFF' | 'ADMIN' =>
  role === 'CUSTOMER' || role === 'STAFF' || role === 'ADMIN';

type AuthState = {
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  user: UserDto | null;
  isHydrated: boolean;
  setHydrated: () => void;
  setTokens: (accessToken: string | null, refreshToken: string | null) => void;
  setUser: (user: UserDto | null) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      user: null,
      isHydrated: false,
      setHydrated: () => set({ isHydrated: true }),
      setTokens: (accessToken, refreshToken) => {
        set((s) => ({
          token: accessToken,
          refreshToken: refreshToken,
          isAuthenticated: Boolean(accessToken) && Boolean(s.user),
        }));
      },
      setUser: (user) => {
        if (user && !isSupportedRole(user.role)) {
          useCartStore.getState().clear();
          useOrderStore.getState().clearOrders();
          set({ token: null, refreshToken: null, isAuthenticated: false, user: null });
          return;
        }
        set((s) => ({ user, isAuthenticated: Boolean(s.token) && Boolean(user) }));
      },
      logout: () => {
        useCartStore.getState().clear();
        useOrderStore.getState().clearOrders();
        set({ token: null, refreshToken: null, isAuthenticated: false, user: null });
      },
    }),
    {
      name: "smart-grocery-auth-v2",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        useAuthStore.setState({ isHydrated: true });
        if (!state) return;

        const isAuth = Boolean(state.token) && Boolean(state.user) && isSupportedRole(state.user?.role);
        if (!isAuth) {
          state.logout();
          return;
        }

        useAuthStore.setState({ isAuthenticated: true });
      },
    }
  )
);
