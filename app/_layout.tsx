import 'react-native-gesture-handler';
import React, { useEffect, memo, useState } from 'react';
import { Stack, router } from 'expo-router';
import { QueryClient } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Pressable, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Constants from 'expo-constants';
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
import type * as NotificationsType from 'expo-notifications';

import "../src/styles/global.css";
import { useAuthStore } from '../src/store/authStore';
import { registerDeviceForPush } from '../src/notifications/push';

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
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const [banner, setBanner] = useState<{ title: string; body: string } | null>(null);
  const themeClass = React.useMemo(() => {
    if (!isAuthenticated || !user || !user.role) return '';
    if (user.role === 'STAFF') return 'theme-staff';
    if (user.role === 'ADMIN') return 'theme-admin';
    if (user.role === 'CUSTOMER') return 'theme-customer';
    return '';
  }, [isAuthenticated, user]);

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

  useEffect(() => {
    if (Constants.executionEnvironment === 'storeClient') return;

    let mounted = true;
    let sub1: NotificationsType.Subscription | null = null;
    let sub2: NotificationsType.Subscription | null = null;

    (async () => {
      try {
        const Notifications = (await import('expo-notifications')) as typeof NotificationsType;
        if (!mounted) return;

        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: false,
            shouldShowBanner: false,
            shouldShowList: false,
            shouldPlaySound: false,
            shouldSetBadge: false,
          }),
        });

        sub1 = Notifications.addNotificationReceivedListener((n) => {
          const title = n.request.content.title ?? 'Thông báo';
          const body = n.request.content.body ?? '';
          setBanner({ title, body });
          queryClient.invalidateQueries({ queryKey: ['staff-notifications'] });
          queryClient.invalidateQueries({ queryKey: ['assignments'] });
          queryClient.invalidateQueries({ queryKey: ['staff-issues-my'] });
          setTimeout(() => setBanner(null), 3500);
        });

        sub2 = Notifications.addNotificationResponseReceivedListener((resp) => {
          const routeStr = (resp.notification.request.content.data as { route?: unknown } | undefined)?.route;
          if (typeof routeStr === 'string' && routeStr.startsWith('/')) {
            router.push(routeStr as never);
            return;
          }
          router.push('/(staff)/notifications' as never);
        });
      } catch {
        return;
      }
    })();

    return () => {
      mounted = false;
      sub1?.remove();
      sub2?.remove();
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user || user.role !== 'STAFF') return;
    void registerDeviceForPush(Platform.OS);
  }, [isAuthenticated, user]);

  if (!fontsLoaded && !fontError) {
    return (
      <View style={{ flex: 1, backgroundColor: '#ffffff', justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ width: 40, height: 40, borderRadius: 20, borderTopWidth: 2, borderColor: '#22C55E' }} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={persistOptions}
        >
          <View className={themeClass} style={{ flex: 1 }}>
            <NavigatorShell />
            {banner ? (
              <View style={{ position: 'absolute', top: 60, left: 16, right: 16 }}>
                <Pressable
                  onPress={() => {
                    setBanner(null);
                    router.push('/(staff)/notifications' as never);
                  }}
                  style={{
                    backgroundColor: '#0F172A',
                    borderRadius: 16,
                    paddingVertical: 12,
                    paddingHorizontal: 14,
                  }}
                >
                  <Text style={{ color: '#FFFFFF', fontFamily: 'Outfit-Bold', fontSize: 14 }}>{banner.title}</Text>
                  {banner.body ? (
                    <Text style={{ color: '#E2E8F0', fontFamily: 'Inter-Regular', fontSize: 12, marginTop: 4 }} numberOfLines={2}>
                      {banner.body}
                    </Text>
                  ) : null}
                </Pressable>
              </View>
            ) : null}
          </View>
        </PersistQueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
