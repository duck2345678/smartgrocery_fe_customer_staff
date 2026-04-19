import React from 'react';
import { usePathname, useRouter, type Href } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { ActivityIndicator, View } from 'react-native';

interface ProtectedRouteProps {
  children: React.ReactNode;
  role?: 'STAFF' | 'CUSTOMER';
}

export function ProtectedRoute({ children, role }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  React.useEffect(() => {
    if (!isHydrated) return;

    let target: Href | null = null;

    if (!isAuthenticated || !user) {
      target = '/(auth)/login';
    } else if (role && user.role !== role) {
      target = user.role === 'STAFF' ? '/(staff)' : user.role === 'CUSTOMER' ? '/(customer)' : '/(auth)/login';
    }

    if (!target) return;

    const isOnTarget = pathname === target || pathname.startsWith(`${target}/`);
    if (isOnTarget) return;

    router.replace(target);
  }, [isAuthenticated, isHydrated, pathname, role, router, user?.role]);

  if (!isHydrated) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff' }}>
        <ActivityIndicator size="large" color="#22C55E" />
      </View>
    );
  }

  if (!isAuthenticated || !user) return null;
  if (role && user.role !== role) return null;
  return children;
}
