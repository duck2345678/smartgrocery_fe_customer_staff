import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { QueryClient } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../src/store/authStore';
import { usePathname, useRouter } from 'expo-router';
import { View } from 'react-native';
import {
  useFonts,
  Outfit_400Regular,
  Outfit_700Bold,
} from '@expo-google-fonts/outfit';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';

import "../src/styles/global.css";

// Setup React Query with Persistence for Offline Support
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
});

// Prevent splash screen from hiding until fonts are loaded
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  const [fontsLoaded, fontError] = useFonts({
    'Outfit-Regular': Outfit_400Regular,
    'Outfit-Bold': Outfit_700Bold,
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-Bold': Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    if (!fontsLoaded && !fontError) return;
    // Auth Guard Logic
    const isAuthRoute = pathname.startsWith('/(auth)');
    const isCustomerRoute = pathname.startsWith('/(customer)');
    const isStaffRoute = pathname.startsWith('/(staff)');

    if (!isAuthenticated && !isAuthRoute) {
      // Redirect to login if not authenticated
      router.replace('/(auth)/login');
    } else if (isAuthenticated) {
      // Redirect based on role if at root or in auth routes
      if (isAuthRoute || pathname === '/') {
        if (user?.role === 'STAFF') {
          router.replace('/(staff)');
        } else {
          router.replace('/(customer)');
        }
      }
      
      // Prevent cross-role access
      if (user?.role === 'CUSTOMER' && isStaffRoute) {
        router.replace('/(customer)');
      }
      if (user?.role === 'STAFF' && isCustomerRoute) {
        router.replace('/(staff)');
      }
    }
  }, [isAuthenticated, user?.role, pathname]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  const themeClass = user?.role === 'STAFF' ? 'theme-staff' : '';

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: asyncStoragePersister }}
    >
      <View className={`flex-1 ${themeClass}`}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(customer)" options={{ headerShown: false }} />
          <Stack.Screen name="(staff)" options={{ headerShown: false }} />
        </Stack>
      </View>
    </PersistQueryClientProvider>
  );
}
