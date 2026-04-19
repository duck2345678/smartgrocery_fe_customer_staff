import React, { memo } from 'react';
import { Tabs } from 'expo-router';
import { Home, Search, Brain, History, User } from 'lucide-react-native';

import { ProtectedRoute } from '../../src/components/auth/ProtectedRoute';

const TAB_SCREEN_OPTIONS = {
  tabBarActiveTintColor: '#22C55E',
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

const CustomerTabs = memo(function CustomerTabs() {
  return (
    <Tabs screenOptions={TAB_SCREEN_OPTIONS}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }: { color: string }) => <Home size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Tìm kiếm',
          tabBarIcon: ({ color }: { color: string }) => <Search size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="ai"
        options={{
          title: 'AI',
          tabBarIcon: ({ color }: { color: string }) => <Brain size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Đơn hàng',
          tabBarIcon: ({ color }: { color: string }) => <History size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Tài khoản',
          tabBarIcon: ({ color }: { color: string }) => <User size={24} color={color} />,
        }}
      />
      {/* Hidden from tab bar — accessed via router.push */}
      <Tabs.Screen name="cart" options={{ href: null }} />
      <Tabs.Screen name="checkout" options={{ href: null }} />
      <Tabs.Screen name="order-success" options={{ href: null }} />
      <Tabs.Screen name="products" options={{ href: null }} />
    </Tabs>
  );
});

export default function CustomerLayout() {
  return (
    <ProtectedRoute role="CUSTOMER">
      <CustomerTabs />
    </ProtectedRoute>
  );
}

