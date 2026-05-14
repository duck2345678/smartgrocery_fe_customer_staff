import { Stack } from 'expo-router';
import { ProtectedRoute } from '../../src/components/auth/ProtectedRoute';

export default function CustomerLayout() {
  return (
    <ProtectedRoute role="CUSTOMER">
      <Stack screenOptions={{ headerShown: false }}>
        {/* The main tab interface */}
        <Stack.Screen name="(tabs)" />
        
        {/* Drill-down screens (Outside of Tabs stack to fix back button bug) */}
        <Stack.Screen name="products" />
        <Stack.Screen name="search" />
        <Stack.Screen name="checkout" />
        <Stack.Screen name="order-success" />
        <Stack.Screen name="orders" />
        <Stack.Screen name="ai-meal-review" />
      </Stack>
    </ProtectedRoute>
  );
}
