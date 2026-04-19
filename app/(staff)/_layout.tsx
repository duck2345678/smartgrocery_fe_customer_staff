import React, { useEffect, useRef, memo } from 'react';
import { Tabs } from 'expo-router';
import { AppState, type AppStateStatus } from 'react-native';
import { LayoutDashboard, ClipboardList } from 'lucide-react-native';
import { useSLAStore } from '../../src/store/slaStore';

import { ProtectedRoute } from '../../src/components/auth/ProtectedRoute';

const TAB_SCREEN_OPTIONS = {
  tabBarActiveTintColor: '#2563EB',
  headerShown: false,
  tabBarStyle: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    height: 60,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabBarLabelStyle: {
    fontFamily: 'Inter',
    fontSize: 12,
  },
} as const;

const StaffTabs = memo(function StaffTabs() {
  return (
    <Tabs screenOptions={TAB_SCREEN_OPTIONS}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }: { color: string }) => <LayoutDashboard size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="assignments"
        options={{
          title: 'Phân công',
          tabBarIcon: ({ color }: { color: string }) => <ClipboardList size={24} color={color} />,
        }}
      />
      {/* Hidden from tab bar — accessed via router.push */}
      <Tabs.Screen
        name="orders"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="lease-queue"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="lease-orders"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
});

export default function StaffLayout() {
  const setNow = useSLAStore((s) => s.setNow);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    setNow(Date.now());

    const interval = setInterval(() => {
      setNow(Date.now());
    }, 60000);

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        setNow(Date.now());
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ProtectedRoute role="STAFF">
      <StaffTabs />
    </ProtectedRoute>
  );
}
