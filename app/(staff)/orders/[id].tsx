import React, { useMemo } from 'react';
import { View, Text, SafeAreaView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useAssignmentDetail } from '../../../src/hooks/useAssignmentDetail';
import { OrderTaskType, AssignmentStatus } from '../../../src/types/fulfillment';
import Button from '../../../src/components/ui/Button';
import { ChevronLeft, Info, AlertCircle } from 'lucide-react-native';
import PickingWorkspace from '../../../src/components/staff/PickingWorkspace';
import PackingWorkspace from '../../../src/components/staff/PackingWorkspace';

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
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

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" color="#2563EB" />
        <Text className="mt-4 text-slate-500 font-inter">Đang tải chi tiết đơn hàng...</Text>
      </View>
    );
  }

  if (assignmentId === 0) {
    return (
      <View className="flex-1 justify-center items-center p-6 bg-background">
        <AlertCircle size={48} color="#DC2626" />
        <Text className="text-xl font-outfit-bold text-slate-800 mt-4">Mã đơn không hợp lệ</Text>
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
        <Text className="text-xl font-outfit-bold text-slate-800 mt-4">{title}</Text>
        <Text className="text-slate-500 font-inter text-center mt-2">{description}</Text>
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
        router.replace('/(staff)' as never);
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
          title: `Đơn #${assignment.orderCode}`,
          headerLeft: () => (
            <Button 
              label="" 
              variant="ghost" 
              onPress={() => router.back()} 
              icon={<ChevronLeft size={24} color="#1E293B" />}
              className="px-0 mr-4"
            />
          ),
          headerStyle: { backgroundColor: '#FFFFFF' },
          headerTitleStyle: { fontFamily: 'Outfit-Bold', fontSize: 18 },
        }}
      />

      {assignment.status === AssignmentStatus.PENDING ? (
        <View className="flex-1 p-6 justify-center">
          <View className="items-center mb-8">
            <Info size={64} color="#2563EB" />
            <Text className="text-2xl font-outfit-bold text-slate-900 mt-6 text-center">
              Bắt đầu nhiệm vụ {assignment.taskType}
            </Text>
            <Text className="text-slate-500 font-inter text-center mt-2 px-4">
              Xác nhận bắt đầu để cập nhật trạng thái đơn hàng và mở trình điều khiển.
            </Text>
          </View>

          <View className="bg-slate-50 p-4 rounded-2xl mb-8 border border-slate-100">
            <Text className="text-slate-400 font-inter-bold text-[10px] uppercase mb-2">Thông tin khách hàng</Text>
            <Text className="text-lg font-outfit-bold text-slate-800">{assignment.customerName}</Text>
            <Text className="text-slate-500 font-inter mt-1">{assignment.deliveryAddress}</Text>
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
    </SafeAreaView>
  );
}
