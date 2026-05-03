import { Pressable, Text, View } from 'react-native';
import { Search } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function SearchBar() {
  const router = useRouter();

  return (
    <View className="px-6 pb-4">
      <Pressable
        onPress={() => router.push('/(customer)/search' as never)}
        className="flex-row items-center bg-surface border border-border rounded-2xl px-4 py-3"
        hitSlop={8}
      >
        <Search size={18} color="#94A3B8" />
        <Text className="flex-1 ml-2 text-base font-inter text-slate-400">Tìm sản phẩm...</Text>
        <View className="ml-2 px-3 py-2 rounded-xl bg-primary">
          <Text className="text-primary-fg font-inter-bold text-sm">Tìm</Text>
        </View>
      </Pressable>
    </View>
  );
}
