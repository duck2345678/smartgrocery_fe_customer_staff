import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ActivityIndicator, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useAssignmentDetail } from '../../../src/hooks/useAssignmentDetail';
import { OrderTaskType, AssignmentStatus } from '../../../src/types/fulfillment';
import Button from '../../../src/components/ui/Button';
import { ChevronLeft, Info, AlertCircle, CheckCircle2 } from 'lucide-react-native';
import PickingWorkspace from '../../../src/components/staff/PickingWorkspace';
import PackingWorkspace from '../../../src/components/staff/PackingWorkspace';
import { safeNotification, NotificationFeedbackType } from '../../../src/utils/safeHaptics';

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [showSuccess, setShowSuccess] = useState(false);
  const anim = useMemo(() => new Animated.Value(0), []);
  const assignmentId = useMemo(() => {
    const raw = Array.isArray(id) ? id[0] : id;
    const parsed = parseInt(String(raw ?? ''), 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [id]);
  
  const { 
    assignment, 
    items,
    isLoading, 
    isError, 
    updateStatus, 
    isUpdatingStatus,
    incrementItem,
    decrementItem,
    error,
    refetch
  } = useAssignmentDetail(assignmentId);

  useEffect(() => {
    if (!showSuccess) return;
    const t = setTimeout(() => {
      setShowSuccess(false);
      router.replace('/(staff)' as never);
    }, 1400);
    return () => clearTimeout(t);
  }, [anim, router, showSuccess]);

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" color="#2563EB" />
        <Text className="mt-4 text-muted font-inter">Đang tải chi tiết đơn hàng...</Text>
      </View>
    );
  }

  if (assignmentId === 0) {
    return (
      <View className="flex-1 justify-center items-center p-6 bg-background">
        <AlertCircle size={48} color="#DC2626" />
        <Text className="text-xl font-outfit-bold text-text mt-4">Mã đơn không hợp lệ</Text>
        <Button label="Quay lại" variant="outline" onPress={() => router.back()} className="mt-6 w-full" />
      </View>
    );
  }

  if (isError || !assignment) {
    const status = (error as Error & { status?: number } | undefined)?.status;
    const title =
      status === 403
        ? 'Không có quyền truy cập'
        : status === 404
          ? 'Đơn không tồn tại'
          : 'Không tải được dữ liệu';
    const description =
      status === 403
        ? 'Đơn này không thuộc phạm vi công việc của bạn.'
        : status === 404
          ? 'Đơn đã bị xoá hoặc không còn khả dụng.'
          : (error as Error | undefined)?.message ?? 'Vui lòng thử lại.';

    return (
      <View className="flex-1 justify-center items-center p-6 bg-background">
        <AlertCircle size={48} color="#DC2626" />
        <Text className="text-xl font-outfit-bold text-text mt-4">{title}</Text>
        <Text className="text-muted font-inter text-center mt-2">{description}</Text>
        <View className="w-full mt-6 gap-y-3">
          <Button label="Thử lại" variant="outline" onPress={() => refetch()} />
          <Button label="Quay lại" variant="ghost" onPress={() => router.back()} />
        </View>
      </View>
    );
  }
  const handleStartTask = async () => {
    try {
      await updateStatus({ status: AssignmentStatus.IN_PROGRESS });
    } catch (e) {
      console.error('Failed to start task:', e);
    }
  };

  const handleFinishTask = async (status: AssignmentStatus, proofImageUrl: string) => {
    try {
      await updateStatus({ status, proofImageUrl });
      if (status === AssignmentStatus.COMPLETED) {
        setShowSuccess(true);
        void safeNotification(NotificationFeedbackType.Success);
        anim.setValue(0);
        Animated.timing(anim, { toValue: 1, duration: 260, useNativeDriver: true }).start();
      } else {
        router.back();
      }
    } catch (e) {
      console.error('Failed to finish task:', e);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Stack.Screen 
        options={{
          headerShown: true,
          title: `Đơn ${assignment.orderCode}`,
          headerLeft: () => (
            <Button 
              label="" 
              variant="ghost" 
              onPress={() => router.back()} 
              icon={<ChevronLeft size={24} color="#334155" />}
              className="px-0 mr-4"
            />
          ),
          headerStyle: { backgroundColor: '#F8FAFC' },
          headerTitleStyle: { fontFamily: 'Outfit-Bold', fontSize: 18 },
        }}
      />

      {assignment.status === AssignmentStatus.PENDING ? (
        <View className="flex-1 p-6 justify-center">
          <View className="items-center mb-8">
            <Info size={64} color="#2563EB" />
            <Text className="text-2xl font-outfit-bold text-text mt-6 text-center">
              Bắt đầu nhiệm vụ {assignment.taskType}
            </Text>
            <Text className="text-muted font-inter text-center mt-2 px-4">
              Xác nhận bắt đầu để cập nhật trạng thái đơn hàng và mở trình điều khiển.
            </Text>
          </View>

          <View className="bg-surface p-4 rounded-3xl mb-8 border border-border">
            <Text className="text-muted font-inter-bold text-[10px] uppercase mb-2">Thông tin khách hàng</Text>
            <Text className="text-lg font-outfit-bold text-text">{assignment.customerName}</Text>
            <Text className="text-muted font-inter mt-1">{assignment.deliveryAddress}</Text>
          </View>

          <Button 
            label="Bắt đầu soạn hàng" 
            onPress={handleStartTask} 
            loading={isUpdatingStatus}
            hapticVariant="success"
          />
        </View>
      ) : (
        <View className="flex-1">
          {assignment.taskType === OrderTaskType.PICKING ? (
            <PickingWorkspace 
              items={items} 
              onIncrement={incrementItem}
              onDecrement={decrementItem}
              onUpdateStatus={(status: AssignmentStatus) => updateStatus({ status })}
            />
          ) : (
            <PackingWorkspace 
              assignment={assignment} 
              onUpdateStatus={handleFinishTask}
              isUpdating={isUpdatingStatus}
            />
          )}
        </View>
      )}

      {showSuccess ? (
        <View className="absolute inset-0 bg-black/40 items-center justify-center px-8">
          <Animated.View
            style={{
              opacity: anim,
              transform: [
                {
                  scale: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.92, 1],
                  }),
                },
              ],
            }}
            className="bg-surface rounded-3xl w-full p-6 items-center"
          >
            <View className="w-20 h-20 rounded-full bg-emerald-50 items-center justify-center">
              <CheckCircle2 size={44} color="#10B981" />
            </View>
            <Text className="mt-4 text-xl font-outfit-bold text-text text-center">Hoàn tất</Text>
            <Text className="mt-2 text-sm font-inter text-muted text-center">
              Đã đóng gói & bàn giao shipper.
            </Text>
          </Animated.View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}
