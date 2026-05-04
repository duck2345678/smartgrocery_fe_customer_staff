import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import Card from '../../../src/components/ui/Card';
import { useStaffHomeStore } from '../../../src/store/staffHomeStore';

export default function StaffHandbookScreen() {
  const router = useRouter();
  const handbookOpenCategoryIds = useStaffHomeStore((s) => s.handbookOpenCategoryIds);
  const toggleHandbookCategory = useStaffHomeStore((s) => s.toggleHandbookCategory);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: false }} />

      <View className="px-4 pt-4 pb-2 flex-row items-center">
        <Pressable onPress={() => router.back()} className="w-10 h-10 rounded-2xl bg-surface border border-border items-center justify-center mr-3">
          <ChevronLeft size={20} color="#0F172A" />
        </Pressable>
        <View>
          <Text className="text-xl font-outfit-bold text-text">Sổ tay công việc</Text>
          <Text className="text-xs font-inter text-muted mt-0.5">Hướng dẫn nhanh theo từng nhóm tác vụ.</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        <Card className="p-4">
          <HandbookCategory
            id="getting-started"
            title="Bắt đầu"
            isOpen={handbookOpenCategoryIds.includes('getting-started')}
            onToggle={() => toggleHandbookCategory('getting-started')}
            items={[
              'Đăng nhập bằng tài khoản được cấp.',
              'Kiểm tra 5 tab: Trang chủ, Sản phẩm, Đơn hàng, Chấm công, Cá nhân.',
              'Nếu không tải được dữ liệu: kiểm tra mạng và bấm Tải lại.',
            ]}
          />
          <Divider />
          <HandbookCategory
            id="orders"
            title="Đơn hàng"
            isOpen={handbookOpenCategoryIds.includes('orders')}
            onToggle={() => toggleHandbookCategory('orders')}
            items={[
              'Vào tab Đơn hàng để xem hàng chờ và đơn đang xử lý.',
              'Nhận đơn từ hàng chờ, sau đó mở chi tiết để xem danh sách mặt hàng.',
              'Hoàn tất đơn: kiểm tra đủ số lượng, tránh nhầm SKU và kệ.',
            ]}
          />
          <Divider />
          <HandbookCategory
            id="products"
            title="Sản phẩm"
            isOpen={handbookOpenCategoryIds.includes('products')}
            onToggle={() => toggleHandbookCategory('products')}
            items={[
              'Dùng ô tìm kiếm để tra cứu nhanh theo tên.',
              'Lọc theo danh mục để giảm nhiễu khi danh sách dài.',
              'Mở chi tiết để xem giá và tồn kho hiện tại.',
            ]}
          />
          <Divider />
          <HandbookCategory
            id="attendance"
            title="Chấm công"
            isOpen={handbookOpenCategoryIds.includes('attendance')}
            onToggle={() => toggleHandbookCategory('attendance')}
            items={[
              'Vào ca khi bắt đầu làm việc.',
              'Ra ca khi kết thúc ca.',
              'Ghi chú tối đa 200 ký tự (không bắt buộc).',
            ]}
          />
          <Divider />
          <HandbookCategory
            id="troubleshooting"
            title="Xử lý sự cố"
            isOpen={handbookOpenCategoryIds.includes('troubleshooting')}
            onToggle={() => toggleHandbookCategory('troubleshooting')}
            items={[
              'Nếu không thấy đơn: thử chuyển qua lại Hàng chờ/Đang xử lý và tải lại.',
              'Nếu API báo lỗi: chụp màn hình và báo quản trị.',
              'Nếu bị đăng xuất: đăng nhập lại và kiểm tra quyền tài khoản.',
            ]}
          />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function Divider() {
  return <View className="h-px bg-border my-3" />;
}

function HandbookCategory({
  id,
  title,
  isOpen,
  onToggle,
  items,
}: {
  id: string;
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  items: string[];
}) {
  return (
    <View>
      <Pressable testID={`handbook-toggle-${id}`} onPress={onToggle} className="flex-row items-center justify-between py-1">
        <Text className="font-inter-bold text-text">{title}</Text>
        <Text className="text-xs font-inter text-muted">{isOpen ? 'Thu gọn' : 'Mở'}</Text>
      </Pressable>
      {isOpen ? (
        <View className="mt-2" style={{ gap: 8 }}>
          {items.map((t, idx) => (
            <View key={`${id}-${idx}`} className="flex-row" style={{ gap: 10 }}>
              <View className="w-6 h-6 rounded-full bg-background border border-border items-center justify-center">
                <Text className="text-[11px] font-inter-bold text-text">{idx + 1}</Text>
              </View>
              <Text className="flex-1 text-sm font-inter text-muted">{t}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
