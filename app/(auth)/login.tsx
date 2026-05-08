import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Alert, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { authApi } from '../../src/api/auth';
import Input from '../../src/components/ui/Input';
import Button from '../../src/components/ui/Button';
import BrandMark from '../../src/components/ui/BrandMark';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { getEmailError, getPasswordError, isLoginFormValid } from '../../src/utils/loginValidation';

export default function LoginScreen() {
  const { setTokens, setUser, authNotice, setAuthNotice } = useAuthStore();
  const authNoticeShown = useRef(false);
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });
  const [focused, setFocused] = useState({ email: false, password: false });
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const emailError = useMemo(
    () => getEmailError({ email, touched: touched.email, focused: focused.email }),
    [email, focused.email, touched.email]
  );
  const passwordError = useMemo(
    () => getPasswordError({ password, touched: touched.password, focused: focused.password }),
    [focused.password, password, touched.password]
  );

  const isFormValid = useMemo(() => isLoginFormValid({ email, password }), [email, password]);
  const isSubmitDisabled = loading || !isFormValid;

  useEffect(() => {
    if (!authNotice || authNoticeShown.current) return;
    authNoticeShown.current = true;
    Alert.alert('Đăng xuất khỏi thiết bị khác', authNotice, [{ text: 'Đóng', onPress: () => setAuthNotice(null) }]);
  }, [authNotice, setAuthNotice]);

  const handleLogin = async () => {
    setTouched({ email: true, password: true });
    if (!isLoginFormValid({ email, password })) return;
    
    setLoading(true);
    try {
      const response = await authApi.login(email, password);
      
      if (!response || !response.token || !response.user) {
        Alert.alert('Đăng nhập thất bại', 'Phản hồi từ máy chủ không hợp lệ.', [{ text: 'Đóng' }]);
        return;
      }

      setTokens(response.token, response.refreshToken);
      setUser(response.user);
    } catch (e) {
      const message =
        e instanceof Error
          ? e.message
          : 'Không thể đăng nhập. Vui lòng thử lại.';
      Alert.alert('Đăng nhập thất bại', message, [{ text: 'Đóng' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View className="flex-1 justify-center p-6 mt-12">
          <View className="mb-10 items-center">
            <BrandMark size={86} />
            <Text className="text-4xl font-outfit-bold text-primary">SmartGrocery</Text>
            <Text className="text-slate-500 font-inter mt-2">Chào mừng bạn quay trở lại!</Text>
          </View>

          <Input 
            label="Email"
            placeholder="example@gmail.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            icon={<Mail size={20} color="#94A3B8" />}
            error={emailError}
            onFocus={() => setFocused((s) => ({ ...s, email: true }))}
            onBlur={() => {
              setFocused((s) => ({ ...s, email: false }));
              setTouched((s) => ({ ...s, email: true }));
            }}
          />

          <Input 
            label="Mật khẩu"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!isPasswordVisible}
            icon={<Lock size={20} color="#94A3B8" />}
            error={passwordError}
            onFocus={() => setFocused((s) => ({ ...s, password: true }))}
            onBlur={() => {
              setFocused((s) => ({ ...s, password: false }));
              setTouched((s) => ({ ...s, password: true }));
            }}
            rightElement={
              <TouchableOpacity
                onPress={() => setIsPasswordVisible((v) => !v)}
                activeOpacity={0.7}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}
              >
                {isPasswordVisible ? <EyeOff size={20} color="#64748B" /> : <Eye size={20} color="#64748B" />}
              </TouchableOpacity>
            }
          />

          <Button 
            label="Đăng nhập" 
            onPress={handleLogin}
            loading={loading}
            disabled={isSubmitDisabled}
            className="mt-6 w-full"
            hapticVariant="medium"
          />

          <View className="flex-row justify-center mt-6">
            <Text className="text-slate-500 font-inter">Chưa có tài khoản? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')} activeOpacity={0.7}>
              <Text className="text-primary font-inter-bold">Đăng ký ngay</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
