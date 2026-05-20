import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Save, Heart, Scale, Ruler, AlertCircle, Apple } from 'lucide-react-native';
import { useAuthStore } from '../../../src/store/authStore';
import { nutritionApi } from '../../../src/api/nutrition';
import { UserNutritionProfile } from '../../../src/types/nutrition';
import Card from '../../../src/components/ui/Card';

export default function NutritionProfile() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserNutritionProfile>({
    healthGoals: '',
    dietaryPreference: '',
    allergies: '',
    height: undefined,
    weight: undefined,
    bmi: undefined
  });

  useEffect(() => {
    if (user?.id) {
      fetchProfile();
    }
  }, [user?.id]);

  const fetchProfile = async () => {
    try {
      const response = await nutritionApi.getProfile(user!.id);
      if (response.data) {
        setProfile(response.data);
      }
    } catch (error) {
      console.error('Fetch profile error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      const response = await nutritionApi.updateProfile(user.id, profile);
      setProfile(response.data);
      Alert.alert('Thành công', 'Hồ sơ sức khỏe của bạn đã được cập nhật.');
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể cập nhật hồ sơ. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const calculateBMI = () => {
    if (profile.height && profile.weight && profile.height > 0) {
      const h = profile.height / 100;
      return (profile.weight / (h * h)).toFixed(1);
    }
    return profile.bmi?.toFixed(1) || '--';
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#16A34A" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#FBFBFC]" edges={['top']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-row items-center px-6 py-4">
          <Pressable 
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-white border border-[#F1F5F9] items-center justify-center"
          >
            <ChevronLeft size={24} color="#1E293B" />
          </Pressable>
          <Text className="flex-1 text-center text-[18px] font-outfit-bold text-[#1E293B] mr-10">
            Hồ sơ sức khỏe
          </Text>
        </View>

        <ScrollView 
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {/* ───── BMI Banner ───── */}
          <View className="bg-emerald-500 rounded-[32px] p-6 mb-8 flex-row items-center overflow-hidden">
            <View className="flex-1">
              <Text className="text-white/80 font-inter text-[14px]">Chỉ số BMI của bạn</Text>
              <Text className="text-white font-outfit-bold text-[42px] mt-1">{calculateBMI()}</Text>
              <Text className="text-white/90 font-inter-bold text-[12px] mt-1 uppercase tracking-widest">
                {Number(calculateBMI()) < 18.5 ? 'Gầy' : Number(calculateBMI()) < 25 ? 'Bình thường' : 'Thừa cân'}
              </Text>
            </View>
            <View className="w-20 h-20 bg-white/20 rounded-full items-center justify-center">
              <Heart size={40} color="white" />
            </View>
          </View>

          {/* ───── Body Stats ───── */}
          <View className="flex-row space-x-4 mb-8">
            <View className="flex-1">
              <Text className="text-[14px] font-inter-bold text-[#64748B] mb-2 ml-1">Chiều cao (cm)</Text>
              <View className="flex-row items-center bg-white border border-[#F1F5F9] rounded-[20px] px-4 py-3">
                <Ruler size={20} color="#94A3B8" />
                <TextInput 
                  className="flex-1 ml-3 font-inter-bold text-[#1E293B]"
                  value={profile.height?.toString()}
                  onChangeText={(val) => setProfile({...profile, height: parseFloat(val) || 0})}
                  keyboardType="numeric"
                  placeholder="170"
                />
              </View>
            </View>
            <View className="flex-1 ml-4">
              <Text className="text-[14px] font-inter-bold text-[#64748B] mb-2 ml-1">Cân nặng (kg)</Text>
              <View className="flex-row items-center bg-white border border-[#F1F5F9] rounded-[20px] px-4 py-3">
                <Scale size={20} color="#94A3B8" />
                <TextInput 
                  className="flex-1 ml-3 font-inter-bold text-[#1E293B]"
                  value={profile.weight?.toString()}
                  onChangeText={(val) => setProfile({...profile, weight: parseFloat(val) || 0})}
                  keyboardType="numeric"
                  placeholder="65"
                />
              </View>
            </View>
          </View>

          {/* ───── Preferences ───── */}
          <Text className="text-[14px] font-inter-bold text-[#94A3B8] uppercase tracking-widest ml-1 mb-3">
            Sở thích & Mục tiêu
          </Text>
          <Card className="rounded-[32px] p-6 mb-8 border border-[#F1F5F9]">
            <View className="mb-6">
              <View className="flex-row items-center mb-2">
                <Apple size={18} color="#16A34A" />
                <Text className="text-[14px] font-inter-bold text-[#1E293B] ml-2">Chế độ ăn ưu tiên</Text>
              </View>
              <TextInput 
                className="bg-[#F8FAFC] rounded-2xl px-4 py-3 font-inter text-[#1E293B]"
                value={profile.dietaryPreference}
                onChangeText={(val) => setProfile({...profile, dietaryPreference: val})}
                placeholder="Ví dụ: Keto, Chay, Eat Clean..."
              />
            </View>

            <View className="mb-6">
              <View className="flex-row items-center mb-2">
                <Heart size={18} color="#F43F5E" />
                <Text className="text-[14px] font-inter-bold text-[#1E293B] ml-2">Mục tiêu sức khỏe</Text>
              </View>
              <TextInput 
                className="bg-[#F8FAFC] rounded-2xl px-4 py-3 font-inter text-[#1E293B]"
                value={profile.healthGoals}
                onChangeText={(val) => setProfile({...profile, healthGoals: val})}
                placeholder="Ví dụ: Giảm cân, tăng cơ..."
              />
            </View>

            <View>
              <View className="flex-row items-center mb-2">
                <AlertCircle size={18} color="#EA580C" />
                <Text className="text-[14px] font-inter-bold text-[#1E293B] ml-2">Dị ứng & Kiêng khem</Text>
              </View>
              <TextInput 
                className="bg-[#F8FAFC] rounded-2xl px-4 py-3 font-inter text-[#1E293B]"
                value={profile.allergies}
                onChangeText={(val) => setProfile({...profile, allergies: val})}
                placeholder="Ví dụ: Tôm, Cua, Đậu phộng..."
                multiline
                numberOfLines={3}
              />
            </View>
          </Card>

          <View className="flex-row items-start bg-blue-50 p-4 rounded-2xl mb-8 border border-blue-100">
            <AlertCircle size={20} color="#3B82F6" />
            <Text className="flex-1 ml-3 text-[13px] font-inter text-blue-700 leading-5">
              Thông tin này sẽ được trợ lý AI sử dụng để đưa ra các gợi ý mua sắm và thực đơn cá nhân hóa, an toàn cho sức khỏe của bạn.
            </Text>
          </View>

          <Pressable
            onPress={handleSave}
            disabled={saving}
            className="bg-[#16A34A] flex-row items-center justify-center p-5 rounded-[24px] shadow-lg shadow-emerald-500/30"
          >
            {saving ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Save size={22} color="white" />
                <Text className="text-white text-[16px] font-outfit-bold ml-2">Lưu hồ sơ sức khỏe</Text>
              </>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
