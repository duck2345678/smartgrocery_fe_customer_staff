import { Pressable, Text, View } from 'react-native';
import { ShoppingCart } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useCart } from '../../hooks/useCart';

export default function CartButton({ color = '#0F172A' }: { color?: string }) {
  const router = useRouter();
  const { count } = useCart();

  return (
    <Pressable
      onPress={() => router.push('/(customer)/cart' as never)}
      className="relative w-10 h-10 rounded-full bg-surface border border-border items-center justify-center"
      hitSlop={10}
    >
      <ShoppingCart size={20} color={color} />
      {count > 0 ? (
        <View className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-primary items-center justify-center">
          <Text className="text-[10px] font-inter-bold text-primary-fg">{count > 99 ? '99+' : String(count)}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}
