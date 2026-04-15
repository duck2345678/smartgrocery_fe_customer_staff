import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

const ACCESS_TOKEN_KEY = "JWT_ACCESS_TOKEN";
const REFRESH_TOKEN_KEY = "JWT_REFRESH_TOKEN";

export type UserDto = {
  id: string | number;
  email: string;
  fullName?: string | null;
};

type AuthState = {
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  user: UserDto | null;
  setTokens: (accessToken: string | null, refreshToken: string | null) => Promise<void>;
  setUser: (user: UserDto | null) => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
};

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  user: null,
  setTokens: async (accessToken, refreshToken) => {
    if (accessToken && refreshToken) {
      await AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    } else {
      await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
      await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
    }
    set({ 
      token: accessToken, 
      refreshToken: refreshToken, 
      isAuthenticated: Boolean(accessToken) 
    });
  },
  setUser: (user) => {
    set({ user });
  },
  logout: async () => {
    await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
    await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
    set({ token: null, refreshToken: null, isAuthenticated: false, user: null });
  },
  checkAuth: async () => {
    const accessToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
    if (!accessToken || !refreshToken) {
      set({ token: null, refreshToken: null, isAuthenticated: false, user: null });
      return false;
    }
    set({ token: accessToken, refreshToken: refreshToken, isAuthenticated: true });
    return true;
  }
}));

