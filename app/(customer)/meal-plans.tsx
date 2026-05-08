import { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ChevronLeft,
  Plus,
  ChevronDown,
  ChevronUp,
  UtensilsCrossed,
  ShoppingCart,
  Sparkles,
  X,
  Coffee,
  Sun,
  Moon,
} from 'lucide-react-native';
import { useAuthStore } from '../../src/store/authStore';
import { mealPlansApi, type MealPlan, type MealPlanItem } from '../../src/api/mealPlans';
import { productApi } from '../../src/api/products';
import { useCart } from '../../src/hooks/useCart';
import Card from '../../src/components/ui/Card';

const SLOT_LABELS: Record<MealPlanItem['mealSlot'], string> = {
  BREAKFAST: 'Sáng',
  LUNCH: 'Trưa',
  DINNER: 'Tối',
};

const STATUS_LABELS: Record<MealPlan['status'], string> = {
  DRAFT: 'Nháp',
  RECOMMENDED: 'Gợi ý',
  ACCEPTED: 'Đã chấp nhận',
  ARCHIVED: 'Lưu trữ',
};

const STATUS_COLORS: Record<MealPlan['status'], string> = {
  DRAFT: '#94A3B8',
  RECOMMENDED: '#22C55E',
  ACCEPTED: '#3B82F6',
  ARCHIVED: '#CBD5E1',
};

function formatDate(s: string) {
  if (!s) return '';
  return new Date(s).toLocaleDateString('vi-VN');
}

function groupItemsByDay(items: MealPlanItem[]) {
  const map: Record<number, Record<MealPlanItem['mealSlot'], MealPlanItem[]>> = {};
  for (const item of items) {
    if (!map[item.dayNo]) {
      map[item.dayNo] = { BREAKFAST: [], LUNCH: [], DINNER: [] };
    }
    map[item.dayNo][item.mealSlot].push(item);
  }
  return Object.entries(map)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([day, slots]) => ({ day: Number(day), slots }));
}

const SlotIcon = ({ slot }: { slot: MealPlanItem['mealSlot'] }) => {
  if (slot === 'BREAKFAST') return <Coffee size={13} color="#F97316" />;
  if (slot === 'LUNCH') return <Sun size={13} color="#EAB308" />;
  return <Moon size={13} color="#6366F1" />;
};

