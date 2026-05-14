import 'react-native-gesture-handler';
import React, { useEffect, memo, useState } from 'react';
import { Stack, router } from 'expo-router';
import { QueryClient } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Pressable, Text, View, KeyboardAvoidingView, ScrollView, FlatList, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { cssInterop } from 'nativewind';
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
import { NotificationBanner } from '../src/components/ui/NotificationBanner';

// ── NativeWind Interop Setup ────────────────────────────────────────
// Register components that aren't styled by default in NativeWind v4
// to avoid "un-styled component" warnings that can cause crashes.
cssInterop(KeyboardAvoidingView, { className: 'style' });
cssInterop(ScrollView, { 
  className: 'style', 
  contentContainerClassName: 'contentContainerStyle' 
});
cssInterop(FlatList, { 
  className: 'style', 
  contentContainerClassName: 'contentContainerStyle' 
});
cssInterop(ActivityIndicator, { className: 'style' });
cssInterop(Image, { className: 'style' });

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

// ── Navigator Shell ───────────────────────────────────────────────
function NavigatorShell() {
  return (
    <Stack screenOptions={SCREEN_OPTIONS}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(customer)" />
      <Stack.Screen name="(staff)" />
    </Stack>
  );
}

export default function RootLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const authNotice = useAuthStore((s) => s.authNotice);
  const setAuthNotice = useAuthStore((s) => s.setAuthNotice);
  const [banner, setBanner] = useState<{ title: string; body: string; variant?: 'info' | 'error' } | null>(null);
  const themeClass = React.useMemo(() => {
    if (!isAuthenticated || !user || !user.role) return 'theme-customer';
    if (user.role === 'STAFF') return 'theme-staff';
    if (user.role === 'ADMIN') return 'theme-admin';
    if (user.role === 'CUSTOMER') return 'theme-customer';
    return 'theme-customer';
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
          const isSessionIssue = /thiết bị|đăng nhập|đăng nhập lại/i.test(`${title} ${body}`);
          setBanner({
            title,
            body,
            variant: isSessionIssue ? 'error' : 'info',
          });
          queryClient.invalidateQueries({ queryKey: ['staff-order-queue'] });
          queryClient.invalidateQueries({ queryKey: ['staff-order-my-active'] });
          setTimeout(() => setBanner(null), 4500);
        });

        sub2 = Notifications.addNotificationResponseReceivedListener((resp) => {
          const routeStr = (resp.notification.request.content.data as { route?: unknown } | undefined)?.route;
          if (typeof routeStr === 'string' && routeStr.startsWith('/')) {
            router.push(routeStr as never);
            return;
          }
          router.push('/(staff)/orders' as never);
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
    if (authNotice) {
      setBanner({
        title: 'Phiên đăng nhập bị thay thế',
        body: authNotice,
        variant: 'error',
      });
      setAuthNotice(null);
    }
  }, [authNotice, setAuthNotice]);

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
          <View style={{ flex: 1, backgroundColor: themeClass === 'theme-staff' ? '#F1F8F2' : '#F3F8F6' }}>
            <NavigatorShell />
            {banner ? (
                <View style={{ position: 'absolute', top: 60, left: 16, right: 16 }}>
                  <Pressable
                    onPress={() => {
                      setBanner(null);
                      if (banner.variant === 'error') {
                        router.replace('/(auth)/login' as never);
                      } else {
                        router.push('/(staff)/orders' as never);
                      }
                    }}
                    style={{
                      backgroundColor: banner.variant === 'error' ? '#7F1D1D' : '#0F172A',
                      borderRadius: 18,
                      paddingVertical: 14,
                      paddingHorizontal: 14,
                      borderWidth: 1,
                      borderColor: banner.variant === 'error' ? '#FCA5A5' : 'transparent',
                      shadowColor: '#000',
                      shadowOpacity: 0.18,
                      shadowRadius: 14,
                      shadowOffset: { width: 0, height: 8 },
                      elevation: 8,
                    }}
                  >
                    <Text style={{ color: '#FFFFFF', fontFamily: 'Outfit-Bold', fontSize: 14 }}>
                      {banner.variant === 'error' ? 'Phiên đăng nhập bị thay thế' : banner.title}
                    </Text>
                    <Text style={{ color: banner.variant === 'error' ? '#FEE2E2' : '#E2E8F0', fontFamily: 'Inter-Regular', fontSize: 12, marginTop: 4 }} numberOfLines={3}>
                      {banner.variant === 'error'
                        ? 'Tài khoản của bạn đã đăng nhập ở thiết bị khác. Bạn sẽ được chuyển về màn hình đăng nhập.'
                        : banner.body}
                    </Text>
                  </Pressable>
                </View>
            ) : null}
          </View>
        </PersistQueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
