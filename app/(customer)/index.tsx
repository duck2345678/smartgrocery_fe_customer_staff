import { View, Text, TouchableOpacity } from 'react-native';
import { useAuthStore } from '../../src/store/authStore';

export default function CustomerHome() {
  const { logout, user } = useAuthStore();

  return (
    <View className="flex-1 justify-center items-center bg-white p-6">
      <Text className="text-2xl font-bold text-green-600 mb-2">Welcome, {user?.fullName}!</Text>
      <Text className="text-slate-500 mb-8">Customer Dashboard Placeholder</Text>
      
      <TouchableOpacity 
        onPress={() => logout()}
        className="bg-slate-200 px-6 py-3 rounded-full"
      >
        <Text className="text-slate-900 font-medium">Logout</Text>
      </TouchableOpacity>
    </View>
  );
}
