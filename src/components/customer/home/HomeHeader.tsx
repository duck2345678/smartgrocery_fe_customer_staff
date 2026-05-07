import { useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Bell, MapPin, ShoppingCart, ClipboardList } from 'lucide-react-native';
import Card from '../../ui/Card';
import { useAuthStore } from '../../../store/authStore';
import { useAddresses } from '../../../hooks/useAddresses';
import { useAddressStore } from '../../../store/addressStore';
import Skeleton from '../../ui/Skeleton';
import { useRouter } from 'expo-router';
import { useCart } from '../../../hooks/useCart';

export default function HomeHeader() {
  const router = useRouter();
  const userId = useAuthStore((s) => s.user?.id);
  const { addresses, isLoading, isError, refetch } = useAddresses(userId);
  const selectedAddressId = useAddressStore((s) => s.selectedAddressId);
  const setSelectedAddressId = useAddressStore((s) => s.setSelectedAddressId);
  const { count: cartCount } = useCart();
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
      <View style={{ paddingTop: 48, paddingBottom: 8, paddingHorizontal: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Left: address */}
          <Pressable onPress={() => setOpen(true)} style={{ flex: 1, marginRight: 12 }} hitSlop={10}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MapPin size={16} color="#16A34A" />
              <Text style={{ marginLeft: 6, fontSize: 13, fontFamily: 'Inter-Medium', color: '#475569' }}>Giao đến:</Text>
            </View>
            {isLoading ? (
              <View style={{ marginTop: 4 }}>
                <Skeleton className="h-5 w-52 rounded-lg" />
              </View>
            ) : (
              <Text style={{ marginTop: 2, fontSize: 15, fontFamily: 'Outfit-Bold', color: '#0F172A' }} numberOfLines={1}>
                {addressLine}
              </Text>
            )}
          </Pressable>

          {/* Right: notification + cart + orders */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Pressable
              onPress={() => Alert.alert('Thông báo', 'Tính năng đang được phát triển.', [{ text: 'Đóng' }])}
              style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 }}
              hitSlop={8}
            >
              <Bell size={20} color="#0F172A" />
            </Pressable>

            {/* Cart */}
            <Pressable
              onPress={() => router.push('/(customer)/cart' as never)}
              style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 }}
              hitSlop={8}
            >
              <ShoppingCart size={20} color="#0F172A" />
              {cartCount > 0 ? (
                <View style={{ position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, paddingHorizontal: 4, borderRadius: 9, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 10, fontFamily: 'Inter-Bold', color: '#FFFFFF' }}>{cartCount > 99 ? '99+' : String(cartCount)}</Text>
                </View>
              ) : null}
            </Pressable>

            {/* Orders */}
            <Pressable
              onPress={() => router.push('/(customer)/orders' as never)}
              style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 }}
              hitSlop={8}
            >
              <ClipboardList size={20} color="#0F172A" />
            </Pressable>
          </View>
        </View>
      </View>

      {/* Address picker modal */}
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable className="flex-1 bg-black/30" onPress={() => setOpen(false)} />
        <View className="bg-surface rounded-t-3xl p-6">
          <Text className="text-lg font-outfit-bold text-text">Chọn địa chỉ</Text>
          <Text className="text-xs font-inter text-muted mt-1">Địa chỉ sẽ được dùng khi thanh toán.</Text>

          <View className="mt-4">
            {isLoading ? (
              <View className="gap-y-3">
                <Skeleton className="h-14 w-full rounded-2xl" />
                <Skeleton className="h-14 w-full rounded-2xl" />
              </View>
            ) : isError ? (
              <View className="items-start">
                <Text className="text-sm font-inter text-muted">Không tải được địa chỉ.</Text>
                <Pressable
                  onPress={() => void refetch()}
                  className="mt-3 px-4 py-3 rounded-2xl bg-surface border border-border"
                >
                  <Text className="text-sm font-inter-bold text-text">Thử lại</Text>
                </Pressable>
              </View>
            ) : addresses.length === 0 ? (
              <Text className="text-sm font-inter text-muted">Chưa có địa chỉ.</Text>
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
                        <Card className={`p-4 border ${active ? 'border-primary bg-primary/5' : 'border-border bg-surface'}`}>
                          <Text className="text-sm font-inter-bold text-text" numberOfLines={1}>
                            {a.receiverName} • {a.receiverPhone}
                          </Text>
                          <Text className="text-xs font-inter text-muted mt-1">
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

          <Pressable onPress={() => setOpen(false)} className="mt-5 px-4 py-3 rounded-2xl bg-surface border border-border items-center">
            <Text className="text-sm font-inter-bold text-text">Đóng</Text>
          </Pressable>
        </View>
      </Modal>
    </>
  );
}
