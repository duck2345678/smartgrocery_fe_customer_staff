import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Alert,
  KeyboardAvoidingView, Platform, ScrollView, StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { authApi } from '../../src/api/auth';
import Button from '../../src/components/ui/Button';
import { ShieldCheck, RefreshCw } from 'lucide-react-native';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60;

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const { setTokens, setUser } = useAuthStore();

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleOtpChange = (text: string, index: number) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 1);
    const newOtp = [...otp];
    newOtp[index] = cleaned;
    setOtp(newOtp);
    if (cleaned && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (digits.length === OTP_LENGTH) {
      setOtp(digits.split(''));
      inputRefs.current[OTP_LENGTH - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < OTP_LENGTH) {
      Alert.alert('Thiếu mã', 'Vui lòng nhập đủ 6 chữ số của mã xác nhận.');
      return;
    }
    setLoading(true);
    try {
      const response = await authApi.verifyEmail(email ?? '', code);
      setTokens(response.token, response.refreshToken);
      setUser(response.user);
      // authStore sẽ redirect tự động
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Mã xác nhận không đúng. Vui lòng thử lại.';
      Alert.alert('Xác nhận thất bại', message, [{ text: 'Đóng' }]);
      setOtp(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    try {
      await authApi.resendEmailVerification(email ?? '');
      setCountdown(RESEND_COOLDOWN);
      setOtp(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
      Alert.alert('Đã gửi lại', 'Mã xác nhận mới đã được gửi đến email của bạn.');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Không thể gửi lại mã. Vui lòng thử lại.';
      Alert.alert('Lỗi', message, [{ text: 'Đóng' }]);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={styles.inner}>
          {/* Header */}
          <View style={styles.iconWrapper}>
            <ShieldCheck size={48} color="#16a34a" />
          </View>
          <Text style={styles.title}>Xác nhận Email</Text>
          <Text style={styles.subtitle}>
            Chúng tôi đã gửi mã xác nhận 6 chữ số đến{'\n'}
            <Text style={styles.emailHighlight}>{email}</Text>
          </Text>

          {/* OTP boxes */}
          <View style={styles.otpRow}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => { inputRefs.current[index] = ref; }}
                style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
                value={digit}
                onChangeText={(text) => {
                  // Handle paste on first input
                  if (text.length > 1) { handlePaste(text); return; }
                  handleOtpChange(text, index);
                }}
                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                keyboardType="number-pad"
                maxLength={6} // allow paste
                selectTextOnFocus
                textAlign="center"
              />
            ))}
          </View>

          {/* Verify button */}
          <Button
            label="Xác nhận"
            onPress={handleVerify}
            loading={loading}
            disabled={loading || otp.join('').length < OTP_LENGTH}
            className="w-full mt-4"
            hapticVariant="medium"
          />

          {/* Resend */}
          <View style={styles.resendRow}>
            {countdown > 0 ? (
              <Text style={styles.countdown}>Gửi lại sau <Text style={styles.countdownNum}>{countdown}s</Text></Text>
            ) : (
              <TouchableOpacity onPress={handleResend} disabled={resendLoading} activeOpacity={0.7} style={styles.resendBtn}>
                <RefreshCw size={15} color="#16a34a" />
                <Text style={styles.resendText}>{resendLoading ? 'Đang gửi…' : 'Gửi lại mã'}</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Back */}
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <Text style={styles.backText}>← Quay lại đăng ký</Text>
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
  subtitle: { fontSize: 15, color: '#64748b', textAlign: 'center', lineHeight: 22, marginBottom: 36 },
  emailHighlight: { color: '#16a34a', fontWeight: '700' },
  otpRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  otpBox: {
    width: 48, height: 58, borderRadius: 12,
    borderWidth: 2, borderColor: '#e2e8f0',
    backgroundColor: '#ffffff', fontSize: 24, fontWeight: '700', color: '#0f172a',
    textAlign: 'center',
  },
  otpBoxFilled: { borderColor: '#16a34a', backgroundColor: '#f0fdf4' },
  resendRow: { marginTop: 20, alignItems: 'center' },
  countdown: { fontSize: 14, color: '#94a3b8' },
  countdownNum: { color: '#16a34a', fontWeight: '700' },
  resendBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 16 },
  resendText: { fontSize: 14, color: '#16a34a', fontWeight: '600' },
  backBtn: { marginTop: 24 },
  backText: { fontSize: 14, color: '#64748b' },
});
