import { useEffect } from 'react';
import { Stack, usePathname, useRouter, type Href } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { ActivityIndicator, View } from 'react-native';

export default function AuthLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    console.log('[AuthLayout] effect:', { isHydrated, isAuthenticated, user: user?.email, role: user?.role, pathname });
    if (!isHydrated) return;
    if (isAuthenticated && user) {
      const target: Href = user.role === 'STAFF' ? '/(staff)' : '/(customer)';
      const isOnTarget = pathname === target || pathname.startsWith(`${target}/`);
      if (isOnTarget) return;
      console.log('[AuthLayout] redirecting to', target);
      router.replace(target);
    }
  }, [isAuthenticated, isHydrated, pathname, router, user]);

  if (!isHydrated) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff' }}>
        <ActivityIndicator size="large" color="#22C55E" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" options={{ title: 'Login' }} />
      <Stack.Screen name="design-system" options={{ title: 'Design System' }} />
    </Stack>
  );
}
