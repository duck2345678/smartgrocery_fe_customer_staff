import React from 'react';
import { Tabs } from 'expo-router';
import { Home, Package, ClipboardList, Clock, User, Ticket } from 'lucide-react-native';

const HIDDEN_TAB_OPTIONS = {
  href: null,
} as const;

export default function StaffLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#16A34A',
        tabBarInactiveTintColor: '#7C8595',
        tabBarLabelPosition: 'below-icon',
        tabBarShowLabel: true,
        tabBarStyle: {
          height: 64,
          paddingTop: 8,
          paddingBottom: 6,
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          backgroundColor: '#FFFFFF',
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarItemStyle: {
          paddingTop: 2,
          paddingBottom: 2,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontFamily: 'Inter_600SemiBold',
          marginTop: 2,
          marginBottom: 0,
        },
        tabBarIconStyle: {
          marginTop: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Trang chủ',
          tabBarIcon: ({ color, size, focused }) => <Home size={size ?? 21} color={focused ? '#16A34A' : color} strokeWidth={focused ? 2.5 : 2} />,
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: 'Sản phẩm',
          tabBarIcon: ({ color, size, focused }) => <Package size={size ?? 21} color={focused ? '#16A34A' : color} strokeWidth={focused ? 2.5 : 2} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Đơn hàng',
          tabBarIcon: ({ color, size, focused }) => <ClipboardList size={size ?? 21} color={focused ? '#16A34A' : color} strokeWidth={focused ? 2.5 : 2} />,
        }}
      />
      <Tabs.Screen
        name="attendance"
        options={{
          title: 'Chấm công',
          tabBarIcon: ({ color, size, focused }) => <Clock size={size ?? 21} color={focused ? '#16A34A' : color} strokeWidth={focused ? 2.5 : 2} />,
        }}
      />
      <Tabs.Screen
        name="vouchers"
        options={{
          title: 'Voucher',
          tabBarIcon: ({ color, size, focused }) => <Ticket size={size ?? 21} color={focused ? '#16A34A' : color} strokeWidth={focused ? 2.5 : 2} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Cá nhân',
          tabBarIcon: ({ color, size, focused }) => <User size={size ?? 21} color={focused ? '#16A34A' : color} strokeWidth={focused ? 2.5 : 2} />,
        }}
      />

      <Tabs.Screen name="delivered-orders" options={HIDDEN_TAB_OPTIONS} />
      <Tabs.Screen name="handbook" options={HIDDEN_TAB_OPTIONS} />
      <Tabs.Screen name="issues" options={HIDDEN_TAB_OPTIONS} />
      <Tabs.Screen name="notifications" options={HIDDEN_TAB_OPTIONS} />
      <Tabs.Screen name="performance" options={HIDDEN_TAB_OPTIONS} />
      <Tabs.Screen name="users" options={HIDDEN_TAB_OPTIONS} />
    </Tabs>
  );
}
