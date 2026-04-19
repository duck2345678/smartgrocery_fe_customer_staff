import { Stack, Redirect, type Href } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';

export default function AuthLayout() {
  const { isAuthenticated, user } = useAuthStore();

  if (isAuthenticated) {
    const target: Href = user?.role === 'STAFF' ? '/(staff)' : '/(customer)';
    return <Redirect href={target} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" options={{ title: 'Login' }} />
      <Stack.Screen name="design-system" options={{ title: 'Design System' }} />
    </Stack>
  );
}
