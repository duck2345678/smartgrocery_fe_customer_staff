import { Tabs } from 'expo-router';
import { LayoutDashboard, ClipboardList, Package, Truck, Settings } from 'lucide-react-native';

export default function StaffLayout() {
  return (
    <Tabs screenOptions={{ 
      tabBarActiveTintColor: '#2563EB',
      headerShown: false 
    }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <LayoutDashboard size={24} color={color} />,
        }}
      />
      {/* Assigned, Picking, Packing, Settings tabs to be added later */}
    </Tabs>
  );
}
