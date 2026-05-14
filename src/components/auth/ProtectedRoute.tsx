import React from 'react';
import { usePathname, useRouter, type Href } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { ActivityIndicator, View } from 'react-native';

interface ProtectedRouteProps {
  children: React.ReactNode;
  role?: 'STAFF' | 'CUSTOMER' | 'ADMIN';
}

export function ProtectedRoute({ children, role }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  const roleSatisfied = React.useCallback((required: ProtectedRouteProps['role'], actual: ProtectedRouteProps['role']) => {
    if (!required) return true;
    if (!actual) return false;
    if (required === actual) return true;
    if (required === 'STAFF' && actual === 'ADMIN') return true;
    return false;
  }, []);

  React.useEffect(() => {
    if (!isHydrated) return;

    let target: Href | null = null;

    if (!isAuthenticated || !user) {
      target = '/(auth)/login' as any;
    } else if (role && !roleSatisfied(role, user.role)) {
      target =
        user.role === 'STAFF' || user.role === 'ADMIN'
            ? '/(staff)' as any
            : user.role === 'CUSTOMER'
              ? '/(customer)' as any
              : '/(auth)/login' as any;
    }

    if (!target) return;

    const isOnTarget = pathname === target || pathname.startsWith(`${target}/`);
    if (isOnTarget) return;

    router.replace(target);
  }, [isAuthenticated, isHydrated, pathname, role, roleSatisfied, router, user?.role]);

  if (!isHydrated) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff' }}>
        <ActivityIndicator size="large" color="#22C55E" />
      </View>
    );
  }

  if (!isAuthenticated || !user) return null;
  if (role && !roleSatisfied(role, user.role)) return null;
  return children;
}
