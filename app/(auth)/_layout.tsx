import { Redirect, Stack, type Href } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { ActivityIndicator, View } from 'react-native';

export default function AuthLayout() {
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  if (!isHydrated) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff' }}>
        <ActivityIndicator size="large" color="#22C55E" />
      </View>
    );
  }

  if (isAuthenticated && user) {
    const target: Href =
      user.role === 'STAFF' || user.role === 'ADMIN'
          ? '/(staff)'
          : '/(customer)';
    return <Redirect href={target} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" options={{ title: 'Login' }} />
      <Stack.Screen name="design-system" options={{ title: 'Design System' }} />
    </Stack>
  );
}
