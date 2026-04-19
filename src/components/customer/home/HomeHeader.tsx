import { useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Bell, ChevronDown, MapPin } from 'lucide-react-native';
import CartButton from '../CartButton';
import Card from '../../ui/Card';
import { useAuthStore } from '../../../store/authStore';
import { useAddresses } from '../../../hooks/useAddresses';
import { useAddressStore } from '../../../store/addressStore';
import Skeleton from '../../ui/Skeleton';

export default function HomeHeader() {
  const userId = useAuthStore((s) => s.user?.id);
  const { addresses, isLoading, isError, refetch } = useAddresses(userId);
  const selectedAddressId = useAddressStore((s) => s.selectedAddressId);
  const setSelectedAddressId = useAddressStore((s) => s.setSelectedAddressId);
  const [open, setOpen] = useState(false);

  const activeAddress = useMemo(() => {
    if (!addresses.length) return null;
    const bySelected = selectedAddressId ? addresses.find((a) => a.id === selectedAddressId) : undefined;
    return bySelected ?? addresses.find((a) => a.isDefault) ?? addresses[0];
  }, [addresses, selectedAddressId]);

  const addressLine = activeAddress
    ? `${activeAddress.streetAddress}, ${activeAddress.ward}, ${activeAddress.district}`
    : 'Chọn địa chỉ giao hàng';

  return (
    <>
      <View className="px-6 pt-6 pb-3 flex-row items-center justify-between">
        <Pressable
          onPress={() => setOpen(true)}
          className="flex-1 mr-3"
          hitSlop={10}
        >
          <View className="flex-row items-center">
            <MapPin size={16} color="#22C55E" />
            <Text className="ml-2 text-xs font-inter-bold text-slate-500">Giao đến</Text>
            <ChevronDown size={14} color="#94A3B8" style={{ marginLeft: 6 }} />
          </View>
          {isLoading ? (
            <View className="mt-2">
              <Skeleton className="h-4 w-52 rounded-lg" />
            </View>
          ) : (
            <Text className="mt-1 text-base font-outfit-bold text-slate-900" numberOfLines={1}>
              {addressLine}
            </Text>
          )}
        </Pressable>

        <View className="flex-row items-center gap-x-2">
          <Pressable
            onPress={() => Alert.alert('Thông báo', 'Tính năng đang được phát triển.')}
            className="w-10 h-10 rounded-full bg-white border border-slate-200 items-center justify-center"
            hitSlop={10}
          >
            <Bell size={20} color="#0F172A" />
          </Pressable>
          <CartButton />
        </View>
      </View>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable className="flex-1 bg-black/30" onPress={() => setOpen(false)} />
        <View className="bg-white rounded-t-3xl p-6">
          <Text className="text-lg font-outfit-bold text-slate-900">Chọn địa chỉ</Text>
          <Text className="text-xs font-inter text-slate-500 mt-1">Địa chỉ sẽ được dùng khi thanh toán.</Text>

          <View className="mt-4">
            {isLoading ? (
              <View className="gap-y-3">
                <Skeleton className="h-14 w-full rounded-2xl" />
                <Skeleton className="h-14 w-full rounded-2xl" />
              </View>
            ) : isError ? (
              <View className="items-start">
                <Text className="text-sm font-inter text-slate-600">Không tải được địa chỉ.</Text>
                <Pressable
                  onPress={() => void refetch()}
                  className="mt-3 px-4 py-3 rounded-2xl bg-slate-100"
                >
                  <Text className="text-sm font-inter-bold text-slate-800">Thử lại</Text>
                </Pressable>
              </View>
            ) : addresses.length === 0 ? (
              <Text className="text-sm font-inter text-slate-600">Chưa có địa chỉ.</Text>
            ) : (
              <ScrollView style={{ maxHeight: 320 }}>
                <View className="gap-y-3">
                  {addresses.map((a) => {
                    const active = activeAddress?.id === a.id;
                    return (
                      <Pressable
                        key={a.id}
                        onPress={() => {
                          setSelectedAddressId(a.id);
                          setOpen(false);
                        }}
                      >
                        <Card className={`p-4 border ${active ? 'border-emerald-200 bg-emerald-50' : 'border-slate-100 bg-white'}`}>
                          <Text className="text-sm font-inter-bold text-slate-900" numberOfLines={1}>
                            {a.receiverName} • {a.receiverPhone}
                          </Text>
                          <Text className="text-xs font-inter text-slate-500 mt-1">
                            {a.streetAddress}, {a.ward}, {a.district}, {a.city}
                          </Text>
                        </Card>
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>
            )}
          </View>

          <Pressable onPress={() => setOpen(false)} className="mt-5 px-4 py-3 rounded-2xl bg-slate-100 items-center">
            <Text className="text-sm font-inter-bold text-slate-800">Đóng</Text>
          </Pressable>
        </View>
      </Modal>
    </>
  );
}

