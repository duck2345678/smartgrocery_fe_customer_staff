import React, { useEffect, memo } from 'react';
import { Stack } from 'expo-router';
import { QueryClient } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

// ── Singleton instances (never re-created) ──────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24,
      staleTime: 1000 * 60 * 5,
      retry: 2,
      retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 10000),
    },
    mutations: { retry: 1 },
  },
});

const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'SG_RQ_CACHE_V2',
});

const persistOptions = { persister: asyncStoragePersister };

const SCREEN_OPTIONS = { headerShown: false } as const;

// Prevent splash screen from hiding until fonts are loaded
SplashScreen.preventAutoHideAsync();

// ── Navigator isolated from NativeWind re-renders ───────────────────
// Memo prevents the navigator from being re-rendered when the parent
// (RootLayout) re-renders due to Zustand / React-Query state changes.
// This breaks the infinite loop: wrap-jsx → useSyncState → forceStoreRerender → wrap-jsx.
const NavigatorShell = memo(function NavigatorShell() {
  return (
    <Stack screenOptions={SCREEN_OPTIONS}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(customer)" />
      <Stack.Screen name="(staff)" />
    </Stack>
  );
});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'Outfit-Regular': Outfit_400Regular,
    'Outfit-Bold': Outfit_700Bold,
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-Bold': Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return (
      <View style={{ flex: 1, backgroundColor: '#ffffff', justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ width: 40, height: 40, borderRadius: 20, borderTopWidth: 2, borderColor: '#22C55E' }} />
      </View>
    );
  }

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={persistOptions}
    >
      <NavigatorShell />
    </PersistQueryClientProvider>
  );
}
