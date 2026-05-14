import { Pressable, Text, View } from 'react-native';
import { Search } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function SearchBar() {
  const router = useRouter();

  return (
    <View style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 12 }}>
      <Pressable
        onPress={() => router.push({ pathname: '/(customer)/(tabs)/shop', params: { focusSearch: 'true' } } as never)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          paddingHorizontal: 16,
          paddingVertical: 14,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 3,
        }}
        hitSlop={8}
      >
        <Search size={20} color="#94A3B8" />
        <Text style={{ flex: 1, marginLeft: 10, fontSize: 15, fontFamily: 'Inter-Regular', color: '#94A3B8' }}>
          Tìm sản phẩm...
        </Text>
      </Pressable>
    </View>
  );
}
