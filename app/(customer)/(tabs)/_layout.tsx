import React, { memo } from 'react';
import { Tabs } from 'expo-router';
import { Home, User, Store, ShoppingCart, Brain } from 'lucide-react-native';
import { View, Text } from 'react-native';

import { useCart } from '../../../src/hooks/useCart';

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

function CartTabIcon({ color }: { color: string }) {
  const { count } = useCart();
  return (
    <View style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}>
      <ShoppingCart size={24} color={color} />
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

export default function CustomerTabsLayout() {
  return (
    <Tabs screenOptions={TAB_SCREEN_OPTIONS}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Trang chủ',
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
          title: 'AI Trợ lý',
          tabBarIcon: ({ color }: { color: string }) => (
            <View style={{ 
              backgroundColor: color === '#16A34A' ? '#F0FDF4' : 'transparent',
              padding: 8,
              borderRadius: 16,
              marginTop: -10, // Slightly lifted
              shadowColor: color === '#16A34A' ? '#16A34A' : 'transparent',
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 4
            }}>
              <Brain size={28} color={color} />
            </View>
          ),
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
    </Tabs>
  );
}
