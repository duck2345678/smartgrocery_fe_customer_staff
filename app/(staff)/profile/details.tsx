import React, { useEffect, useState } from 'react';
import { ScrollView, Text, View, Pressable, TextInput, Alert, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { 
  User, 
  Mail, 
  Phone, 
  ShieldCheck, 
  Calendar, 
  BadgeCheck, 
  ChevronLeft,
  Camera,
  PencilLine,
  Shield
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../../src/store/authStore';
import Card from '../../../src/components/ui/Card';
import { authApi } from '../../../src/api/auth';
import { fileApi } from '../../../src/api/file';

export default function StaffProfileDetailScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  
  const [avatar, setAvatar] = useState(user?.avatarUrl || null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Editable fields states
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: user?.fullName || 'PO Staff',
    phone: user?.phone || '0123 456 789',
  });

  const [errors, setErrors] = useState<{ fullName?: string; phone?: string }>({});

  useEffect(() => {
    setAvatar(user?.avatarUrl || null);
    setFormData({
      fullName: user?.fullName || 'PO Staff',
      phone: user?.phone || '0123 456 789',
    });
    setErrors({});
  }, [user?.avatarUrl, user?.fullName, user?.phone]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Quyền truy cập', 'Vui lòng cho phép quyền truy cập thư viện ảnh để cập nhật ảnh đại diện.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled) {
      const newAvatarLocal = result.assets[0].uri;
      const oldAvatar = avatar;
      
      if (user) {
        setIsSaving(true);
        setAvatar(newAvatarLocal); // Optimistic UI: display immediately
        try {
          // 1. Upload file to Supabase storage to get public URL
          const uploadRes = await fileApi.upload(newAvatarLocal);
          const publicUrl = uploadRes.url;

          // 2. Update staff profile with the public URL via PATCH /auth/profile API
          const updatedUser = await authApi.updateProfile({
            avatarUrl: publicUrl
          });
          
          setUser({ ...user, avatarUrl: publicUrl });
          setAvatar(publicUrl);
          Alert.alert('Thành công', 'Đã cập nhật ảnh đại diện mới.');
        } catch (error) {
          setAvatar(oldAvatar); // Rollback on error
          Alert.alert('Lỗi', error instanceof Error ? error.message : 'Không thể tải ảnh lên.');
        } finally {
          setIsSaving(false);
        }
      }
    }
  };

  const saveField = async (field: 'fullName' | 'phone') => {
    const hasError = field === 'fullName' ? errors.fullName : errors.phone;
    if (hasError) return;

    if (field === 'fullName' && !formData.fullName.trim()) {
      Alert.alert('Lỗi', 'Họ và tên không được để trống.');
      return;
    }

    if (!user) return;

    setIsSaving(true);
    try {
      const updatedUser = await authApi.updateProfile({
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
      });
      setUser({ ...user, ...updatedUser });
      if (field === 'fullName') setIsEditingName(false);
      if (field === 'phone') setIsEditingPhone(false);
      Alert.alert('Thành công', `Đã cập nhật ${field === 'fullName' ? 'họ tên' : 'số điện thoại'}.`);
    } catch (error) {
      Alert.alert('Lỗi', error instanceof Error ? error.message : 'Không thể lưu thay đổi.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]">
      <Stack.Screen options={{ title: 'Hồ sơ cá nhân', headerShown: false }} />
      
      {/* Header */}
      <View className="px-6 py-4 flex-row items-center">
        <Pressable 
          onPress={() => router.back()}
          className="w-12 h-12 rounded-full bg-white items-center justify-center shadow-sm"
        >
          <ChevronLeft size={24} color="#1E293B" />
        </Pressable>
        <Text className="text-[20px] font-inter-bold text-[#1E293B] ml-4">Hồ sơ cá nhân</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* Section: THÔNG TIN CÁ NHÂN */}
        <View className="px-5 mt-6 mb-8">
          <View className="flex-row items-center mb-4 ml-1">
            <User size={20} color="#16A34A" />
            <Text className="text-[15px] font-inter-bold text-[#475569] ml-2 tracking-wide uppercase">THÔNG TIN CÁ NHÂN</Text>
          </View>
          <Card className="rounded-[32px] p-2 bg-white shadow-sm border-0">
            <EditableRow 
              icon={User} 
              label="Họ và tên" 
              value={formData.fullName} 
              isEditing={isEditingName}
              onEdit={() => setIsEditingName(true)}
              onSave={() => saveField('fullName')}
              onCancel={() => { 
                setFormData(p => ({ ...p, fullName: user?.fullName || 'PO Staff' })); 
                setErrors(p => ({ ...p, fullName: undefined }));
                setIsEditingName(false); 
              }}
              onChangeText={(t: string) => {
                setFormData(p => ({ ...p, fullName: t }));
                if (!t.trim()) {
                  setErrors(p => ({ ...p, fullName: 'Họ và tên không được để trống.' }));
                } else {
                  setErrors(p => ({ ...p, fullName: undefined }));
                }
              }}
              iconColor="#4F46E5"
              iconBg="#EEF2FF"
              isSaving={isSaving}
              imageUri={avatar}
              onImagePress={pickImage}
              error={errors.fullName}
              isSaveDisabled={Boolean(errors.fullName)}
            />
            <View className="h-[1px] bg-[#F8FAFC] mx-6" />
            <EditableRow 
              icon={Phone} 
              label="Số điện thoại" 
              value={formData.phone} 
              isEditing={isEditingPhone}
              onEdit={() => setIsEditingPhone(true)}
              onSave={() => saveField('phone')}
              onCancel={() => { 
                setFormData(p => ({ ...p, phone: user?.phone || '0123 456 789' })); 
                setErrors(p => ({ ...p, phone: undefined }));
                setIsEditingPhone(false); 
              }}
              onChangeText={(t: string) => {
                setFormData(p => ({ ...p, phone: t }));
                const cleanPhone = t.trim();
                if (!cleanPhone) {
                  setErrors(p => ({ ...p, phone: 'Số điện thoại không được để trống.' }));
                } else if (!/^(0[3|5|7|8|9])[0-9]{8}$/.test(cleanPhone)) {
                  setErrors(p => ({ ...p, phone: 'Số điện thoại 10 số không hợp lệ (Bắt đầu với 03/05/07/08/09).' }));
                } else {
                  setErrors(p => ({ ...p, phone: undefined }));
                }
              }}
              keyboardType="phone-pad"
              iconColor="#10B981"
              iconBg="#ECFDF5"
              isSaving={isSaving}
              error={errors.phone}
              isSaveDisabled={Boolean(errors.phone)}
            />
          </Card>
        </View>

        {/* Section: THÔNG TIN ĐỊNH DANH */}
        <View className="px-5">
          <View className="flex-row items-center mb-4 ml-1">
            <Shield size={20} color="#16A34A" />
            <Text className="text-[15px] font-inter-bold text-[#475569] ml-2 tracking-wide uppercase">THÔNG TIN ĐỊNH DANH</Text>
          </View>
          <Card className="rounded-[32px] p-2 bg-white shadow-sm border-0">
            <StaticRow 
              icon={Mail} 
              label="Email hệ thống" 
              value="staff.p0@smartgrocery.com" 
              iconColor="#8B5CF6"
              iconBg="#F5F3FF"
            />
            <View className="h-[1px] bg-[#F8FAFC] mx-6" />
            <StaticRow 
              icon={ShieldCheck} 
              label="Mã nhân viên" 
              value={user?.id ? `SG-${String(user.id).padStart(4, '0')}` : 'SG-0000'} 
              iconColor="#F59E0B"
              iconBg="#FFFBEB"
            />
            <View className="h-[1px] bg-[#F8FAFC] mx-6" />
            <StaticRow 
              icon={BadgeCheck} 
              label="Chức vụ" 
              value={user?.role === 'STAFF' ? 'Nhân viên vận hành' : (user?.role || 'Nhân viên')} 
              iconColor="#16A34A"
              iconBg="#EDF7F1"
            />
            <View className="h-[1px] bg-[#F8FAFC] mx-6" />
            <StaticRow 
              icon={Calendar} 
              label="Ngày tham gia" 
              value="15/04/2026" 
              iconColor="#3B82F6"
              iconBg="#EFF6FF"
            />
          </Card>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function EditableRow({ 
  icon: Icon, 
  label, 
  value, 
  isEditing, 
  onEdit, 
  onSave, 
  onCancel, 
  onChangeText,
  keyboardType = 'default',
  iconColor, 
  iconBg,
  isSaving,
  imageUri,
  onImagePress,
  error,
  isSaveDisabled
}: any) {
  return (
    <View className="flex-row items-center p-4">
      <Pressable 
        onPress={onImagePress} 
        disabled={!onImagePress}
        className="w-14 h-14 rounded-full items-center justify-center mr-4 overflow-hidden relative" 
        style={{ backgroundColor: iconBg }}
      >
        {imageUri ? (
          <Image source={{ uri: imageUri }} className="w-full h-full" />
        ) : (
          <Icon size={26} color={iconColor} strokeWidth={1.5} />
        )}
        {onImagePress && (
          <View className="absolute bottom-0 right-0 w-4 h-4 bg-[#16A34A] rounded-full items-center justify-center border border-white">
            <Camera size={8} color="#fff" />
          </View>
        )}
      </Pressable>
      <View style={{ flex: 1 }}>
        <Text className="text-[13px] font-inter text-[#64748B]">{label}</Text>
        {isEditing ? (
          <>
            <TextInput
              value={value}
              onChangeText={onChangeText}
              keyboardType={keyboardType}
              className="text-[17px] font-inter-bold text-[#1E293B] mt-0.5 p-0 border-b border-[#16A34A]"
              autoFocus
            />
            {error && <Text className="text-[11px] font-inter-bold text-red-500 mt-1">{error}</Text>}
          </>
        ) : (
          <Text className="text-[17px] font-inter-bold text-[#1E293B] mt-0.5">{value}</Text>
        )}
      </View>
      {isEditing ? (
        <View className="flex-row" style={{ gap: 8 }}>
          <Pressable onPress={onCancel} className="px-3 py-2 bg-slate-50 rounded-full">
            <Text className="text-slate-500 font-inter-bold text-[12px]">Hủy</Text>
          </Pressable>
          <Pressable 
            onPress={onSave} 
            disabled={isSaveDisabled || isSaving}
            className="px-4 py-2 rounded-full min-w-[60px] items-center"
            style={{ 
              backgroundColor: isSaveDisabled ? '#CBD5E1' : '#16A34A',
              opacity: isSaveDisabled ? 0.6 : 1
            }}
          >
            {isSaving ? <ActivityIndicator size="small" color="#fff" /> : <Text className="text-white font-inter-bold text-[12px]">Lưu</Text>}
          </Pressable>
        </View>
      ) : (
        <Pressable onPress={onEdit} className="flex-row items-center bg-[#F8FAFC] px-4 py-2 rounded-2xl">
          <PencilLine size={16} color="#16A34A" />
          <Text className="text-[14px] font-inter-bold text-[#16A34A] ml-2">Sửa</Text>
        </Pressable>
      )}
    </View>
  );
}

function StaticRow({ icon: Icon, label, value, iconColor, iconBg }: any) {
  return (
    <View className="flex-row items-center p-4">
      <View className="w-14 h-14 rounded-full items-center justify-center mr-4" style={{ backgroundColor: iconBg }}>
        <Icon size={26} color={iconColor} strokeWidth={1.5} />
      </View>
      <View style={{ flex: 1 }}>
        <Text className="text-[13px] font-inter text-[#64748B]">{label}</Text>
        <Text className="text-[17px] font-inter-bold text-[#1E293B] mt-0.5">{value}</Text>
      </View>
    </View>
  );
}
