import { Tabs } from 'expo-router';
import { Home, Search, Brain, History, User } from 'lucide-react-native';

export default function CustomerLayout() {
  return (
    <Tabs screenOptions={{ 
      tabBarActiveTintColor: '#22C55E',
      headerShown: false 
    }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
        }}
      />
      {/* Search, AI, Orders, Profile tabs to be added later */}
    </Tabs>
  );
}
