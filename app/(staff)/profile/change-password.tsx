import React, { useState } from 'react';
import { ScrollView, Text, View, Pressable, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { 
  ChevronLeft,
  Lock,
  Eye,
  EyeOff,
  Shield,
  CheckCircle2
} from 'lucide-react-native';
import Card from '../../../src/components/ui/Card';

export default function ChangePasswordScreen() {
  const router = useRouter();
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [isSaving, setIsSaving] = useState(false);

  // Password validation
  const isMinLength = newPassword.length >= 8;
  const hasUpperCase = /[A-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;
  const isFormValid = currentPassword.length > 0 && isMinLength && hasUpperCase && hasNumber && passwordsMatch;

  const handleChangePassword = () => {
    if (!isFormValid) {
      Alert.alert('Lỗi', 'Vui lòng kiểm tra lại thông tin.');
      return;
    }

    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      Alert.alert(
        'Thành công',
        'Mật khẩu đã được thay đổi. Vui lòng đăng nhập lại.',
        [{ text: 'OK', onPress: () => router.replace('/(staff)/profile') }]
      );
    }, 1200);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]">
      <Stack.Screen options={{ title: 'Đổi mật khẩu', headerShown: false }} />
      
      {/* Header */}
      <View className="px-6 py-4 flex-row items-center">
        <Pressable 
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(staff)/profile');
            }
          }}
          className="w-12 h-12 rounded-full bg-white items-center justify-center shadow-sm"
        >
          <ChevronLeft size={24} color="#1E293B" />
        </Pressable>
        <Text className="text-[20px] font-inter-bold text-[#1E293B] ml-4">Đổi mật khẩu</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>

        {/* Security Icon */}
        <View className="items-center mb-8 mt-4">
          <View 
            className="w-24 h-24 rounded-full bg-[#EEF2FF] items-center justify-center"
            style={{ elevation: 3, shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 12 }}
          >
            <Shield size={44} color="#4F46E5" strokeWidth={1.5} />
          </View>
          <Text className="text-[15px] font-inter text-[#64748B] mt-4 text-center">
            Để bảo mật tài khoản, vui lòng nhập{'\n'}mật khẩu hiện tại và mật khẩu mới.
          </Text>
        </View>

        {/* Password Fields */}
        <View style={{ gap: 16 }}>
          <PasswordField 
            label="Mật khẩu hiện tại"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            showPassword={showCurrent}
            toggleShow={() => setShowCurrent(!showCurrent)}
            iconColor="#F59E0B"
            iconBg="#FFFBEB"
          />
          <PasswordField 
            label="Mật khẩu mới"
            value={newPassword}
            onChangeText={setNewPassword}
            showPassword={showNew}
            toggleShow={() => setShowNew(!showNew)}
            iconColor="#16A34A"
            iconBg="#DCFCE7"
          />
          <PasswordField 
            label="Xác nhận mật khẩu mới"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            showPassword={showConfirm}
            toggleShow={() => setShowConfirm(!showConfirm)}
            iconColor="#3B82F6"
            iconBg="#EFF6FF"
          />
        </View>

        {/* Validation Checklist */}
        {newPassword.length > 0 && (
          <Card className="rounded-[24px] p-5 bg-white shadow-sm border-0 mt-6">
            <Text className="text-[14px] font-inter-bold text-[#475569] mb-3">Yêu cầu mật khẩu</Text>
            <View style={{ gap: 10 }}>
              <ValidationItem label="Tối thiểu 8 ký tự" passed={isMinLength} />
              <ValidationItem label="Có ít nhất 1 chữ hoa" passed={hasUpperCase} />
              <ValidationItem label="Có ít nhất 1 chữ số" passed={hasNumber} />
              {confirmPassword.length > 0 && (
                <ValidationItem label="Mật khẩu xác nhận khớp" passed={passwordsMatch} />
              )}
            </View>
          </Card>
        )}

        {/* Submit Button */}
        <Pressable
          onPress={handleChangePassword}
          disabled={!isFormValid || isSaving}
          className="mt-8 p-5 rounded-[28px] items-center justify-center flex-row"
          style={{
            backgroundColor: isFormValid ? '#16A34A' : '#CBD5E1',
            elevation: isFormValid ? 4 : 0,
            shadowColor: '#16A34A',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: isFormValid ? 0.2 : 0,
            shadowRadius: 12,
          }}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Lock size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text className="text-[17px] font-inter-bold text-white">Xác nhận đổi mật khẩu</Text>
            </>
          )}
        </Pressable>

      </ScrollView>
    </SafeAreaView>
  );
}

function PasswordField({ label, value, onChangeText, showPassword, toggleShow, iconColor, iconBg }: any) {
  return (
    <Card className="rounded-[24px] bg-white shadow-sm border-0 p-2">
      <View className="flex-row items-center p-3">
        <View className="w-12 h-12 rounded-full items-center justify-center mr-4" style={{ backgroundColor: iconBg }}>
          <Lock size={22} color={iconColor} strokeWidth={1.5} />
        </View>
        <View style={{ flex: 1 }}>
          <Text className="text-[12px] font-inter text-[#94A3B8] mb-1">{label}</Text>
          <TextInput
            value={value}
            onChangeText={onChangeText}
            secureTextEntry={!showPassword}
            className="text-[16px] font-inter-bold text-[#1E293B] p-0"
            placeholder="••••••••"
            placeholderTextColor="#CBD5E1"
          />
        </View>
        <Pressable onPress={toggleShow} className="p-2">
          {showPassword ? (
            <EyeOff size={22} color="#94A3B8" />
          ) : (
            <Eye size={22} color="#94A3B8" />
          )}
        </Pressable>
      </View>
    </Card>
  );
}

function ValidationItem({ label, passed }: { label: string; passed: boolean }) {
  return (
    <View className="flex-row items-center">
      <CheckCircle2 size={18} color={passed ? '#16A34A' : '#CBD5E1'} />
      <Text 
        className="text-[14px] font-inter ml-3"
        style={{ color: passed ? '#16A34A' : '#94A3B8' }}
      >
        {label}
      </Text>
    </View>
  );
}
