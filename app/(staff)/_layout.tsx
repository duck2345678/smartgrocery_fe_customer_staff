import React, { memo } from 'react';
import { Tabs } from 'expo-router';
import { Text, View } from 'react-native';
import { ClipboardList, Clock, Home, Package, User } from 'lucide-react-native';

import { ProtectedRoute } from '../../src/components/auth/ProtectedRoute';

const TAB_SCREEN_OPTIONS = {
  tabBarActiveTintColor: '#16A34A',
  tabBarInactiveTintColor: '#64748B',
  headerShown: false,
  tabBarStyle: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    height: 68,
    paddingBottom: 10,
    paddingTop: 10,
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
  },
  tabBarLabelStyle: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
  },
  tabBarItemStyle: {
    paddingHorizontal: 6,
  },
} as const;

function TabLabel({ title, color }: { title: string; color: string }) {
  return (
    <Text
      style={{
        color,
        fontFamily: 'Inter-Medium',
        fontSize: 11,
        lineHeight: 14,
      }}
      numberOfLines={1}
    >
      {title}
    </Text>
  );
}

function TabIcon({
  icon,
  color,
}: {
  icon: (opts: { color: string }) => React.ReactNode;
  color: string;
}) {
  return (
    <View style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}>
      {icon({ color })}
    </View>
  );
}

const StaffTabs = memo(function StaffTabs() {
  return (
    <Tabs
      screenOptions={TAB_SCREEN_OPTIONS}
      backBehavior="initialRoute"
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Trang chủ',
          tabBarLabel: ({ color }) => <TabLabel title="Trang chủ" color={String(color)} />,
          tabBarIcon: ({ color }) => (
            <TabIcon icon={({ color: c }) => <Home size={22} color={c} />} color={String(color)} />
          ),
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: 'Sản phẩm',
          tabBarLabel: ({ color }) => <TabLabel title="Sản phẩm" color={String(color)} />,
          tabBarIcon: ({ color }) => (
            <TabIcon icon={({ color: c }) => <Package size={22} color={c} />} color={String(color)} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Đơn hàng',
          tabBarLabel: ({ color }) => <TabLabel title="Đơn hàng" color={String(color)} />,
          tabBarIcon: ({ color }) => (
            <TabIcon icon={({ color: c }) => <ClipboardList size={22} color={c} />} color={String(color)} />
          ),
        }}
      />
      <Tabs.Screen
        name="attendance"
        options={{
          title: 'Chấm công',
          tabBarLabel: ({ color }) => <TabLabel title="Chấm công" color={String(color)} />,
          tabBarIcon: ({ color }) => (
            <TabIcon icon={({ color: c }) => <Clock size={22} color={c} />} color={String(color)} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Cá nhân',
          tabBarLabel: ({ color }) => <TabLabel title="Cá nhân" color={String(color)} />,
          tabBarIcon: ({ color }) => (
            <TabIcon icon={({ color: c }) => <User size={22} color={c} />} color={String(color)} />
          ),
        }}
      />
      {/* Hide all non-tab routes from tab bar */}
      <Tabs.Screen name="products/scan" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="products/[id]" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="orders/[id]" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="admin-issues" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="admin-queue" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="handbook" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="performance" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="issues" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="notifications" options={{ href: null, headerShown: false }} />
    </Tabs>
  );
});

export default function StaffLayout() {
  return (
    <ProtectedRoute role="STAFF">
      <StaffTabs />
    </ProtectedRoute>
  );
}
