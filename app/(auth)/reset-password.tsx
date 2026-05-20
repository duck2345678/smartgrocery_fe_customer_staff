import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Alert,
  KeyboardAvoidingView, Platform, ScrollView, StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { authApi } from '../../src/api/auth';
import Input from '../../src/components/ui/Input';
import Button from '../../src/components/ui/Button';
import { Lock, Eye, EyeOff, RefreshCw, ArrowLeft, KeyRound } from 'lucide-react-native';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60;

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();

  // State quản lý các bước (1: Nhập OTP, 2: Nhập mật khẩu mới)
  const [step, setStep] = useState<1 | 2>(1);
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleOtpChange = (text: string, index: number) => {
    if (text.length > 1) {
      const digits = text.replace(/\D/g, '').slice(0, OTP_LENGTH);
      if (digits.length === OTP_LENGTH) {
        setOtp(digits.split(''));
        inputRefs.current[OTP_LENGTH - 1]?.focus();
        return;
      }
    }
    const cleaned = text.replace(/\D/g, '').slice(0, 1);
    const newOtp = [...otp];
    newOtp[index] = cleaned;
    setOtp(newOtp);
    if (cleaned && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) inputRefs.current[index - 1]?.focus();
  };

  const handleResend = async () => {
    setResendLoading(true);
    try {
      await authApi.forgotPassword(email ?? '');
      setCountdown(RESEND_COOLDOWN);
      setOtp(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
      Alert.alert('Đã gửi lại', 'Mã xác nhận mới đã được gửi đến email của bạn.');
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể gửi lại mã. Vui lòng thử lại.', [{ text: 'Đóng' }]);
    } finally {
      setResendLoading(false);
    }
  };

  const handleNextStep = () => {
    const code = otp.join('');
    if (code.length < OTP_LENGTH) {
      Alert.alert('Thiếu mã', 'Vui lòng nhập đủ 6 chữ số của mã xác nhận.');
      return;
    }
    setStep(2);
  };

  const handleReset = async () => {
    const code = otp.join('');
    if (code.length < OTP_LENGTH) {
      Alert.alert('Lỗi', 'Thiếu mã xác nhận OTP.');
      setStep(1);
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Mật khẩu quá ngắn', 'Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Không khớp', 'Mật khẩu xác nhận không khớp với mật khẩu mới.');
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword(email ?? '', code, newPassword);
      Alert.alert(
        'Thành công! 🎉',
        'Mật khẩu của bạn đã được đặt lại. Vui lòng đăng nhập lại bằng mật khẩu mới.',
        [{ text: 'Đăng nhập', onPress: () => router.replace('/(auth)/login') }]
      );
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Đặt lại mật khẩu thất bại. Vui lòng thử lại.';
      Alert.alert('Thất bại', message, [{ text: 'Đóng' }]);
      setOtp(Array(OTP_LENGTH).fill(''));
      setStep(1);
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
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
          {step === 1 ? (
            // BƯỚC 1: NHẬP OTP XÁC NHẬN
            <>
              <View style={styles.iconWrapper}>
                <KeyRound size={44} color="#16a34a" />
              </View>
              <Text style={styles.title}>Nhập mã xác nhận</Text>
              <Text style={styles.subtitle}>
                Nhập mã 6 số đã gửi đến{'\n'}
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
                    onChangeText={(text) => handleOtpChange(text, index)}
                    onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                    keyboardType="number-pad"
                    maxLength={6}
                    selectTextOnFocus
                    textAlign="center"
                  />
                ))}
              </View>

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

              <Button
                label="Tiếp tục"
                onPress={handleNextStep}
                disabled={otp.join('').length < OTP_LENGTH}
                className="w-full mt-8"
                hapticVariant="medium"
              />

              <TouchableOpacity onPress={() => router.replace('/(auth)/login')} style={styles.backBtn} activeOpacity={0.7}>
                <Text style={styles.backText}>← Quay lại đăng nhập</Text>
              </TouchableOpacity>
            </>
          ) : (
            // BƯỚC 2: THIẾT LẬP MẬT KHẨU MỚI
            <>
              <View style={styles.iconWrapper}>
                <Lock size={44} color="#16a34a" />
              </View>
              <Text style={styles.title}>Thiết lập mật khẩu mới</Text>
              <Text style={styles.subtitle}>
                Tài khoản: <Text style={styles.emailHighlight}>{email}</Text>{'\n'}
                Vui lòng nhập mật khẩu mới bảo mật hơn.
              </Text>

              {/* New password inputs */}
              <View style={{ width: '100%', marginTop: 8 }}>
                <Input
                  label="Mật khẩu mới"
                  placeholder="••••••••"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showPassword}
                  icon={<Lock size={20} color="#94A3B8" />}
                  rightElement={
                    <TouchableOpacity
                      onPress={() => setShowPassword((v) => !v)}
                      activeOpacity={0.7}
                      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                      style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}
                    >
                      {showPassword ? <EyeOff size={20} color="#64748B" /> : <Eye size={20} color="#64748B" />}
                    </TouchableOpacity>
                  }
                />
                <Input
                  label="Xác nhận mật khẩu mới"
                  placeholder="Nhập lại mật khẩu mới"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                  icon={<Lock size={20} color="#94A3B8" />}
                />
              </View>

              <Button
                label="Đặt lại mật khẩu"
                onPress={handleReset}
                loading={loading}
                disabled={loading || newPassword.length < 6 || confirmPassword.length < 6}
                className="w-full mt-6"
                hapticVariant="medium"
              />

              <TouchableOpacity onPress={() => setStep(1)} style={styles.backBtn} activeOpacity={0.7}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <ArrowLeft size={16} color="#64748b" />
                  <Text style={styles.backText}>Quay lại nhập OTP</Text>
                </View>
              </TouchableOpacity>
            </>
          )}
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
  emailHighlight: { color: '#16a34a', fontWeight: '700' },
  otpRow: { flexDirection: 'row', gap: 10 },
  otpBox: {
    width: 48, height: 58, borderRadius: 12,
    borderWidth: 2, borderColor: '#e2e8f0',
    backgroundColor: '#ffffff', fontSize: 24, fontWeight: '700', color: '#0f172a',
    textAlign: 'center',
  },
  otpBoxFilled: { borderColor: '#16a34a', backgroundColor: '#f0fdf4' },
  resendRow: { marginTop: 16, alignItems: 'center' },
  countdown: { fontSize: 14, color: '#94a3b8' },
  countdownNum: { color: '#16a34a', fontWeight: '700' },
  resendBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 16 },
  resendText: { fontSize: 14, color: '#16a34a', fontWeight: '600' },
  backBtn: { marginTop: 24 },
  backText: { fontSize: 14, color: '#64748b' },
});
