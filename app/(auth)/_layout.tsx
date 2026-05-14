import { Stack, type Href, useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { ActivityIndicator, View } from 'react-native';
import { useEffect } from 'react';

export default function AuthLayout() {
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

  useEffect(() => {
    if (isHydrated && isAuthenticated && user) {
      const target =
        user.role === 'STAFF' || user.role === 'ADMIN'
          ? ('/(staff)' as Href)
          : ('/(customer)' as Href);
      
      const timer = setTimeout(() => {
        router.replace(target);
      }, 0);
      
      return () => clearTimeout(timer);
    }
  }, [isHydrated, isAuthenticated, user, router]);

  if (!isHydrated) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff' }}>
        <ActivityIndicator size="large" color="#22C55E" />
      </View>
    );
  }

  if (isAuthenticated && user) {
    // Return null while waiting for the useEffect redirect to fire
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" options={{ title: 'Login' }} />
      <Stack.Screen name="register" options={{ title: 'Đăng ký' }} />
      <Stack.Screen name="design-system" options={{ title: 'Design System' }} />
    </Stack>
  );
}
