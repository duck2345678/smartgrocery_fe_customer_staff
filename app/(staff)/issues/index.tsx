import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft } from 'lucide-react-native';
import Card from '../../../src/components/ui/Card';
import { staffIssuesApi, type IssueDto } from '../../../src/api/staffIssues';

export default function StaffIssuesScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<'OPEN' | 'ALL'>('OPEN');

  const issuesQuery = useQuery({
    queryKey: ['staff-issues-my'],
    queryFn: () => staffIssuesApi.my(),
    staleTime: 5000,
  });

  const issues = useMemo(() => {
    const list = issuesQuery.data ?? [];
    if (filter === 'OPEN') {
      return list.filter((x) => (x.status ?? '').toUpperCase() === 'OPEN');
    }
    return list;
  }, [issuesQuery.data, filter]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: false }} />

      <View className="px-4 pt-4 pb-2">
        <View className="flex-row items-center mb-3">
          <Pressable onPress={() => router.back()} className="w-10 h-10 rounded-2xl bg-surface border border-border items-center justify-center mr-3">
            <ChevronLeft size={20} color="#0F172A" />
          </Pressable>
          <View>
            <Text className="text-xl font-outfit-bold text-text">Sự cố</Text>
            <Text className="text-xs font-inter text-muted mt-0.5">Danh sách các sự cố đã báo cáo.</Text>
          </View>
        </View>

        <View className="flex-row" style={{ gap: 10 }}>
          <Pressable
            className={filter === 'OPEN' ? 'flex-1 px-4 py-3 rounded-2xl bg-primary' : 'flex-1 px-4 py-3 rounded-2xl bg-surface border border-border'}
            onPress={() => setFilter('OPEN')}
          >
            <Text className={filter === 'OPEN' ? 'text-center font-outfit-bold text-primary-fg' : 'text-center font-outfit-bold text-text'}>
              Đang mở
            </Text>
          </Pressable>
          <Pressable
            className={filter === 'ALL' ? 'flex-1 px-4 py-3 rounded-2xl bg-primary' : 'flex-1 px-4 py-3 rounded-2xl bg-surface border border-border'}
            onPress={() => setFilter('ALL')}
          >
            <Text className={filter === 'ALL' ? 'text-center font-outfit-bold text-primary-fg' : 'text-center font-outfit-bold text-text'}>
              Tất cả
            </Text>
          </Pressable>
        </View>
      </View>

      <View className="flex-1 px-4 pb-4">
        {issuesQuery.isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator />
            <Text className="text-xs font-inter text-muted mt-2">Đang tải…</Text>
          </View>
        ) : issuesQuery.isError ? (
          <Card className="p-4 mt-4">
            <Text className="font-inter-bold text-text">Không tải được dữ liệu.</Text>
            <Text className="text-xs font-inter text-muted mt-1">Kiểm tra mạng và thử lại.</Text>
            <Pressable
              onPress={() => void issuesQuery.refetch()}
              className="mt-3 px-4 py-3 rounded-2xl bg-primary items-center"
            >
              <Text className="font-outfit-bold text-primary-fg">Tải lại</Text>
            </Pressable>
          </Card>
        ) : issues.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-sm font-inter text-muted">Không có sự cố nào.</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ paddingTop: 10, paddingBottom: 18, gap: 10 }}>
            {issues.map((issue) => (
              <IssueCard key={issue.id} issue={issue} />
            ))}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

function IssueCard({ issue }: { issue: IssueDto }) {
  return (
    <Card className="p-4">
      <View className="flex-row items-start justify-between">
        <View style={{ flex: 1, paddingRight: 10 }}>
          <Text className="font-outfit-bold text-text" numberOfLines={1}>
            Sự cố #{issue.id}
          </Text>
          <Text className="text-xs font-inter text-muted mt-1" numberOfLines={2}>
            Loại: {issue.issueType}
          </Text>
          {issue.orderNumber && (
            <Text className="text-xs font-inter text-muted mt-1">
              Đơn hàng: #{issue.orderNumber}
            </Text>
          )}
          <Text className="text-[10px] font-inter text-muted mt-2">
            {new Date(issue.createdAt).toLocaleString('vi-VN')}
          </Text>
        </View>
        <View className="px-3 py-2 rounded-full bg-surface2 border border-border">
          <Text className="text-xs font-inter-bold text-text">{issue.status}</Text>
        </View>
      </View>
    </Card>
  );
}
