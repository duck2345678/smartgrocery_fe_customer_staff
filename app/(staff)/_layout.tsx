import React from 'react';
import { Tabs } from 'expo-router';
import { Home, Package, ClipboardList, Clock, User } from 'lucide-react-native';

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
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            navigation.navigate('products');
          },
        })}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Đơn hàng',
          tabBarIcon: ({ color, size, focused }) => <ClipboardList size={size ?? 21} color={focused ? '#16A34A' : color} strokeWidth={focused ? 2.5 : 2} />,
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            navigation.navigate('orders');
          },
        })}
      />
      <Tabs.Screen
        name="attendance"
        options={{
          title: 'Chấm công',
          tabBarIcon: ({ color, size, focused }) => <Clock size={size ?? 21} color={focused ? '#16A34A' : color} strokeWidth={focused ? 2.5 : 2} />,
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            navigation.navigate('attendance');
          },
        })}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Cá nhân',
          tabBarIcon: ({ color, size, focused }) => <User size={size ?? 21} color={focused ? '#16A34A' : color} strokeWidth={focused ? 2.5 : 2} />,
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            navigation.navigate('profile');
          },
        })}
      />
      {/* Hidden routes — accessible via navigation but not shown in tab bar */}
      <Tabs.Screen name="admin-queue" options={{ href: null }} />
      <Tabs.Screen name="products/scan" options={{ href: null }} />
      <Tabs.Screen name="products/[id]" options={{ href: null }} />
      <Tabs.Screen name="orders/[id]" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="handbook" options={{ href: null }} />
      <Tabs.Screen name="performance" options={{ href: null }} />
      <Tabs.Screen name="profile/payslip" options={{ href: null }} />
    </Tabs>
  );
}
