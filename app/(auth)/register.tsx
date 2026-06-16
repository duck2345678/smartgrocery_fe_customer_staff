import React, { useMemo, useState } from 'react';
import { View, Text, Alert, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { authApi } from '../../src/api/auth';
import Input from '../../src/components/ui/Input';
import Button from '../../src/components/ui/Button';
import BrandMark from '../../src/components/ui/BrandMark';
import { Mail, Lock, Eye, EyeOff, User, Phone } from 'lucide-react-native';

const isEmailValid = (email: string): boolean => /\S+@\S+\.\S+/.test(email.trim());

const getNameError = (input: { fullName: string; touched: boolean; focused: boolean }): string | undefined => {
  if (!input.touched || input.focused) return undefined;
  if (!input.fullName.trim()) return 'Vui lòng nhập họ tên';
  return undefined;
};

const getEmailError = (input: { email: string; touched: boolean; focused: boolean }): string | undefined => {
  if (!input.touched || input.focused) return undefined;
  if (!input.email.trim()) return 'Vui lòng nhập email';
  if (!isEmailValid(input.email)) return 'Email không hợp lệ';
  return undefined;
};

const isPhoneValid = (phone: string): boolean => /^(0[0-9]{9,10})$/.test(phone.trim());

const getPhoneError = (input: { phone: string; touched: boolean; focused: boolean }): string | undefined => {
  if (!input.touched || input.focused) return undefined;
  if (!input.phone.trim()) return 'Vui lòng nhập số điện thoại';
  if (!isPhoneValid(input.phone)) return 'Số điện thoại không hợp lệ';
  return undefined;
};

const getPasswordError = (input: { password: string; touched: boolean; focused: boolean }): string | undefined => {
  if (!input.touched || input.focused) return undefined;
  if (!input.password) return 'Vui lòng nhập mật khẩu';
  if (input.password.length < 6) return 'Mật khẩu phải có ít nhất 6 ký tự';
  return undefined;
};

const getConfirmPasswordError = (input: { password: string; confirmPassword: string; touched: boolean; focused: boolean }): string | undefined => {
  if (!input.touched || input.focused) return undefined;
  if (!input.confirmPassword) return 'Vui lòng xác nhận mật khẩu';
  if (input.confirmPassword !== input.password) return 'Mật khẩu xác nhận không khớp';
  return undefined;
};

const isRegisterFormValid = (input: { fullName: string; email: string; phone: string; password: string; confirmPassword: string }): boolean =>
  Boolean(input.fullName.trim()) && isEmailValid(input.email) && isPhoneValid(input.phone) && input.password.length >= 6 && input.password === input.confirmPassword;

export default function RegisterScreen() {
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({ fullName: false, email: false, phone: false, password: false, confirmPassword: false });
  const [focused, setFocused] = useState({ fullName: false, email: false, phone: false, password: false, confirmPassword: false });
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const fullNameError = useMemo(
    () => getNameError({ fullName, touched: touched.fullName, focused: focused.fullName }),
    [fullName, focused.fullName, touched.fullName]
  );
  const emailError = useMemo(
    () => getEmailError({ email, touched: touched.email, focused: focused.email }),
    [email, focused.email, touched.email]
  );
  const phoneError = useMemo(
    () => getPhoneError({ phone, touched: touched.phone, focused: focused.phone }),
    [phone, focused.phone, touched.phone]
  );
  const passwordError = useMemo(
    () => getPasswordError({ password, touched: touched.password, focused: focused.password }),
    [password, focused.password, touched.password]
  );
  const confirmPasswordError = useMemo(
    () => getConfirmPasswordError({ password, confirmPassword, touched: touched.confirmPassword, focused: focused.confirmPassword }),
    [confirmPassword, focused.confirmPassword, password, touched.confirmPassword]
  );

  const isSubmitDisabled = loading || !isRegisterFormValid({ fullName, email, phone, password, confirmPassword });

  const handleRegister = async () => {
    setTouched({ fullName: true, email: true, phone: true, password: true, confirmPassword: true });
    if (!isRegisterFormValid({ fullName, email, phone, password, confirmPassword })) return;

    setLoading(true);
    try {
      const response = await authApi.register(fullName.trim(), email.trim(), phone.trim(), password);
      if (response.requiresEmailVerification) {
        // Chuyển sang màn xác nhận OTP với email đã đăng ký
        router.push({ pathname: '/(auth)/verify-email', params: { email: email.trim() } });
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Không thể đăng ký. Vui lòng thử lại.';
      Alert.alert('Đăng ký thất bại', message, [{ text: 'Đóng' }]);
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
            <Text className="text-slate-500 font-inter mt-2">Tạo tài khoản mới để mua sắm.</Text>
          </View>

          <Input
            label="Họ và tên"
            placeholder="Nguyễn Văn A"
            value={fullName}
            onChangeText={setFullName}
            icon={<User size={20} color="#94A3B8" />}
            error={fullNameError}
            onFocus={() => setFocused((s) => ({ ...s, fullName: true }))}
            onBlur={() => {
              setFocused((s) => ({ ...s, fullName: false }));
              setTouched((s) => ({ ...s, fullName: true }));
            }}
          />

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
            label="Số điện thoại"
            placeholder="0901234567"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            icon={<Phone size={20} color="#94A3B8" />}
            error={phoneError}
            onFocus={() => setFocused((s) => ({ ...s, phone: true }))}
            onBlur={() => {
              setFocused((s) => ({ ...s, phone: false }));
              setTouched((s) => ({ ...s, phone: true }));
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

          <Input
            label="Xác nhận mật khẩu"
            placeholder="Nhập lại mật khẩu"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!isPasswordVisible}
            icon={<Lock size={20} color="#94A3B8" />}
            error={confirmPasswordError}
            onFocus={() => setFocused((s) => ({ ...s, confirmPassword: true }))}
            onBlur={() => {
              setFocused((s) => ({ ...s, confirmPassword: false }));
              setTouched((s) => ({ ...s, confirmPassword: true }));
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
            label="Đăng ký"
            onPress={handleRegister}
            loading={loading}
            disabled={isSubmitDisabled}
            className="mt-6 w-full"
            hapticVariant="medium"
          />

          <View className="flex-row justify-center mt-6">
            <Text className="text-slate-500 font-inter">Đã có tài khoản? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')} activeOpacity={0.7}>
              <Text className="text-primary font-inter-bold">Đăng nhập</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
