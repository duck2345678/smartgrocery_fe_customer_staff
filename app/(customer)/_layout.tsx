import { Tabs } from 'expo-router';
import { Home, Search, Brain, History, User } from 'lucide-react-native';

import { ProtectedRoute } from '../../src/components/auth/ProtectedRoute';

export default function CustomerLayout() {
  return (
    <ProtectedRoute role="CUSTOMER">
      <Tabs screenOptions={{ 
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
      }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color }) => <Home size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: 'Tìm kiếm',
            tabBarIcon: ({ color }) => <Search size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="ai"
          options={{
            title: 'AI',
            tabBarIcon: ({ color }) => <Brain size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="orders"
          options={{
            title: 'Đơn hàng',
            tabBarIcon: ({ color }) => <History size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Tài khoản',
            tabBarIcon: ({ color }) => <User size={24} color={color} />,
          }}
        />
        {/* Hidden from tab bar — accessed via router.push */}
        <Tabs.Screen
          name="cart"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="checkout"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="order-success"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="products"
          options={{
            href: null,
          }}
        />
      </Tabs>
    </ProtectedRoute>
  );
}
