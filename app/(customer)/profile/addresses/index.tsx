import React, { useCallback, useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import { 
  ChevronLeft, 
  MapPin, 
  Plus, 
  Edit3, 
  Trash2, 
  CheckCircle2,
  Home,
  Briefcase,
  Navigation
} from 'lucide-react-native';
import { useAuthStore } from '../../../../src/store/authStore';
import { userApi } from '../../../../src/api/users';
import { UserAddress } from '../../../../src/types/address';
import Card from '../../../../src/components/ui/Card';
import { clsx } from 'clsx';

export default function AddressListScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [settingDefaultId, setSettingDefaultId] = useState<number | null>(null);

  const fetchAddresses = useCallback(async () => {
    if (!user?.id) return;
    try {
      const data = await userApi.getUserAddresses(user.id);
      setAddresses(data);
    } catch (error) {
      console.error('Fetch addresses error:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      fetchAddresses();
    }, [fetchAddresses])
  );

  const handleSetDefault = async (addressId: number) => {
    if (!user?.id || settingDefaultId != null) return;
    const previousAddresses = addresses;
    setSettingDefaultId(addressId);
    setAddresses((items) => items.map((item) => ({ ...item, isDefault: item.id === addressId })));
    try {
      await userApi.setDefaultAddress(user.id, addressId);
      await fetchAddresses();
    } catch (error: any) {
      setAddresses(previousAddresses);
      Alert.alert('Lỗi', error.message || 'Không thể thiết lập địa chỉ mặc định.');
    } finally {
      setSettingDefaultId(null);
    }
  };

  const handleDelete = (addressId: number) => {
    Alert.alert(
      'Xác nhận xóa',
      'Bạn có chắc chắn muốn xóa địa chỉ này không?',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Xóa', 
          style: 'destructive',
          onPress: async () => {
            if (!user?.id) return;
            try {
              await userApi.deleteAddress(user.id, addressId);
              fetchAddresses();
            } catch (error: any) {
              Alert.alert('Lỗi', error.message || 'Không thể xóa địa chỉ.');
            }
          }
        }
      ]
    );
  };

  const getAddressIcon = (type: string | null) => {
    switch (type) {
      case 'HOME': return Home;
      case 'OFFICE': return Briefcase;
      default: return MapPin;
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FBFBFC]" edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header */}
      <View className="px-5 py-4 flex-row items-center border-b border-slate-100 bg-white">
        <Pressable 
          onPress={() => router.back()} 
          className="w-10 h-10 rounded-full bg-slate-50 items-center justify-center mr-3"
        >
          <ChevronLeft size={24} color="#0F172A" />
        </Pressable>
        <View className="flex-1">
          <Text className="text-[18px] font-outfit-bold text-slate-900">Sổ địa chỉ</Text>
          <Text className="text-[12px] font-inter text-slate-500">Quản lý các địa chỉ nhận hàng của bạn</Text>
        </View>
        <Pressable 
          onPress={() => router.push({ pathname: '/(customer)/profile/addresses/form', params: { mode: 'ADD' } } as any)}
          className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center"
        >
          <Plus size={22} color="#16A34A" />
        </Pressable>
      </View>

      <ScrollView className="flex-1 px-5 pt-4" contentContainerStyle={{ paddingBottom: 40 }}>
        {loading ? (
          <View className="py-20 items-center">
            <ActivityIndicator color="#16A34A" />
          </View>
        ) : addresses.length > 0 ? (
          addresses.map((addr) => {
            const Icon = getAddressIcon(addr.addressType);
            return (
              <Card 
                key={addr.id} 
                className={clsx(
                  "mb-4 p-5 rounded-[28px] border",
                  addr.isDefault ? "border-primary/20 bg-white shadow-sm" : "border-slate-50 bg-white"
                )}
              >
                <View className="flex-row justify-between items-start">
                  <View className="flex-row items-center">
                    <View className={clsx(
                      "w-10 h-10 rounded-2xl items-center justify-center",
                      addr.isDefault ? "bg-primary/10" : "bg-slate-50"
                    )}>
                      <Icon size={20} color={addr.isDefault ? "#16A34A" : "#64748B"} />
                    </View>
                    <View className="ml-3">
                      <Text className="text-[16px] font-inter-bold text-slate-900">
                        {addr.addressType === 'HOME' ? 'Nhà riêng' : addr.addressType === 'OFFICE' ? 'Văn phòng' : 'Khác'}
                      </Text>
                      {addr.isDefault && (
                        <View className="flex-row items-center mt-0.5">
                          <CheckCircle2 size={12} color="#16A34A" />
                          <Text className="text-[11px] font-inter-bold text-[#16A34A] ml-1">Mặc định</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  
                  <View className="flex-row">
                    <Pressable 
                      onPress={() => router.push({ 
                        pathname: '/(customer)/profile/addresses/form', 
                        params: { mode: 'EDIT', addressId: addr.id } 
                      } as any)}
                      className="w-8 h-8 rounded-full bg-slate-50 items-center justify-center mr-2"
                    >
                      <Edit3 size={16} color="#64748B" />
                    </Pressable>
                    <Pressable 
                      onPress={() => handleDelete(addr.id)}
                      className="w-8 h-8 rounded-full bg-red-50 items-center justify-center"
                    >
                      <Trash2 size={16} color="#EF4444" />
                    </Pressable>
                  </View>
                </View>

                <View className="mt-4 pt-4 border-t border-slate-50">
                  <Text className="text-[14px] font-inter-bold text-slate-800">{addr.receiverName}</Text>
                  <Text className="text-[13px] font-inter text-slate-500 mt-1">{addr.receiverPhone}</Text>
                  <Text className="text-[13px] font-inter text-slate-600 mt-2 leading-5">
                    {[
                      addr.streetAddress,
                      addr.ward,
                      addr.district && addr.district.toLowerCase() !== addr.city?.toLowerCase() ? addr.district : null,
                      addr.city
                    ].filter(Boolean).join(', ')}
                  </Text>
                </View>

                {!addr.isDefault && (
                  <Pressable 
                    onPress={() => handleSetDefault(addr.id)}
                    disabled={settingDefaultId != null}
                    className="mt-4 py-2.5 rounded-xl border border-slate-200 items-center active:bg-slate-50"
                  >
                    {settingDefaultId === addr.id ? (
                      <ActivityIndicator size="small" color="#16A34A" />
                    ) : (
                      <Text className="text-[12px] font-inter-bold text-slate-600">Thiết lập mặc định</Text>
                    )}
                  </Pressable>
                )}
              </Card>
            );
          })
        ) : (
          <View className="py-20 items-center">
            <View className="w-20 h-20 bg-slate-100 rounded-full items-center justify-center mb-4">
              <Navigation size={32} color="#CBD5E1" />
            </View>
            <Text className="text-lg font-outfit-bold text-slate-900">Chưa có địa chỉ nào</Text>
            <Text className="text-sm font-inter text-slate-400 text-center mt-2 px-10">
              Hãy thêm địa chỉ giao hàng để thuận tiện hơn khi mua sắm.
            </Text>
            <Pressable 
              onPress={() => router.push({ pathname: '/(customer)/profile/addresses/form', params: { mode: 'ADD' } } as any)}
              className="mt-8 px-8 py-3 bg-primary rounded-2xl"
            >
              <Text className="text-white font-inter-bold">Thêm địa chỉ ngay</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
