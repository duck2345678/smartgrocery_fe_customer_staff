import React, { useState } from 'react';
import {
  View, Text, Alert, KeyboardAvoidingView,
  Platform, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { authApi } from '../../src/api/auth';
import Input from '../../src/components/ui/Input';
import Button from '../../src/components/ui/Button';
import { Mail } from 'lucide-react-native';

const isEmailValid = (email: string) => /\S+@\S+\.\S+/.test(email.trim());

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState(false);
  const [focused, setFocused] = useState(false);

  const emailError = touched && !focused
    ? !email.trim() ? 'Vui lòng nhập email' : !isEmailValid(email) ? 'Email không hợp lệ' : undefined
    : undefined;

  const handleSubmit = async () => {
    setTouched(true);
    if (!isEmailValid(email)) return;

    setLoading(true);
    try {
      await authApi.forgotPassword(email.trim());
      // Chuyển sang màn nhập OTP + mật khẩu mới
      router.push({ pathname: '/(auth)/reset-password', params: { email: email.trim() } });
    } catch (e) {
      // Vẫn redirect để tránh leak thông tin user tồn tại hay không
      router.push({ pathname: '/(auth)/reset-password', params: { email: email.trim() } });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={styles.inner}>
          <View style={styles.iconWrapper}>
            <Mail size={44} color="#16a34a" />
          </View>
          <Text style={styles.title}>Quên mật khẩu?</Text>
          <Text style={styles.subtitle}>
            Nhập email tài khoản của bạn. Chúng tôi sẽ gửi mã xác nhận để đặt lại mật khẩu.
          </Text>

          <View style={{ width: '100%', marginTop: 8 }}>
            <Input
              label="Email"
              placeholder="example@gmail.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              icon={<Mail size={20} color="#94A3B8" />}
              error={emailError}
              onFocus={() => setFocused(true)}
              onBlur={() => { setFocused(false); setTouched(true); }}
            />
          </View>

          <Button
            label="Gửi mã xác nhận"
            onPress={handleSubmit}
            loading={loading}
            disabled={loading}
            className="w-full mt-4"
            hapticVariant="medium"
          />

          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <Text style={styles.backText}>← Quay lại đăng nhập</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  inner: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 28, paddingTop: 60 },
  iconWrapper: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: '#f0fdf4', alignItems: 'center', justifyContent: 'center',
    marginBottom: 20, borderWidth: 2, borderColor: '#bbf7d0',
  },
  title: { fontSize: 26, fontWeight: '800', color: '#0f172a', marginBottom: 10, textAlign: 'center' },
  subtitle: { fontSize: 15, color: '#64748b', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  backBtn: { marginTop: 28 },
  backText: { fontSize: 14, color: '#64748b' },
});
