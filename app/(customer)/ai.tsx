import { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Brain, Sparkles, Wand2, ClipboardList, Bot } from 'lucide-react-native';
import Card from '../../src/components/ui/Card';
import Button from '../../src/components/ui/Button';
import { aiApi } from '../../src/api/ai';
import { AIAction, AIResult } from '../../src/types/ai';
import CartButton from '../../src/components/customer/CartButton';
import { useCart } from '../../src/hooks/useCart';
import { productApi } from '../../src/api/products';
import { useRouter } from 'expo-router';

type Mode = 'BASKET_OPTIMIZER' | 'DISCOVER';

export default function CustomerAIHub() {
  const router = useRouter();
  const { items: cartItems, subtotal, addProduct, removeItem } = useCart();
  const [loadingMode, setLoadingMode] = useState<Mode | null>(null);
  const [result, setResult] = useState<AIResult | null>(null);
  const [showReasons, setShowReasons] = useState(true);

  const cartItemIds = useMemo(() => cartItems.map((i) => i.productId), [cartItems]);

  const runMode = async (mode: Mode) => {
    if (loadingMode) return;
    setLoadingMode(mode);
    try {
      if (mode === 'BASKET_OPTIMIZER') {
        const response = await aiApi.optimizeBasket({
          cartItemIds,
          budgetLimit: subtotal > 0 ? subtotal : 200000,
          targetNutrition: { protein: 60 },
        });
        setResult(response);
        setShowReasons(true);
      }
      if (mode === 'DISCOVER') {
        const response = await aiApi.discoverProducts({ max: 5 });
        setResult(response);
        setShowReasons(true);
      }
    } finally {
      setLoadingMode(null);
    }
  };

  const applyAction = async (action: AIAction) => {
    if (action.type === 'ADD_TO_CART') {
      const product = await productApi.getProductById(action.productId);
      await addProduct({ product, quantity: action.quantity });
      return;
    }
    if (action.type === 'REPLACE_CART_ITEM') {
      const from = cartItems.find((i) => i.productId === action.fromProductId);
      if (from?.cartItemId) {
        await removeItem({ cartItemId: from.cartItemId });
      }
      const product = await productApi.getProductById(action.toProductId);
      await addProduct({ product, quantity: action.quantity });
    }
  };

  return (
    <View className="flex-1 bg-background">
      <ScrollView className="flex-1 p-6" contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-4">
            <Text className="text-xs font-inter-bold text-muted uppercase">Smart AI</Text>
            <Text className="text-2xl font-outfit-bold text-text">Trợ lý mua sắm thông minh</Text>
          </View>
          <CartButton />
        </View>

        <View className="mt-6 gap-y-3">
          <InstructionCard
            icon={<Wand2 size={20} color="#16A34A" />}
            title="Basket Optimizer"
            subtitle="Tối ưu giỏ hàng theo ngân sách và nhu cầu dinh dưỡng."
            actionLabel="Phân tích giỏ hàng"
            loading={loadingMode === 'BASKET_OPTIMIZER'}
            onPress={() => runMode('BASKET_OPTIMIZER')}
          />
          <InstructionCard
            icon={<Brain size={20} color="#16A34A" />}
            title="Meal Planner"
            subtitle="Lên thực đơn 7 ngày với AI, thêm thẳng vào giỏ."
            actionLabel="Xem thực đơn"
            loading={false}
            onPress={() => router.push('/(customer)/meal-plans' as never)}
          />
          <InstructionCard
            icon={<ClipboardList size={20} color="#3B82F6" />}
            title="Danh sách thông minh"
            subtitle="Lưu và quản lý danh sách mua sắm của bạn."
            actionLabel="Xem danh sách"
            loading={false}
            onPress={() => router.push('/(customer)/smart-lists' as never)}
          />
          <InstructionCard
            icon={<Bot size={20} color="#8B5CF6" />}
            title="Trợ lý AI"
            subtitle="Hỏi đáp về sản phẩm, dinh dưỡng, và thực đơn."
            actionLabel="Mở chat"
            loading={false}
            onPress={() => router.push('/(customer)/ai-chat' as never)}
          />
          <InstructionCard
            icon={<Sparkles size={20} color="#16A34A" />}
            title="Discover"
            subtitle="Khám phá sản phẩm mới theo xu hướng."
            actionLabel="Khám phá ngay"
            loading={loadingMode === 'DISCOVER'}
            onPress={() => runMode('DISCOVER')}
          />
        </View>

        {result ? (
          <Card className="mt-6 p-4 border border-border">
            <Text className="text-lg font-outfit-bold text-text">{result.title}</Text>

            <View className="mt-4 gap-y-2">
              {result.items.map((i) => (
                <View key={`${result.mode}-${i.productId}`} className="flex-row items-center justify-between">
                  <Text className="text-sm font-inter text-text">{i.name}</Text>
                  <Text className="text-sm font-inter-bold text-text">
                    {i.price.toLocaleString('vi-VN')}₫ / {i.unit}
                  </Text>
                </View>
              ))}
            </View>

            {showReasons ? (
              <View className="mt-4 gap-y-2">
                {result.explanations.map((e, idx) => (
                  <Text key={`${result.mode}-exp-${idx}`} className="text-xs font-inter text-muted">
                    • {e}
                  </Text>
                ))}
              </View>
            ) : null}

            <View className="mt-5 gap-y-2">
              {result.actions.map((action, idx) => (
                <Pressable
                  key={`${result.mode}-action-${idx}`}
                  onPress={() => void applyAction(action)}
                  className="px-4 py-3 rounded-xl border border-emerald-200 bg-emerald-50"
                >
                  <Text className="text-emerald-700 font-inter-bold text-sm">{action.label}</Text>
                </Pressable>
              ))}
            </View>
          </Card>
        ) : null}
      </ScrollView>
    </View>
  );
}

function InstructionCard({
  icon,
  title,
  subtitle,
  actionLabel,
  onPress,
  loading,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  actionLabel: string;
  onPress: () => void;
  loading: boolean;
}) {
  return (
    <Card className="p-4 border border-border">
      <View className="flex-row items-center">
        <View className="w-9 h-9 rounded-xl bg-primary/5 items-center justify-center">{icon}</View>
        <View className="ml-3 flex-1">
          <Text className="text-base font-outfit-bold text-text">{title}</Text>
          <Text className="text-xs font-inter text-muted mt-0.5">{subtitle}</Text>
        </View>
      </View>
      <View className="mt-4">
        <Button label={actionLabel} onPress={onPress} loading={loading} />
      </View>
    </Card>
  );
}
