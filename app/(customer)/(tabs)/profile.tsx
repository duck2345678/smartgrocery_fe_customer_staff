import React, { useState } from 'react';
import { View, Text, Pressable, Alert, ScrollView, Image, StyleSheet, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../src/store/authStore';
import Card from '../../../src/components/ui/Card';
import { 
  ChevronRight, 
  History, 
  MapPin, 
  Settings, 
  LogOut, 
  User, 
  ShieldCheck,
  CreditCard,
  X,
  Bell,
  Heart
} from 'lucide-react-native';
import { clsx } from 'clsx';

export default function CustomerProfile() {
  const { user, logout } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [isAvatarModalVisible, setIsAvatarModalVisible] = useState(false);
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn muốn đăng xuất khỏi tài khoản này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: () => {
          logout();
          router.replace('/(auth)/login' as never);
        },
      },
    ]);
  };

  const getInitials = (name: string) => {
    if (!name) return 'C';
    return name.charAt(0).toUpperCase();
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FBFBFC]" edges={['top']}>
      <ScrollView 
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 50 }}
        showsVerticalScrollIndicator={false}
      >
        
        {/* ───── Header / Avatar Section ───── */}
        <View className="items-center mt-10 mb-8">
          <Pressable 
            onPress={() => setIsAvatarModalVisible(true)}
            className="w-32 h-32 rounded-full bg-[#F0FDF4] border-[5px] border-white items-center justify-center mb-4 overflow-hidden shadow-lg shadow-emerald-500/20"
            style={{ elevation: 10 }}
          >
            {user?.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} className="w-full h-full" resizeMode="cover" />
            ) : (
              <Text className="text-[48px] font-outfit-bold text-[#16A34A]">
                {getInitials(user?.fullName || '')}
              </Text>
            )}
          </Pressable>
          
          <Text className="text-[24px] font-outfit-bold text-[#1E293B]">
            {user?.fullName || 'Khách hàng'}
          </Text>
          <Text className="text-[14px] font-inter text-[#64748B] mt-1">
            {user?.email || 'Chưa cập nhật email'}
          </Text>
          
          <View className="flex-row items-center px-4 py-1.5 bg-[#DCFCE7] rounded-full mt-3">
            <ShieldCheck size={14} color="#16A34A" />
            <Text className="text-[12px] font-inter-bold text-[#16A34A] ml-1.5">
              Khách hàng thân thiết
            </Text>
          </View>
        </View>

        {/* ───── Main Menu Card ───── */}
        <Text className="text-[14px] font-inter-bold text-[#94A3B8] uppercase tracking-widest ml-1 mb-3">
          Tài khoản & Bảo mật
        </Text>
        <Card className="rounded-[32px] p-2 mb-6 border border-[#F1F5F9]">
          <MenuItem 
            icon={User} 
            iconBg="#EEF2FF" 
            iconColor="#4F46E5" 
            label="Hồ sơ cá nhân" 
            onPress={() => router.push('/(customer)/profile/details' as never)} 
          />
          <View className="h-[1px] bg-[#F8FAFC] mx-4" />

          <MenuItem 
            icon={Heart} 
            iconBg="#FFF1F2" 
            iconColor="#F43F5E" 
            label="Hồ sơ sức khỏe & Dinh dưỡng" 
            onPress={() => router.push('/(customer)/profile/nutrition' as never)} 
          />
          <View className="h-[1px] bg-[#F8FAFC] mx-4" />
          
          <MenuItem 
            icon={History} 
            iconBg="#F0FDF4" 
            iconColor="#16A34A" 
            label="Lịch sử đơn hàng" 
            onPress={() => router.push('/(customer)/orders' as never)} 
          />
          <View className="h-[1px] bg-[#F8FAFC] mx-4" />
          
          <MenuItem 
            icon={MapPin} 
            iconBg="#EFF6FF" 
            iconColor="#3B82F6" 
            label="Sổ địa chỉ" 
            onPress={() => router.push('/(customer)/profile/addresses' as never)} 
          />
          <View className="h-[1px] bg-[#F8FAFC] mx-4" />
          
          <MenuItem 
            icon={CreditCard} 
            iconBg="#F5F3FF" 
            iconColor="#8B5CF6" 
            label="Phương thức thanh toán" 
            onPress={() => Alert.alert('Thông báo', 'Tính năng đang được phát triển.')} 
          />
        </Card>

        <Text className="text-[14px] font-inter-bold text-[#94A3B8] uppercase tracking-widest ml-1 mb-3">
          Cài đặt ứng dụng
        </Text>
        <Card className="rounded-[32px] p-2 mb-8 border border-[#F1F5F9]">
          <MenuItem 
            icon={Bell} 
            iconBg="#FFF7ED" 
            iconColor="#EA580C" 
            label="Thông báo" 
            onPress={() => Alert.alert('Thông báo', 'Tính năng đang được phát triển.')} 
          />
          <View className="h-[1px] bg-[#F8FAFC] mx-4" />
          
          <MenuItem 
            icon={Settings} 
            iconBg="#F1F5F9" 
            iconColor="#475569" 
            label="Cài đặt tài khoản" 
            onPress={() => Alert.alert('Thông báo', 'Tính năng đang được phát triển.')} 
          />
        </Card>

        {/* ───── Logout Button ───── */}
        <Pressable
          onPress={handleLogout}
          className="flex-row items-center justify-center p-5 rounded-[24px] bg-white border border-[#FEE2E2]"
          style={{ elevation: 2 }}
        >
          <LogOut size={22} color="#EF4444" style={{ marginRight: 10 }} />
          <Text className="text-[16px] font-inter-bold text-[#EF4444]">
            Đăng xuất
          </Text>
        </Pressable>

        <View className="items-center mt-10">
          <Text className="text-[12px] font-inter text-[#CBD5E1]">
            SmartGrocery Customer v1.0.0
          </Text>
        </View>

      </ScrollView>

      {/* ───── Avatar Full Screen Modal ───── */}
      <Modal
        visible={isAvatarModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsAvatarModalVisible(false)}
      >
        <Pressable 
          style={styles.modalBackdrop} 
          onPress={() => setIsAvatarModalVisible(false)}
        >
          <View className="absolute top-12 right-6 z-10">
            <Pressable 
              onPress={() => setIsAvatarModalVisible(false)}
              className="w-10 h-10 rounded-full bg-black/40 items-center justify-center"
            >
              <X size={24} color="#FFFFFF" />
            </Pressable>
          </View>
          
          <View style={styles.modalContent}>
            {user?.avatarUrl ? (
              <Image 
                source={{ uri: user.avatarUrl }} 
                className="w-full h-full" 
                resizeMode="contain" 
              />
            ) : (
              <View className="w-64 h-64 rounded-full bg-[#F0FDF4] items-center justify-center border-4 border-white">
                <Text className="text-[100px] font-outfit-bold text-[#16A34A]">
                  {getInitials(user?.fullName || '')}
                </Text>
              </View>
            )}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

function MenuItem({ 
  icon: Icon, 
  iconBg, 
  iconColor, 
  label, 
  onPress 
}: { 
  icon: any; 
  iconBg: string; 
  iconColor: string; 
  label: string; 
  onPress: () => void;
}) {
  return (
    <Pressable 
      onPress={onPress}
      className="flex-row items-center p-3 rounded-[24px] active:bg-[#F8FAFC]"
    >
      <View 
        className="w-12 h-12 rounded-2xl items-center justify-center mr-4"
        style={{ backgroundColor: iconBg }}
      >
        <Icon size={22} color={iconColor} strokeWidth={2.5} />
      </View>
      <Text className="flex-1 text-[16px] font-inter-bold text-[#1E293B]">
        {label}
      </Text>
      <ChevronRight size={20} color="#CBD5E1" />
    </Pressable>
  );
}
