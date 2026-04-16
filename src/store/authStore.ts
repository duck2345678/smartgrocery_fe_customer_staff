import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type UserDto = {
  id: string | number;
  email: string;
  fullName?: string | null;
  role: 'CUSTOMER' | 'STAFF' | 'ADMIN';
};

type AuthState = {
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  user: UserDto | null;
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
      setTokens: (accessToken, refreshToken) => {
        set({ 
          token: accessToken, 
          refreshToken: refreshToken, 
          isAuthenticated: Boolean(accessToken) 
        });
      },
      setUser: (user) => {
        set({ user });
      },
      logout: () => {
        set({ token: null, refreshToken: null, isAuthenticated: false, user: null });
      },
    }),
    {
      name: "smart-grocery-auth",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
