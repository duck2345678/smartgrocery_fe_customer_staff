import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View, Image, Modal, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { 
  User, 
  Briefcase, 
  ReceiptText, 
  Lock, 
  LogOut, 
  ChevronRight,
  X
} from 'lucide-react-native';
import Card from '../../../src/components/ui/Card';
import { useAuthStore } from '../../../src/store/authStore';

export default function StaffProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [isAvatarModalVisible, setIsAvatarModalVisible] = useState(false);

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
    if (!name) return 'S';
    return name.charAt(0).toUpperCase();
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]">
      <Stack.Screen options={{ title: 'Cá nhân', headerShown: false }} />

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 50 }}>
        
        {/* ───── Header / Avatar Section ───── */}
        <View className="items-center mt-12 mb-10">
          <Pressable 
            onPress={() => setIsAvatarModalVisible(true)}
            className="w-36 h-36 rounded-full bg-[#EDF7F1] border-[6px] border-white items-center justify-center mb-5 overflow-hidden"
            style={{
              shadowColor: '#16A34A',
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.12,
              shadowRadius: 24,
              elevation: 8,
            }}
          >
            {user?.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} className="w-full h-full" resizeMode="cover" />
            ) : (
              <Text className="text-[52px] font-outfit-bold text-[#16A34A]">
                {getInitials(user?.fullName || '')}
              </Text>
            )}
          </Pressable>
          
          <Text className="text-[28px] font-inter-bold text-[#111827]">
            {user?.fullName || 'Nhân viên'}
          </Text>
          <Text className="text-[17px] font-inter text-[#64748B] mt-1.5">
            {user?.role === 'STAFF' ? 'Nhân viên vận hành' : (user?.role || 'Nhân viên')}
          </Text>
          
          <View className="px-5 py-2 bg-[#F1F5F9] rounded-full mt-4">
            <Text className="text-[14px] font-inter-bold text-[#475569]">
              ID: {user?.id ? `SG-${String(user.id).padStart(4, '0')}` : 'SG-0000'}
            </Text>
          </View>
        </View>

        {/* ───── Main Menu Card ───── */}
        <Card className="rounded-[36px] p-3 mb-8 border border-[#E2E8F0]">
          <MenuItem 
            icon={User} 
            iconBg="#EEF2FF" 
            iconColor="#4F46E5" 
            label="Hồ sơ cá nhân" 
            onPress={() => router.push('/(staff)/profile/details' as never)} 
          />
          <View className="h-[1px] bg-[#F1F5F9] mx-4" />
          
          <MenuItem 
            icon={Briefcase} 
            iconBg="#FFF7ED" 
            iconColor="#EA580C" 
            label="Quá trình công tác" 
            onPress={() => router.push('/(staff)/profile/work-history' as never)} 
          />
          <View className="h-[1px] bg-[#F1F5F9] mx-4" />
          
          <MenuItem 
            icon={ReceiptText} 
            iconBg="#ECFDF5" 
            iconColor="#059669" 
            label="Phiếu báo lương" 
            onPress={() => router.push('/(staff)/profile/payslip' as never)} 
          />
          <View className="h-[1px] bg-[#F1F5F9] mx-4" />
          
          <MenuItem 
            icon={Lock} 
            iconBg="#FEF2F2" 
            iconColor="#DC2626" 
            label="Đổi mật khẩu" 
            onPress={() => router.push('/(staff)/profile/change-password' as never)} 
          />
        </Card>

        {/* ───── Logout Button ───── */}
        <Pressable
          onPress={handleLogout}
          className="flex-row items-center justify-center p-5 rounded-[28px] bg-white border border-[#FEE2E2]"
          style={{
            shadowColor: '#DC2626',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.08,
            shadowRadius: 12,
            elevation: 3,
          }}
        >
          <LogOut size={24} color="#EF4444" style={{ marginRight: 10 }} />
          <Text className="text-[18px] font-inter-bold text-[#EF4444]">
            Đăng xuất
          </Text>
        </Pressable>

        <View className="items-center mt-10">
          <Text className="text-[13px] font-inter text-[#94A3B8]">
            SmartGrocery Staff v1.0.0
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
              <View className="w-64 h-64 rounded-full bg-[#EDF7F1] items-center justify-center border-4 border-white">
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
      className="flex-row items-center p-4 rounded-[28px]"
      style={({ pressed }) => ({
        backgroundColor: pressed ? '#F8FAFC' : 'transparent',
      })}
    >
      <View 
        className="w-14 h-14 rounded-2xl items-center justify-center mr-5"
        style={{ backgroundColor: iconBg }}
      >
        <Icon size={28} color={iconColor} strokeWidth={2.5} />
      </View>
      <Text className="flex-1 text-[18px] font-inter-bold text-[#1E293B]">
        {label}
      </Text>
      <ChevronRight size={24} color="#CBD5E1" />
    </Pressable>
  );
}
