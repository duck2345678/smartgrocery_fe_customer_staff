import { useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Bell, MapPin, ClipboardList, Home, Briefcase, Plus, CheckCircle2, X } from 'lucide-react-native';
import Card from '../../ui/Card';
import { useAuthStore } from '../../../store/authStore';
import { useAddresses } from '../../../hooks/useAddresses';
import { useAddressStore } from '../../../store/addressStore';
import Skeleton from '../../ui/Skeleton';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { notificationsApi } from '../../../api/notifications';


export default function HomeHeader() {
  const router = useRouter();
  const userId = useAuthStore((s) => s.user?.id);
  const { addresses, isLoading, isError, refetch } = useAddresses(userId);
  const selectedAddressId = useAddressStore((s) => s.selectedAddressId);
  const setSelectedAddressId = useAddressStore((s) => s.setSelectedAddressId);

  // Unread notifications count query
  const notificationsQuery = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationsApi.list,
    refetchInterval: 15000,
    enabled: !!userId,
  });
  const unreadCount = notificationsQuery.data?.filter(n => !n.isRead).length || 0;

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
              onPress={() => router.push('/(customer)/notifications' as any)}
              style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1, position: 'relative' }}
              hitSlop={8}
            >
              <Bell size={20} color="#0F172A" />
              {unreadCount > 0 && (
                <View className="absolute top-1.5 right-1.5 bg-red-500 min-w-[14px] h-[14px] rounded-full items-center justify-center px-1 border border-white">
                  <Text className="text-[8px] font-inter-bold text-white text-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              )}
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

      {/* Address picker modal (Bottom Sheet Style) */}
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View className="flex-1 justify-end bg-black/50">
          <Pressable className="flex-1" onPress={() => setOpen(false)} />
          
          <View className="bg-white rounded-t-[40px] px-6 pt-2 pb-10 shadow-2xl">
            {/* Handle Bar */}
            <View className="items-center mb-6">
              <View className="w-12 h-1.5 bg-slate-200 rounded-full" />
            </View>

            <View className="flex-row items-center justify-between mb-6">
              <View>
                <Text className="text-[22px] font-outfit-bold text-text">Giao hàng đến đâu?</Text>
                <Text className="text-sm font-inter text-muted mt-0.5">Chọn địa chỉ để xem hàng hóa gần bạn.</Text>
              </View>
              <Pressable onPress={() => setOpen(false)} className="w-10 h-10 rounded-full bg-slate-50 items-center justify-center">
                <X size={20} color="#64748B" />
              </Pressable>
            </View>

            <View>
              {isLoading ? (
                <View className="gap-y-4">
                  <Skeleton className="h-20 w-full rounded-[24px]" />
                  <Skeleton className="h-20 w-full rounded-[24px]" />
                </View>
              ) : isError ? (
                <View className="items-center py-8">
                  <Text className="text-sm font-inter text-muted">Không tải được địa chỉ.</Text>
                  <Pressable
                    onPress={() => void refetch()}
                    className="mt-4 px-6 py-3 rounded-2xl bg-primary"
                  >
                    <Text className="text-white font-inter-bold">Thử lại</Text>
                  </Pressable>
                </View>
              ) : addresses.length === 0 ? (
                <View className="items-center py-8 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                  <MapPin size={32} color="#CBD5E1" />
                  <Text className="text-sm font-inter text-muted mt-2">Bạn chưa có địa chỉ lưu sẵn.</Text>
                </View>
              ) : (
                <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
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
                          <View 
                            className={`p-4 rounded-[24px] border-2 flex-row items-center ${
                              active ? 'border-primary bg-primary/5' : 'border-slate-50 bg-slate-50'
                            }`}
                          >
                            <View className={`w-12 h-12 rounded-2xl items-center justify-center ${
                              active ? 'bg-primary' : 'bg-white'
                            }`}>
                              {a.addressType === 'OFFICE' ? (
                                <Briefcase size={22} color={active ? '#FFF' : '#64748B'} />
                              ) : a.addressType === 'HOME' ? (
                                <Home size={22} color={active ? '#FFF' : '#64748B'} />
                              ) : (
                                <MapPin size={22} color={active ? '#FFF' : '#64748B'} />
                              )}
                            </View>

                            <View className="flex-1 mx-4">
                              <View className="flex-row items-center">
                                <Text className="text-base font-inter-bold text-text">
                                  {a.addressType === 'HOME' ? 'Nhà riêng' : a.addressType === 'OFFICE' ? 'Văn phòng' : 'Khác'}
                                </Text>
                                {a.isDefault && (
                                  <View className="ml-2 px-2 py-0.5 bg-primary/10 rounded-md">
                                    <Text className="text-[10px] font-inter-bold text-primary">MẶC ĐỊNH</Text>
                                  </View>
                                )}
                              </View>
                              <Text className="text-xs font-inter text-muted mt-1" numberOfLines={2}>
                                {[
                                  a.streetAddress,
                                  a.ward,
                                  a.district && a.district.toLowerCase() !== a.city?.toLowerCase() ? a.district : null,
                                  a.city
                                ].filter(Boolean).join(', ')}
                              </Text>
                              <Text className="text-[11px] font-inter-bold text-slate-400 mt-1">
                                {a.receiverName} • {a.receiverPhone}
                              </Text>
                            </View>

                            <View className="w-6 h-6 rounded-full border-2 border-slate-200 items-center justify-center">
                              {active && <CheckCircle2 size={24} color="#16A34A" fill="#FFFFFF" />}
                            </View>
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                </ScrollView>
              )}
            </View>

            <Pressable 
              onPress={() => {
                setOpen(false);
                router.push({ pathname: '/(customer)/profile/addresses/form', params: { mode: 'ADD' } } as any);
              }} 
              className="mt-6 flex-row items-center justify-center bg-slate-900 h-14 rounded-2xl shadow-lg"
            >
              <Plus size={20} color="#FFFFFF" className="mr-2" />
              <Text className="text-white font-inter-bold ml-2">Thêm địa chỉ mới</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}
