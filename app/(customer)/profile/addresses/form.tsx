import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, TextInput, ScrollView, ActivityIndicator, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { 
  ChevronLeft, 
  User, 
  Phone, 
  MapPin, 
  Home, 
  Briefcase, 
  MoreHorizontal,
  Save
} from 'lucide-react-native';
import { useAuthStore } from '../../../../src/store/authStore';
import { userApi } from '../../../../src/api/users';
import { clsx } from 'clsx';

export default function AddressFormScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const params = useLocalSearchParams();
  
  const mode = params.mode as 'ADD' | 'EDIT';
  const addressId = params.addressId ? parseInt(params.addressId as string, 10) : null;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  
  const [streetAddress, setStreetAddress] = useState('');
  const [ward, setWard] = useState('');
  const [district, setDistrict] = useState('');
  const [city, setCity] = useState('');
  const [addressType, setAddressType] = useState('HOME');
  const [isDefault, setIsDefault] = useState(false);

  useEffect(() => {
    if (mode === 'EDIT' && addressId && user?.id) {
      loadAddress();
    }
  }, [mode, addressId, user?.id]);

  const loadAddress = async () => {
    if (!user?.id || !addressId) return;
    setFetching(true);
    try {
      const addresses = await userApi.getUserAddresses(user.id);
      const addr = addresses.find(a => a.id === addressId);
      if (addr) {
        setStreetAddress(addr.streetAddress);
        setWard(addr.ward);
        setDistrict(addr.district);
        setCity(addr.city);
        setAddressType(addr.addressType ?? 'OTHER');
        setIsDefault(addr.isDefault);
      }
    } catch (error) {
      console.error('Load address error:', error);
    } finally {
      setFetching(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;
    
    if (!streetAddress || !ward || !district || !city) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ các trường thông tin.');
      return;
    }

    setLoading(true);
    try {
      const data = {
        streetAddress,
        ward,
        district,
        city,
        addressType,
        isDefault
      };

      if (mode === 'ADD') {
        await userApi.addAddress(user.id, data);
        Alert.alert('Thành công', 'Đã thêm địa chỉ mới.');
      } else if (addressId) {
        await userApi.updateAddress(user.id, addressId, data);
        Alert.alert('Thành công', 'Đã cập nhật địa chỉ.');
      }
      router.back();
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể lưu địa chỉ.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color="#16A34A" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* ───── Header ───── */}
      <View className="px-5 py-4 flex-row items-center border-b border-slate-100">
        <Pressable 
          onPress={() => router.back()} 
          className="w-10 h-10 rounded-full bg-slate-50 items-center justify-center mr-3"
        >
          <ChevronLeft size={24} color="#0F172A" />
        </Pressable>
        <View>
          <Text className="text-[18px] font-outfit-bold text-slate-900">
            {mode === 'ADD' ? 'Thêm địa chỉ mới' : 'Chỉnh sửa địa chỉ'}
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 pt-6" contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* Address Type Selector */}
        <View className="mb-6">
          <Text className="text-[13px] font-inter-bold text-slate-500 mb-3 ml-1">Loại địa chỉ</Text>
          <View className="flex-row gap-x-3">
            {[
              { id: 'HOME', label: 'Nhà riêng', icon: Home },
              { id: 'OFFICE', label: 'Văn phòng', icon: Briefcase },
              { id: 'OTHER', label: 'Khác', icon: MoreHorizontal },
            ].map((type) => {
              const active = addressType === type.id;
              return (
                <Pressable
                  key={type.id}
                  onPress={() => setAddressType(type.id)}
                  className={clsx(
                    "flex-1 flex-row items-center justify-center py-3 rounded-2xl border",
                    active ? "bg-primary/5 border-primary" : "bg-white border-slate-100"
                  )}
                >
                  <type.icon size={16} color={active ? "#16A34A" : "#64748B"} />
                  <Text className={clsx(
                    "ml-2 text-[13px] font-inter-bold",
                    active ? "text-[#16A34A]" : "text-slate-600"
                  )}>
                    {type.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="gap-y-5">
          {/* Street Address */}
          <View>
            <Text className="text-[13px] font-inter-bold text-slate-500 mb-2 ml-1">Số nhà, Tên đường</Text>
            <View className="flex-row items-center px-4 py-3 bg-slate-50 rounded-2xl border border-slate-100">
              <MapPin size={18} color="#94A3B8" />
              <TextInput
                className="flex-1 ml-3 font-inter text-[14px] text-slate-900"
                placeholder="Ví dụ: 123 Đường ABC"
                value={streetAddress}
                onChangeText={setStreetAddress}
              />
            </View>
          </View>

          <View className="flex-row gap-x-4">
            <View className="flex-1">
              <Text className="text-[13px] font-inter-bold text-slate-500 mb-2 ml-1">Phường/Xã</Text>
              <TextInput
                className="px-4 py-3 bg-slate-50 rounded-2xl border border-slate-100 font-inter text-[14px]"
                placeholder="Phường..."
                value={ward}
                onChangeText={setWard}
              />
            </View>
            <View className="flex-1">
              <Text className="text-[13px] font-inter-bold text-slate-500 mb-2 ml-1">Quận/Huyện</Text>
              <TextInput
                className="px-4 py-3 bg-slate-50 rounded-2xl border border-slate-100 font-inter text-[14px]"
                placeholder="Quận..."
                value={district}
                onChangeText={setDistrict}
              />
            </View>
          </View>

          <View>
            <Text className="text-[13px] font-inter-bold text-slate-500 mb-2 ml-1">Tỉnh/Thành phố</Text>
            <TextInput
              className="px-4 py-3 bg-slate-50 rounded-2xl border border-slate-100 font-inter text-[14px]"
              placeholder="Ví dụ: TP. Hồ Chí Minh"
              value={city}
              onChangeText={setCity}
            />
          </View>

          {/* Default Switch */}
          <View className="flex-row items-center justify-between py-2 ml-1">
            <View>
              <Text className="text-[15px] font-inter-bold text-slate-800">Đặt làm địa chỉ mặc định</Text>
              <Text className="text-[12px] font-inter text-slate-400 mt-0.5">Sử dụng cho các lần mua hàng sau</Text>
            </View>
            <Switch
              value={isDefault}
              onValueChange={setIsDefault}
              trackColor={{ false: '#E2E8F0', true: '#DCFCE7' }}
              thumbColor={isDefault ? '#16A34A' : '#94A3B8'}
            />
          </View>
        </View>

        {/* ───── Save Button ───── */}
        <Pressable
          onPress={handleSave}
          disabled={loading}
          className="mt-10 bg-primary py-4 rounded-[24px] flex-row items-center justify-center shadow-lg shadow-emerald-500/30"
          style={{ elevation: 5 }}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Save size={20} color="#FFFFFF" className="mr-2" />
              <Text className="text-white font-inter-bold text-[16px] ml-2">Lưu địa chỉ</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
