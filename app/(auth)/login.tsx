import React, { useState } from 'react';
import { View, Text, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useAuthStore } from '../../src/store/authStore';
import { authApi } from '../../src/api/auth';
import Input from '../../src/components/ui/Input';
import Button from '../../src/components/ui/Button';
import { Mail, Lock } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const { setTokens, setUser } = useAuthStore();
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};
    if (!email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Invalid email format';
    
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    
    setLoading(true);
    try {
      const response = await authApi.login(email, password);
      
      // Save to store
      setTokens(response.token, response.refreshToken);
      setUser(response.user);
      
      // Navigation is handled by Auth Guard in root layout
      // so we don't necessarily need to push here
    } catch (error: any) {
      console.error('Login error:', error);
      Alert.alert(
        'Login Failed',
        error.response?.data?.message || 'Invalid email or password. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 justify-center p-6 mt-12">
          <View className="mb-10 items-center">
            <Text className="text-4xl font-outfit-bold text-primary">SmartGrocery</Text>
            <Text className="text-slate-500 font-inter mt-2">Đăng nhập để bắt đầu phiên làm việc</Text>
          </View>

          <Input 
            label="Email"
            placeholder="example@gmail.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            icon={<Mail size={20} color="#94A3B8" />}
            error={errors.email}
          />

          <Input 
            label="Mật khẩu"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            icon={<Lock size={20} color="#94A3B8" />}
            error={errors.password}
          />

          <Button 
            label="Đăng nhập" 
            onPress={handleLogin}
            loading={loading}
            className="mt-6"
            hapticVariant="medium"
          />

          <View className="flex-row justify-center mt-6">
            <Text className="text-slate-500 font-inter">Chưa có tài khoản? </Text>
            <Text className="text-primary font-inter-bold">Đăng ký ngay</Text>
          </View>

          {/* Quick link to Design System during dev */}
          <Button 
            label="Showcase Design System" 
            variant="ghost" 
            onPress={() => router.push('/(auth)/design-system' as any)}
            className="mt-10"
            textClassName="text-slate-400 text-sm"
            hapticVariant="none"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
