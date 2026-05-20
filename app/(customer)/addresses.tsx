import { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import { Stack } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../src/store/authStore';
import { useAddressStore } from '../../src/store/addressStore';
import { userApi, type CreateAddressRequest } from '../../src/api/users';
import { type UserAddress } from '../../src/types/address';

type AddressForm = {
  receiverName: string;
  receiverPhone: string;
  streetAddress: string;
  ward: string;
  district: string;
  city: string;
  addressType: string;
  isDefault: boolean;
};

const emptyForm = (): AddressForm => ({
  receiverName: '',
  receiverPhone: '',
  streetAddress: '',
  ward: '',
  district: '',
  city: '',
  addressType: 'Nhà',
  isDefault: false,
});

const fromAddress = (a: UserAddress): AddressForm => ({
  receiverName: a.receiverName,
  receiverPhone: a.receiverPhone,
  streetAddress: a.streetAddress,
  ward: a.ward,
  district: a.district,
  city: a.city,
  addressType: a.addressType ?? 'Nhà',
  isDefault: a.isDefault,
});

const isFormValid = (f: AddressForm) =>
  f.receiverName.trim() &&
  f.receiverPhone.trim() &&
  f.streetAddress.trim() &&
  f.ward.trim() &&
  f.district.trim() &&
  f.city.trim() &&
  f.addressType.trim();

export default function AddressesScreen() {
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  const selectedAddressId = useAddressStore((s) => s.selectedAddressId);
  const setSelectedAddressId = useAddressStore((s) => s.setSelectedAddressId);

  const [modal, setModal] = useState<{ mode: 'add' | 'edit'; address?: UserAddress } | null>(null);
  const [form, setForm] = useState<AddressForm>(emptyForm());

  const openAdd = useCallback(() => {
    setForm(emptyForm());
    setModal({ mode: 'add' });
  }, []);

  const openEdit = useCallback((address: UserAddress) => {
    setForm(fromAddress(address));
    setModal({ mode: 'edit', address });
  }, []);

  const closeModal = useCallback(() => {
    setModal(null);
  }, []);

  const setField = useCallback(<K extends keyof AddressForm>(key: K, value: AddressForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const addressesQuery = useQuery({
    queryKey: ['addresses', userId],
    queryFn: () => userApi.getUserAddresses(userId as number),
    enabled: typeof userId === 'number' && userId > 0,
    staleTime: 2 * 60 * 1000,
  });

  const invalidateAddresses = useCallback(() => {
    void qc.invalidateQueries({ queryKey: ['addresses', userId] });
  }, [qc, userId]);

  const createMutation = useMutation({
    mutationFn: (data: CreateAddressRequest) => userApi.createAddress(userId as number, data),
    onSuccess: (newAddr) => {
      invalidateAddresses();
      setSelectedAddressId(newAddr.id);
      closeModal();
    },
    onError: (e) => {
      Alert.alert('Lỗi', e instanceof Error ? e.message : 'Không thể thêm địa chỉ.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ addressId, data }: { addressId: number; data: CreateAddressRequest }) =>
      userApi.updateAddress(userId as number, addressId, data),
    onSuccess: () => {
      invalidateAddresses();
      closeModal();
    },
    onError: (e) => {
      Alert.alert('Lỗi', e instanceof Error ? e.message : 'Không thể cập nhật địa chỉ.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (addressId: number) => userApi.deleteAddress(userId as number, addressId),
    onSuccess: (_, addressId) => {
      if (selectedAddressId === addressId) setSelectedAddressId(null);
      invalidateAddresses();
    },
    onError: (e) => {
      Alert.alert('Lỗi', e instanceof Error ? e.message : 'Không thể xóa địa chỉ.');
    },
  });

  const handleSave = () => {
    if (!isFormValid(form)) {
      Alert.alert('Thiếu thông tin', 'Vui lòng điền đầy đủ tất cả các trường bắt buộc.');
      return;
    }
    const data: CreateAddressRequest = {
      receiverName: form.receiverName.trim(),
      receiverPhone: form.receiverPhone.trim(),
      streetAddress: form.streetAddress.trim(),
      ward: form.ward.trim(),
      district: form.district.trim(),
      city: form.city.trim(),
      addressType: form.addressType.trim(),
      isDefault: form.isDefault,
    };
    if (modal?.mode === 'edit' && modal.address) {
      updateMutation.mutate({ addressId: modal.address.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (address: UserAddress) => {
    Alert.alert(
      'Xóa địa chỉ',
      `Bạn có chắc muốn xóa địa chỉ "${address.receiverName}" không?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(address.id),
        },
      ],
    );
  };

  const addresses = addressesQuery.data ?? [];
  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: true, title: 'Địa chỉ giao hàng' }} />

      {addressesQuery.isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#22C55E" />
        </View>
      ) : addressesQuery.isError ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-muted font-inter text-center">Không tải được địa chỉ. Vui lòng thử lại.</Text>
          <Pressable
            onPress={() => void addressesQuery.refetch()}
            className="mt-4 px-6 py-3 rounded-2xl bg-primary"
          >
            <Text className="font-outfit-bold text-primary-fg">Thử lại</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Nút thêm địa chỉ */}
          <Pressable
            onPress={openAdd}
            className="mb-4 px-4 py-4 rounded-2xl border-2 border-dashed border-primary items-center"
          >
            <Text className="font-outfit-bold text-primary">+ Thêm địa chỉ mới</Text>
          </Pressable>

          {addresses.length === 0 ? (
            <View className="items-center py-16">
              <Text className="text-muted font-inter text-center">
                Bạn chưa có địa chỉ nào.{'\n'}Nhấn nút trên để thêm địa chỉ đầu tiên.
              </Text>
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              {addresses.map((address) => {
                const isSelected = selectedAddressId === address.id;
                return (
                  <Pressable
                    key={address.id}
                    onPress={() => setSelectedAddressId(address.id)}
                    style={{
                      borderRadius: 16,
                      borderWidth: isSelected ? 2 : 1,
                      borderColor: isSelected ? '#22c55e' : '#e2e8f0',
                      backgroundColor: isSelected ? '#f0fdf4' : '#ffffff',
                      padding: 16,
                    }}
                  >
                    {/* Header */}
                    <View className="flex-row items-start justify-between mb-2">
                      <View style={{ flex: 1 }}>
                        <View className="flex-row items-center" style={{ gap: 8 }}>
                          <Text className="font-outfit-bold text-text">{address.receiverName}</Text>
                          {address.isDefault ? (
                            <View
                              style={{
                                paddingHorizontal: 8,
                                paddingVertical: 2,
                                borderRadius: 99,
                                backgroundColor: '#dcfce7',
                              }}
                            >
                              <Text style={{ fontSize: 10, fontWeight: '700', color: '#15803d' }}>
                                Mặc định
                              </Text>
                            </View>
                          ) : null}
                        </View>
                        <Text className="text-xs font-inter text-muted mt-0.5">
                          {address.receiverPhone}
                        </Text>
                      </View>
                      {isSelected ? (
                        <View
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 11,
                            backgroundColor: '#22c55e',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>✓</Text>
                        </View>
                      ) : null}
                    </View>

                    {/* Địa chỉ */}
                    <Text className="text-sm font-inter text-text">
                      {address.streetAddress}, {address.ward}, {address.district}, {address.city}
                    </Text>
                    <Text className="text-xs font-inter text-muted mt-1">
                      {address.addressType ?? 'Địa chỉ'}
                    </Text>

                    {/* Actions */}
                    <View className="flex-row mt-3" style={{ gap: 8 }}>
                      <Pressable
                        onPress={() => openEdit(address)}
                        className="flex-1 py-2 rounded-xl bg-surface border border-border items-center"
                      >
                        <Text className="text-xs font-inter-bold text-text">Chỉnh sửa</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => handleDelete(address)}
                        disabled={deleteMutation.isPending}
                        className="flex-1 py-2 rounded-xl items-center"
                        style={{ backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca' }}
                      >
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#dc2626' }}>Xóa</Text>
                      </Pressable>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}

      {/* Modal thêm/sửa địa chỉ */}
      <Modal
        visible={!!modal}
        animationType="slide"
        transparent
        onRequestClose={closeModal}
      >
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <View
            className="bg-background"
            style={{ borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%' }}
          >
            {/* Modal header */}
            <View
              className="flex-row items-center justify-between border-b border-border"
              style={{ padding: 16 }}
            >
              <Text className="font-outfit-bold text-text text-base">
                {modal?.mode === 'edit' ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ mới'}
              </Text>
              <Pressable onPress={closeModal}>
                <Text className="font-inter text-muted">Đóng</Text>
              </Pressable>
            </View>

            <ScrollView
              contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <FormField
                label="Tên người nhận *"
                value={form.receiverName}
                onChangeText={(v) => setField('receiverName', v)}
                placeholder="Nguyễn Văn A"
                autoCapitalize="words"
              />
              <FormField
                label="Số điện thoại *"
                value={form.receiverPhone}
                onChangeText={(v) => setField('receiverPhone', v)}
                placeholder="0901234567"
                keyboardType="phone-pad"
              />
              <FormField
                label="Địa chỉ cụ thể *"
                value={form.streetAddress}
                onChangeText={(v) => setField('streetAddress', v)}
                placeholder="123 Nguyễn Huệ"
              />
              <FormField
                label="Phường/Xã *"
                value={form.ward}
                onChangeText={(v) => setField('ward', v)}
                placeholder="Phường Bến Nghé"
              />
              <FormField
                label="Quận/Huyện *"
                value={form.district}
                onChangeText={(v) => setField('district', v)}
                placeholder="Quận 1"
              />
              <FormField
                label="Tỉnh/Thành phố *"
                value={form.city}
                onChangeText={(v) => setField('city', v)}
                placeholder="TP. Hồ Chí Minh"
              />
              <FormField
                label="Loại địa chỉ *"
                value={form.addressType}
                onChangeText={(v) => setField('addressType', v)}
                placeholder="Nhà, Công ty..."
              />

              {/* Toggle mặc định */}
              <View className="flex-row items-center justify-between mt-2 mb-5">
                <Text className="font-inter text-text">Đặt làm địa chỉ mặc định</Text>
                <Switch
                  value={form.isDefault}
                  onValueChange={(v) => setField('isDefault', v)}
                  trackColor={{ true: '#22c55e', false: '#e2e8f0' }}
                  thumbColor="#ffffff"
                />
              </View>

              {/* Nút lưu */}
              <Pressable
                onPress={handleSave}
                disabled={isSaving}
                style={{
                  paddingVertical: 16,
                  borderRadius: 16,
                  alignItems: 'center',
                  backgroundColor: isSaving ? '#e2e8f0' : '#22c55e',
                }}
              >
                {isSaving ? (
                  <ActivityIndicator color="#22c55e" />
                ) : (
                  <Text style={{ fontWeight: '700', fontSize: 16, color: '#ffffff' }}>
                    {modal?.mode === 'edit' ? 'Lưu thay đổi' : 'Thêm địa chỉ'}
                  </Text>
                )}
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'phone-pad' | 'email-address';
  autoCapitalize?: 'none' | 'words' | 'sentences';
}) {
  return (
    <View className="mb-4">
      <Text className="text-xs font-inter-bold text-muted uppercase mb-1.5">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        keyboardType={keyboardType ?? 'default'}
        autoCapitalize={autoCapitalize ?? 'sentences'}
        className="bg-surface border border-border rounded-2xl px-4 font-inter text-text"
        style={{ paddingVertical: 11, fontSize: 15 }}
      />
    </View>
  );
}
