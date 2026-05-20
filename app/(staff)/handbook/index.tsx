import React, { useState } from 'react';
import { ScrollView, Text, View, Pressable, LayoutAnimation } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { 
  ChevronLeft,
  BookOpen,
  ClipboardList,
  Clock,
  DollarSign,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  MapPin,
  CheckCircle2,
  Package,
  Barcode,
  Camera,
  Truck
} from 'lucide-react-native';
import Card from '../../../src/components/ui/Card';

type SectionKey = 'flow' | 'attendance' | 'payroll' | 'faq';

export default function StaffHandbookScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<SectionKey>('flow');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]">
      <Stack.Screen options={{ title: 'Sổ tay công việc', headerShown: false }} />

      {/* Header */}
      <View className="px-6 py-4 flex-row items-center border-b border-[#F1F5F9] bg-white">
        <Pressable 
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-slate-50 items-center justify-center border border-slate-100"
        >
          <ChevronLeft size={20} color="#1E293B" />
        </Pressable>
        <View className="ml-4">
          <Text className="text-[18px] font-outfit-bold text-[#1E293B]">Sổ tay công việc</Text>
          <Text className="text-[12px] font-inter text-slate-400 mt-0.5">Hướng dẫn tác nghiệp dành riêng cho Staff</Text>
        </View>
      </View>

      {/* Tab Navigation */}
      <View className="bg-white border-b border-[#F1F5F9] py-2 flex-row justify-around px-4">
        <TabButton 
          icon={ClipboardList} 
          label="Quy trình đơn" 
          active={activeTab === 'flow'} 
          onPress={() => setActiveTab('flow')} 
        />
        <TabButton 
          icon={Clock} 
          label="Ca làm việc" 
          active={activeTab === 'attendance'} 
          onPress={() => setActiveTab('attendance')} 
        />
        <TabButton 
          icon={DollarSign} 
          label="Tính lương" 
          active={activeTab === 'payroll'} 
          onPress={() => setActiveTab('payroll')} 
        />
        <TabButton 
          icon={AlertTriangle} 
          label="Xử lý sự cố" 
          active={activeTab === 'faq'} 
          onPress={() => setActiveTab('faq')} 
        />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        
        {/* Quy trình Đơn Hàng Tab */}
        {activeTab === 'flow' && (
          <View style={{ gap: 16 }}>
            <Text className="text-[13px] font-inter-bold text-[#64748B] uppercase tracking-wider mb-1 ml-1">5 Bước xử lý đơn hàng chuẩn</Text>
            
            <FlowStepCard 
              step={1}
              title="Điểm danh đầu ca (Clock-In)"
              desc="Nhân viên bắt buộc truy cập tab Chấm công và bấm 'Check-in' đầu ca làm việc."
              tip="Nếu không Check-in, hệ thống sẽ tự động chặn không cho bạn nhận bất cứ đơn hàng nào."
              icon={Clock}
              iconBg="#EFF6FF"
              iconColor="#3B82F6"
            />

            <FlowStepCard 
              step={2}
              title="Nhận đơn vào Hàng chờ (Lease Order)"
              desc="Truy cập tab Đơn hàng để xem đơn trong queue. Bấm 'Nhận đơn' để bắt đầu xử lý đơn hàng đó."
              tip="Hệ thống sẽ khóa giữ đơn hàng riêng cho bạn trong 30 phút. Quá thời gian này đơn sẽ bị thu hồi và đưa lại hàng chờ chung."
              icon={Package}
              iconBg="#EEF2FF"
              iconColor="#4F46E5"
            />

            <FlowStepCard 
              step={3}
              title="Soạn hàng & Nhặt hàng (Picking)"
              desc="Theo dõi danh sách cần nhặt, quét mã vạch sản phẩm hoặc tích chọn thủ công. Nhập chính xác số lượng nhặt thực tế."
              tip="Đối với sản phẩm không có mã vạch, bạn có thể nhấp chọn hoàn thành bằng tay trực tiếp trên ứng dụng."
              icon={Barcode}
              iconBg="#ECFDF5"
              iconColor="#10B981"
            />

            <FlowStepCard 
              step={4}
              title="Đóng gói & Chụp ảnh (Packing Proof)"
              desc="Sau khi nhặt đủ hàng, tiến hành đóng gói vào túi/giỏ hàng. Chụp 1 bức ảnh rõ nét của giỏ hàng làm bằng chứng đóng gói để tải lên hệ thống."
              tip="Ngay sau khi tải ảnh, đơn hàng sẽ được chốt số lượng thực tế và tự động chuyển sang trạng thái Sẵn sàng giao (READY_TO_SHIP)."
              icon={Camera}
              iconBg="#FFF7ED"
              iconColor="#EA580C"
            />

            <FlowStepCard 
              step={5}
              title="Vận chuyển & Giao hàng (Delivery Proof)"
              desc="Shipper bấm bắt đầu giao (DELIVERING). Khi giao tới tay khách hàng, chụp thêm 1 ảnh làm bằng chứng giao hàng thành công."
              tip="Bấm xác nhận hoàn tất giao hàng để chuyển trạng thái sang Đã giao (DELIVERED) và ghi nhận hiệu suất hoàn thành đơn của bạn."
              icon={Truck}
              iconBg="#F5F3FF"
              iconColor="#8B5CF6"
            />
          </View>
        )}

        {/* Chấm Công & Ca làm việc Tab */}
        {activeTab === 'attendance' && (
          <View style={{ gap: 16 }}>
            <Text className="text-[13px] font-inter-bold text-[#64748B] uppercase tracking-wider mb-1 ml-1">Lịch ca làm việc tiêu chuẩn</Text>
            
            <Card className="p-5 rounded-[28px] bg-white border border-slate-100 shadow-sm">
              <ShiftRow title="Ca sáng (Ca S)" time="06:00 - 14:30" desc="Thời gian làm việc và giao đơn ca sáng." />
              <View className="h-[1px] bg-[#F8FAFC] my-4" />
              <ShiftRow title="Ca chiều (Ca C)" time="14:30 - 22:30" desc="Thời gian làm việc và giao đơn ca tối." />
              <View className="h-[1px] bg-[#F8FAFC] my-4" />
              <ShiftRow title="Ca gãy (Ca G)" time="Chia theo các block 4 tiếng" desc="Đăng ký lịch linh hoạt phù hợp thời gian cá nhân." />
            </Card>

            <Card className="p-5 rounded-[24px] bg-[#FFF7ED] border border-orange-100">
              <View className="flex-row items-center mb-2">
                <AlertTriangle size={18} color="#EA580C" />
                <Text className="text-[14px] font-inter-bold text-[#C2410C] ml-2">Quy định đi trễ ca</Text>
              </View>
              <Text className="text-[13px] font-inter text-[#C2410C]/80 leading-5">
                Nhân viên Check-in muộn quá 15 phút so với giờ bắt đầu ca sẽ bị tính là đi trễ. 
                Theo quy định, đi trễ sẽ bị khấu trừ 50% lương của toàn bộ ngày làm ca hôm đó. Vui lòng chấm công đúng giờ để bảo toàn quyền lợi.
              </Text>
            </Card>
          </View>
        )}

        {/* Tính Lương Tab */}
        {activeTab === 'payroll' && (
          <View style={{ gap: 16 }}>
            <Text className="text-[13px] font-inter-bold text-[#64748B] uppercase tracking-wider mb-1 ml-1">Công thức tính lương chuẩn</Text>

            <Card className="p-6 rounded-[28px] bg-white border border-slate-100 shadow-sm">
              <Text className="text-[16px] font-outfit-bold text-[#1E293B] mb-4">💰 Lương của Staff / Shippers</Text>
              
              <View className="bg-slate-50 p-4 rounded-2xl mb-4">
                <Text className="text-[11px] font-inter text-slate-400 uppercase tracking-wider">Đơn giá giờ làm ca</Text>
                <Text className="text-[20px] font-outfit-bold text-[#16A34A] mt-1">30.000 đ / giờ</Text>
              </View>

              <View style={{ gap: 10 }}>
                <Text className="text-[13px] font-inter text-slate-500">• Lương cơ bản tính theo số phút làm việc thực tế: (Phút đã làm / 60) × 30.000đ.</Text>
                <Text className="text-[13px] font-inter text-slate-500">• Phạt trễ giờ: Mỗi ngày trễ ca khấu trừ 50% lương ngày công (tương đương trừ 120.000đ).</Text>
                <Text className="text-[13px] font-inter text-slate-500">• Vắng mặt: Không chấm công đồng nghĩa ngày đó không được ghi nhận tính lương.</Text>
              </View>

              <View className="h-[1px] bg-[#F1F5F9] my-5" />

              <Text className="text-[13px] font-inter text-[#64748B] italic">
                * Bạn có thể theo dõi chi tiết bảng tính cộng trừ thực nhận hàng tháng tại mục "Phiếu báo lương" trong tab Cá nhân.
              </Text>
            </Card>
          </View>
        )}

        {/* Xử lý Sự cố Tab */}
        {activeTab === 'faq' && (
          <View style={{ gap: 12 }}>
            <Text className="text-[13px] font-inter-bold text-[#64748B] uppercase tracking-wider mb-2 ml-1">Các câu hỏi thường gặp</Text>

            <FaqItem 
              question="Không quét được mã vạch của sản phẩm thì làm thế nào?"
              answer="Do một số sản phẩm tươi sống hoặc đóng gói đặc thù không được in sẵn mã vạch trên bao bì, nhân viên có thể bỏ qua quét mã vạch và click chọn nút 'Nhặt hàng thủ công bằng tay' trực tiếp trên giao diện để ghi nhận đã soạn hàng."
              index={1}
              expanded={expandedFaq === 1}
              onToggle={() => toggleFaq(1)}
            />

            <FaqItem 
              question="Hết 30 phút giữ đơn (Lease Timeout) thì đơn hàng đi đâu?"
              answer="Mỗi đơn hàng sau khi bạn bấm 'Nhận đơn' sẽ được hệ thống giữ riêng cho bạn trong tối đa 30 phút để soạn hàng. Nếu quá 30 phút bạn vẫn chưa hoàn tất nhặt hàng, hệ thống sẽ tự động thu hồi đơn và đẩy ngược lại hàng chờ chung để nhân viên khác tiếp nhận."
              index={2}
              expanded={expandedFaq === 2}
              onToggle={() => toggleFaq(2)}
            />

            <FaqItem 
              question="Giao diện bị đơ hoặc báo lỗi API mất kết nối?"
              answer="Vui lòng kiểm tra lại chất lượng sóng 4G/Wifi của bạn, sau đó vuốt màn hình từ trên xuống dưới để tải lại (pull to refresh) danh sách hoặc thoát hẳn ứng dụng ra và khởi động lại. Nếu lỗi vẫn tiếp tục, hãy chụp ảnh màn hình và liên hệ bộ phận hỗ trợ kỹ thuật."
              index={3}
              expanded={expandedFaq === 3}
              onToggle={() => toggleFaq(3)}
            />
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

function TabButton({ icon: Icon, label, active, onPress }: any) {
  return (
    <Pressable 
      onPress={onPress}
      className={`items-center px-3 py-2 rounded-2xl ${active ? 'bg-[#EAF8F0]' : ''}`}
    >
      <Icon size={18} color={active ? '#16A34A' : '#64748B'} strokeWidth={active ? 2.5 : 2} />
      <Text 
        className={`text-[11px] mt-1.5 font-inter-bold ${active ? 'text-[#16A34A]' : 'text-slate-500'}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function FlowStepCard({ step, title, desc, tip, icon: Icon, iconBg, iconColor }: any) {
  return (
    <Card className="p-5 rounded-[28px] bg-white border border-slate-100 shadow-sm">
      <View className="flex-row items-center mb-3">
        <View className="w-10 h-10 rounded-2xl items-center justify-center mr-3" style={{ backgroundColor: iconBg }}>
          <Icon size={18} color={iconColor} strokeWidth={2.2} />
        </View>
        <View style={{ flex: 1 }}>
          <Text className="text-[11px] font-inter-bold text-slate-400 uppercase">Bước {step}</Text>
          <Text className="text-[15px] font-outfit-bold text-[#1E293B] mt-0.5">{title}</Text>
        </View>
      </View>
      <Text className="text-[13px] font-inter text-slate-600 leading-5">{desc}</Text>
      <View className="mt-3 bg-slate-50 p-3 rounded-xl border border-slate-100 flex-row">
        <Text className="text-[12px] font-inter text-slate-400 shrink-0 mr-1.5">💡 Lưu ý:</Text>
        <Text className="text-[12px] font-inter text-[#475569] flex-1 leading-4">{tip}</Text>
      </View>
    </Card>
  );
}

function ShiftRow({ title, time, desc }: any) {
  return (
    <View className="flex-row items-start justify-between">
      <View style={{ flex: 1, paddingRight: 10 }}>
        <Text className="text-[15px] font-inter-bold text-[#1E293B]">{title}</Text>
        <Text className="text-[13px] font-inter text-slate-400 mt-1">{desc}</Text>
      </View>
      <View className="bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
        <Text className="text-[12px] font-inter-bold text-[#16A34A]">{time}</Text>
      </View>
    </View>
  );
}

function FaqItem({ question, answer, expanded, onToggle }: any) {
  return (
    <Pressable onPress={onToggle}>
      <Card className="p-4 rounded-[24px] bg-white border border-slate-100 shadow-sm overflow-hidden">
        <View className="flex-row items-center justify-between">
          <Text className="flex-1 text-[14px] font-inter-bold text-[#1E293B] pr-4 leading-5">{question}</Text>
          {expanded ? <ChevronUp size={16} color="#64748B" /> : <ChevronDown size={16} color="#64748B" />}
        </View>
        {expanded && (
          <View className="mt-3 pt-3 border-t border-slate-50">
            <Text className="text-[13px] font-inter text-slate-500 leading-5">{answer}</Text>
          </View>
        )}
      </Card>
    </Pressable>
  );
}
