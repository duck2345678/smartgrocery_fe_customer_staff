import React, { memo } from 'react';
import { Tabs } from 'expo-router';
import { Home, Brain, User, Store, ShoppingCart } from 'lucide-react-native';
import { View, Text } from 'react-native';

import { ProtectedRoute } from '../../src/components/auth/ProtectedRoute';
import { useCart } from '../../src/hooks/useCart';

const TAB_SCREEN_OPTIONS = {
  tabBarActiveTintColor: '#16A34A',
  headerShown: false,
  tabBarStyle: {
    borderTopWidth: 0,
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
        name="shop"
        options={{
          title: 'Mua sắm',
          tabBarIcon: ({ color }: { color: string }) => <Store size={24} color={color} />,
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
        name="cart"
        options={{
          title: 'Giỏ hàng',
          tabBarIcon: ({ color }: { color: string }) => <CartTabIcon color={color} />,
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
      <Tabs.Screen name="search" options={{ href: null }} />
      <Tabs.Screen name="orders" options={{ href: null }} />
      <Tabs.Screen name="checkout" options={{ href: null }} />
      <Tabs.Screen name="order-success" options={{ href: null }} />
      <Tabs.Screen name="addresses" options={{ href: null }} />
      <Tabs.Screen name="profile-edit" options={{ href: null }} />
      <Tabs.Screen name="products" options={{ href: null }} />
      <Tabs.Screen name="ai-meal-review" options={{ href: null }} />
      <Tabs.Screen name="smart-lists" options={{ href: null }} />
      <Tabs.Screen name="meal-plans" options={{ href: null }} />
      <Tabs.Screen name="ai-chat" options={{ href: null }} />
    </Tabs>
  );
});

function CartTabIcon({ color }: { color: string }) {
  const { count } = useCart();
  return (
    <View style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}>
      <ShoppingCart size={24} color={count > 0 ? '#16A34A' : color} />
      {count > 0 ? (
        <View
          style={{
            position: 'absolute',
            top: -2,
            right: -6,
            minWidth: 16,
            height: 16,
            paddingHorizontal: 4,
            borderRadius: 999,
            backgroundColor: '#EF4444',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: '#fff', fontSize: 10, fontFamily: 'Inter-Bold' }} numberOfLines={1}>
            {count > 99 ? '99+' : String(count)}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

export default function CustomerLayout() {
  return (
    <ProtectedRoute role="CUSTOMER">
      <CustomerTabs />
    </ProtectedRoute>
  );
}