export default function MealPlansScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const { addProduct } = useCart();
  const userId = user?.id ?? 0;

  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showGenerate, setShowGenerate] = useState(false);
  const [goal, setGoal] = useState('');
  const [addingToCartId, setAddingToCartId] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const plansQuery = useQuery({
    queryKey: ['meal-plans', userId],
    queryFn: () => mealPlansApi.getUserPlans(userId),
    enabled: !!userId,
    staleTime: 30_000,
  });

  const generateMutation = useMutation({
    mutationFn: () => mealPlansApi.generate(userId, goal.trim() || 'ăn uống đủ chất, cân bằng dinh dưỡng'),
    onSuccess: (newPlan) => {
      void qc.invalidateQueries({ queryKey: ['meal-plans', userId] });
      setShowGenerate(false);
      setGoal('');
      setExpandedId(newPlan.id);
    },
    onError: (e: Error) => Alert.alert('Lỗi tạo thực đơn', e.message),
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await plansQuery.refetch();
    setRefreshing(false);
  };

  const handleAddToCart = async (plan: MealPlan) => {
    setAddingToCartId(plan.id);
    try {
      const allProducts = await productApi.getProducts({ size: 500 });
      const byVariantId = new Map(
        allProducts.filter((p) => p.variantId != null).map((p) => [p.variantId!, p])
      );

      let added = 0;
      for (const item of plan.items) {
        const product = byVariantId.get(item.variant.id);
        if (product) {
          await addProduct({ product, quantity: Math.max(1, Math.round(item.quantity)) });
          added++;
        }
      }

      Alert.alert(
        'Đã thêm vào giỏ',
        `${added}/${plan.items.length} sản phẩm đã được thêm vào giỏ hàng.`
      );
    } catch {
      Alert.alert('Lỗi', 'Không thể thêm sản phẩm vào giỏ hàng. Vui lòng thử lại.');
    } finally {
      setAddingToCartId(null);
    }
  };

  const plans = plansQuery.data ?? [];

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View className="px-4 pt-4 pb-2 flex-row items-center">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 rounded-2xl bg-surface border border-border items-center justify-center mr-3"
        >
          <ChevronLeft size={20} color="#0F172A" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text className="text-xl font-outfit-bold text-text">Thực đơn AI</Text>
          <Text className="text-xs font-inter text-muted mt-0.5">Thực đơn 7 ngày được tạo bởi AI</Text>
        </View>
        <Pressable
          onPress={() => setShowGenerate(true)}
          className="flex-row items-center px-3 py-2 rounded-2xl bg-primary"
          style={{ gap: 6 }}
        >
          <Sparkles size={15} color="#fff" />
          <Text className="text-xs font-outfit-bold text-primary-fg">Tạo mới</Text>
        </Pressable>
      </View>

      {/* Body */}
      <View className="flex-1 px-4 pb-4">
        {plansQuery.isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#22C55E" />
            <Text className="text-xs font-inter text-muted mt-2">Đang tải…</Text>
          </View>
        ) : plansQuery.isError ? (
          <Card className="p-4 mt-4">
            <Text className="font-inter-bold text-text">Không tải được thực đơn.</Text>
            <Pressable
              onPress={() => void plansQuery.refetch()}
              className="mt-3 px-4 py-3 rounded-2xl bg-primary items-center"
            >
              <Text className="font-outfit-bold text-primary-fg">Thử lại</Text>
            </Pressable>
          </Card>
        ) : plans.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <View className="w-16 h-16 rounded-full bg-surface border border-border items-center justify-center mb-4">
              <UtensilsCrossed size={28} color="#64748B" />
            </View>
            <Text className="text-sm font-inter-bold text-text">Chưa có thực đơn nào</Text>
            <Text className="text-xs font-inter text-muted mt-1 text-center px-8">
              Nhấn "Tạo mới" để AI tạo thực đơn 7 ngày phù hợp với mục tiêu của bạn.
            </Text>
            <Pressable
              onPress={() => setShowGenerate(true)}
              className="mt-5 px-6 py-3 rounded-2xl bg-primary flex-row items-center"
              style={{ gap: 8 }}
            >
              <Sparkles size={16} color="#fff" />
              <Text className="font-outfit-bold text-primary-fg">Tạo thực đơn ngay</Text>
            </Pressable>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={{ paddingTop: 10, paddingBottom: 18, gap: 10 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
            showsVerticalScrollIndicator={false}
          >
            {plans.map((plan) => {
              const isExpanded = expandedId === plan.id;
              const dayGroups = groupItemsByDay(plan.items);

              return (
                <Card key={plan.id} className="p-4">
                  {/* Plan header */}
                  <Pressable
                    onPress={() => setExpandedId(isExpanded ? null : plan.id)}
                    className="flex-row items-start"
                  >
                    <View style={{ flex: 1 }}>
                      <Text className="font-outfit-bold text-text" style={{ fontSize: 15 }} numberOfLines={2}>
                        {plan.title || `Thực đơn ${plan.planDays} ngày`}
                      </Text>
                      <View className="flex-row items-center mt-1.5 flex-wrap" style={{ gap: 6 }}>
                        <View
                          style={{
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                            borderRadius: 99,
                            backgroundColor: STATUS_COLORS[plan.status] + '20',
                          }}
                        >
                          <Text
                            style={{ fontSize: 10, fontWeight: '700', color: STATUS_COLORS[plan.status] }}
                          >
                            {STATUS_LABELS[plan.status]}
                          </Text>
                        </View>
                        <Text className="text-xs font-inter text-muted">
                          {plan.planDays} ngày · {plan.items.length} món
                        </Text>
                        {plan.budgetLimit ? (
                          <Text className="text-xs font-inter text-muted">
                            ≤ {plan.budgetLimit.toLocaleString('vi-VN')}₫
                          </Text>
                        ) : null}
                      </View>
                      <Text className="text-xs font-inter text-muted mt-1">
                        Tạo lúc {formatDate(plan.createdAt)}
                      </Text>
                    </View>
                    <View className="ml-3 mt-0.5">
                      {isExpanded ? (
                        <ChevronUp size={18} color="#94A3B8" />
                      ) : (
                        <ChevronDown size={18} color="#94A3B8" />
                      )}
                    </View>
                  </Pressable>

                  {/* Expanded: days + meals */}
                  {isExpanded ? (
                    <View className="mt-4">
                      {dayGroups.length === 0 ? (
                        <Text className="text-xs font-inter text-muted text-center py-2">
                          Chưa có dữ liệu chi tiết.
                        </Text>
                      ) : (
                        <View style={{ gap: 12 }}>
                          {dayGroups.map(({ day, slots }) => (
                            <View key={day}>
                              <Text className="text-xs font-inter-bold text-muted uppercase mb-2">
                                Ngày {day}
                              </Text>
                              {(['BREAKFAST', 'LUNCH', 'DINNER'] as const).map((slot) => {
                                const items = slots[slot];
                                if (items.length === 0) return null;
                                return (
                                  <View
                                    key={slot}
                                    className="mb-2 bg-surface rounded-2xl px-3 py-2"
                                  >
                                    <View className="flex-row items-center mb-1.5" style={{ gap: 5 }}>
                                      <SlotIcon slot={slot} />
                                      <Text className="text-xs font-inter-bold text-muted">
                                        {SLOT_LABELS[slot]}
                                      </Text>
                                    </View>
                                    {items.map((item) => (
                                      <View
                                        key={item.id}
                                        className="flex-row items-center justify-between py-0.5"
                                      >
                                        <Text
                                          className="text-sm font-inter text-text"
                                          numberOfLines={1}
                                          style={{ flex: 1 }}
                                        >
                                          {item.variant.name}
                                        </Text>
                                        <Text className="text-xs font-inter text-muted ml-2">
                                          ×{item.quantity}
                                          {item.variant.unit ? ` ${item.variant.unit}` : ''}
                                          {item.estCalories
                                            ? ` · ${Math.round(item.estCalories)} kcal`
                                            : ''}
                                        </Text>
                                      </View>
                                    ))}
                                  </View>
                                );
                              })}
                            </View>
                          ))}
                        </View>
                      )}

                      <Pressable
                        onPress={() => void handleAddToCart(plan)}
                        disabled={addingToCartId === plan.id || plan.items.length === 0}
                        className="mt-3 py-3 rounded-2xl bg-primary flex-row items-center justify-center"
                        style={{ gap: 8, opacity: plan.items.length === 0 ? 0.5 : 1 }}
                      >
                        {addingToCartId === plan.id ? (
                          <ActivityIndicator color="#fff" size="small" />
                        ) : (
                          <>
                            <ShoppingCart size={16} color="#fff" />
                            <Text className="font-outfit-bold text-primary-fg">Thêm tất cả vào giỏ</Text>
                          </>
                        )}
                      </Pressable>
                    </View>
                  ) : null}
                </Card>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* Generate Modal */}
      <Modal visible={showGenerate} transparent animationType="fade" onRequestClose={() => setShowGenerate(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}>
          <View className="bg-white rounded-t-3xl p-6 pb-10">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-lg font-outfit-bold text-text">Tạo thực đơn AI</Text>
              <Pressable
                onPress={() => {
                  if (!generateMutation.isPending) setShowGenerate(false);
                }}
              >
                <X size={22} color="#64748B" />
              </Pressable>
            </View>
            <Text className="text-xs font-inter text-muted mb-5">
              Mô tả mục tiêu dinh dưỡng để AI tạo thực đơn 7 ngày phù hợp.
            </Text>

            <Text className="text-sm font-inter-bold text-text mb-2">Mục tiêu của bạn</Text>
            <TextInput
              value={goal}
              onChangeText={setGoal}
              placeholder="VD: Giảm cân, tăng cơ, ăn chay, ít đường…"
              placeholderTextColor="#94A3B8"
              className="border border-border rounded-2xl px-4 py-3 font-inter text-text"
              multiline
              numberOfLines={2}
              style={{ minHeight: 56, textAlignVertical: 'top' }}
            />
            <Text className="text-xs font-inter text-muted mt-1">
              Để trống sẽ tạo thực đơn cân bằng mặc định.
            </Text>

            {generateMutation.isPending ? (
              <View className="mt-5 py-4 rounded-2xl bg-emerald-50 border border-emerald-200 items-center">
                <ActivityIndicator color="#22C55E" />
                <Text className="text-sm font-inter-bold text-emerald-700 mt-2">AI đang tạo thực đơn…</Text>
                <Text className="text-xs font-inter text-emerald-600 mt-1">Có thể mất 15–30 giây</Text>
              </View>
            ) : (
              <Pressable
                onPress={() => generateMutation.mutate()}
                className="mt-5 py-4 rounded-2xl bg-primary flex-row items-center justify-center"
                style={{ gap: 8 }}
              >
                <Sparkles size={16} color="#fff" />
                <Text className="font-outfit-bold text-primary-fg">Tạo thực đơn</Text>
              </Pressable>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
