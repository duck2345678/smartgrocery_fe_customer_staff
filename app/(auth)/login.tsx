import { View, Text, TouchableOpacity } from 'react-native';
import { useAuthStore } from '../../src/store/authStore';

export default function LoginScreen() {
  const { setTokens, setUser } = useAuthStore();

  const handleMockLogin = (role: 'CUSTOMER' | 'STAFF') => {
    // Mock login logic
    setTokens('mock_access_token', 'mock_refresh_token');
    setUser({
      id: 1,
      email: role === 'CUSTOMER' ? 'customer@test.com' : 'staff@test.com',
      fullName: role === 'CUSTOMER' ? 'Demo Customer' : 'Demo Staff',
      role: role
    });
  };

  return (
    <View className="flex-1 justify-center items-center bg-slate-50 p-6">
      <Text className="text-3xl font-bold text-slate-900 mb-8">SmartGrocery</Text>
      
      <TouchableOpacity 
        onPress={() => handleMockLogin('CUSTOMER')}
        className="w-full bg-green-500 py-4 rounded-xl mb-4 items-center"
      >
        <Text className="text-white font-semibold text-lg">Login as Customer</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        onPress={() => handleMockLogin('STAFF')}
        className="w-full bg-blue-600 py-4 rounded-xl items-center"
      >
        <Text className="text-white font-semibold text-lg">Login as Staff</Text>
      </TouchableOpacity>
    </View>
  );
}
