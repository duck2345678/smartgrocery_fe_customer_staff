import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import Card from '../../src/components/ui/Card';
import Button from '../../src/components/ui/Button';
import { useAuthStore } from '../../src/store/authStore';
import { listPendingProofUploads, removePendingProofUpload } from '../../src/utils/pendingUploads';
import { fileApi } from '../../src/api/file';
import { fulfillmentApi } from '../../src/api/fulfillment';
import { AssignmentStatus } from '../../src/types/fulfillment';
import { unregisterDeviceForPush } from '../../src/notifications/push';

export default function StaffSettingsScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const [acceptOrders, setAcceptOrders] = useState(true);
  const [slaSound, setSlaSound] = useState(true);
  const [pendingProofCount, setPendingProofCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  const shiftLabel = useMemo(() => 'Ca sáng', []);

  const refreshPending = useCallback(async () => {
    const list = await listPendingProofUploads();
    setPendingProofCount(list.length);
  }, []);

  useEffect(() => {
    void refreshPending();
  }, [refreshPending]);

  const syncPendingUploads = useCallback(async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const list = await listPendingProofUploads();
      if (!list.length) {
        Alert.alert('Thông báo', 'Không có tệp nào đang chờ tải lên.', [{ text: 'Đóng' }]);
        return;
      }

      let ok = 0;
      for (const item of list) {
        try {
          const { url } = await fileApi.upload(item.fileUri);
          await fulfillmentApi.updateAssignmentStatus(item.assignmentId, AssignmentStatus.COMPLETED, url);
          await removePendingProofUpload(item.assignmentId);
          ok += 1;
        } catch {
          continue;
        }
      }
      await refreshPending();
      Alert.alert('Đồng bộ', `Đã đồng bộ ${ok}/${list.length} tệp.`, [{ text: 'Đóng' }]);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, refreshPending]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Stack.Screen options={{ title: 'Cài đặt', headerShown: true }} />

      <View className="p-4 gap-y-3">
        <Card className="p-4">
          <Text className="font-outfit-bold text-text">Hồ sơ</Text>
          <Text className="text-xs font-inter text-muted mt-1">{user?.fullName}</Text>
          <Text className="text-xs font-inter text-muted mt-1">{user?.email}</Text>
          <View className="mt-3">
            <Button label="Xem hồ sơ" variant="outline" onPress={() => router.push('/(staff)/profile' as never)} />
          </View>
        </Card>

        <Card className="p-4">
          <Text className="font-outfit-bold text-text">Tuỳ chọn công việc</Text>
          <Text className="text-xs font-inter text-muted mt-1">Ca làm việc hiện tại: {shiftLabel}</Text>

          <View className="mt-3 flex-row" style={{ gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Button
                label={acceptOrders ? 'Đang nhận đơn' : 'Tạm dừng nhận'}
                variant={acceptOrders ? 'solid' : 'outline'}
                onPress={() => setAcceptOrders((v) => !v)}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                label={slaSound ? 'SLA: bật âm' : 'SLA: tắt âm'}
                variant={slaSound ? 'solid' : 'outline'}
                onPress={() => setSlaSound((v) => !v)}
              />
            </View>
          </View>
        </Card>

        <Card className="p-4">
          <Text className="font-outfit-bold text-text">Thiết bị</Text>
          <Text className="text-xs font-inter text-muted mt-1">Kiểm tra máy quét mã vạch trước khi vào ca.</Text>
          <View className="mt-3">
            <Button label="Kiểm tra máy quét" onPress={() => router.push('/(staff)/scanner-test' as never)} />
          </View>
        </Card>

        <Card className="p-4">
          <Text className="font-outfit-bold text-text">Hàng chờ offline</Text>
          <Text className="text-xs font-inter text-muted mt-1">Ảnh bằng chứng đang chờ tải lên: {pendingProofCount}</Text>
          <View className="mt-3 flex-row" style={{ gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Button label="Làm mới" variant="outline" onPress={() => void refreshPending()} />
            </View>
            <View style={{ flex: 1 }}>
              <Button label={isSyncing ? 'Đang đồng bộ…' : 'Đồng bộ ngay'} onPress={() => void syncPendingUploads()} loading={isSyncing} />
            </View>
          </View>
        </Card>

        <Card className="p-4 border border-border bg-surface">
          <Text className="font-outfit-bold text-text">Phiên đăng nhập</Text>
          <View className="mt-3">
            <Button
              label="Đăng xuất"
              variant="outline"
              onPress={async () => {
                await unregisterDeviceForPush();
                logout();
              }}
            />
          </View>
        </Card>
      </View>
    </SafeAreaView>
  );
}
