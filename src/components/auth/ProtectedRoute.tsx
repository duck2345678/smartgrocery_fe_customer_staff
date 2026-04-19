import React from 'react';
import { Redirect, type Href } from 'expo-router';
import { useAuthStore } from '../../store/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  role?: 'STAFF' | 'CUSTOMER';
}

export function ProtectedRoute({ children, role }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  if (role && user?.role !== role) {
    const target: Href = user.role === 'STAFF' ? '/(staff)' : '/(customer)';
    return <Redirect href={target} />;
  }

  return <>{children}</>;
}
