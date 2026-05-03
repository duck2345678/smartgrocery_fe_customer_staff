import React from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import Card from '../../src/components/ui/Card';
import Button from '../../src/components/ui/Button';
import Skeleton from '../../src/components/ui/Skeleton';
import { staffIssuesApi } from '../../src/api/staffIssues';

const formatTime = (iso: string) => {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '';
  return new Date(t).toLocaleString('vi-VN');
};

const getIssueOrderLabel = (issue: {
  orderId: number;
  orderNumber: string | null;
  orderCode: string | null;
  details: unknown;
}) => {
  if (issue.orderNumber) return issue.orderNumber;
  if (issue.orderCode) return issue.orderCode;
  if (issue.details && typeof issue.details === 'object') {
    const details = issue.details as Record<string, unknown>;
    const raw = details.orderNumber ?? details.orderCode;
    if (typeof raw === 'string' && raw.trim().length > 0) return raw.trim();
  }
  return `ID nội bộ #${issue.orderId}`;
};

export default function StaffIssuesScreen() {
  const router = useRouter();

  const listQuery = useQuery({
    queryKey: ['staff-issues-my'],
    queryFn: () => staffIssuesApi.my(),
    staleTime: 5000,
  });

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Stack.Screen options={{ title: 'Sự cố', headerShown: true }} />

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Card className="p-4">
          <View className="flex-row items-center justify-between">
            <Text className="font-outfit-bold text-text">Hộp thư sự cố</Text>
            <View className="flex-row" style={{ gap: 10 }}>
              <Button label="Làm mới" variant="outline" onPress={() => void listQuery.refetch()} />
              <Button label="Đóng" variant="ghost" onPress={() => router.back()} />
            </View>
          </View>
          <Text className="text-xs font-inter text-muted mt-1">
            Danh sách sự cố do bạn báo. Phase sau sẽ có “Admin quyết định”.
          </Text>
        </Card>

        {listQuery.isLoading ? (
          <>
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
          </>
        ) : listQuery.isError ? (
          <Card className="p-4">
            <Text className="text-sm font-inter text-muted">Không tải được danh sách sự cố.</Text>
            <View className="mt-3">
              <Button label="Thử lại" onPress={() => void listQuery.refetch()} />
            </View>
          </Card>
        ) : (listQuery.data ?? []).length === 0 ? (
          <Card className="p-4">
            <Text className="text-sm font-inter text-muted">Chưa có sự cố nào.</Text>
          </Card>
        ) : (
          (listQuery.data ?? []).map((it) => (
            <Pressable
              key={it.id}
              onPress={() => {
                const orderLabel = getIssueOrderLabel(it);
                Alert.alert(
                  'Sự cố',
                  `Đơn: ${orderLabel}\nLoại: ${it.issueType}\n\n${JSON.stringify(it.details ?? {}, null, 2)}`,
                  [{ text: 'Đóng' }]
                );
              }}
            >
              <Card className="p-4 border border-rose-200 bg-rose-50">
                <Text className="font-inter-bold text-text">{it.issueType}</Text>
                <Text className="text-xs font-inter text-muted mt-1">Đơn: {getIssueOrderLabel(it)}</Text>
                <Text className="text-[11px] font-inter text-muted mt-2">
                  {formatTime(it.createdAt)} • {it.status}
                </Text>
              </Card>
            </Pressable>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
