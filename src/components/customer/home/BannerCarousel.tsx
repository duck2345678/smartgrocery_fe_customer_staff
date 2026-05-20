import { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, Text, useWindowDimensions, View } from 'react-native';
import { Image } from 'expo-image';
import { clsx } from 'clsx';
import Skeleton from '../../ui/Skeleton';
import { defaultBanners, type PromoBanner } from '../../../utils/homeUtils';

export default function BannerCarousel({
  banners = defaultBanners,
  isLoading = false,
}: {
  banners?: PromoBanner[];
  isLoading?: boolean;
}) {
  const listRef = useRef<FlatList<PromoBanner> | null>(null);
  const { width } = useWindowDimensions();
  const itemWidth = Math.min(width - 48, 520);
  const [index, setIndex] = useState(0);

  const safeBanners = useMemo(() => (banners.length ? banners : defaultBanners), [banners]);

  useEffect(() => {
    if (isLoading) return;
    if (!safeBanners.length) return;
    const t = setInterval(() => {
      setIndex((prev) => (prev + 1) % safeBanners.length);
    }, 4000);
    return () => clearInterval(t);
  }, [isLoading, safeBanners.length]);

  useEffect(() => {
    if (isLoading) return;
    if (!safeBanners.length) return;
    listRef.current?.scrollToIndex({ index, animated: true });
  }, [index, isLoading, safeBanners.length]);

  if (isLoading) {
    return (
      <View className="px-6 pb-4">
        <Skeleton className="h-40 w-full rounded-3xl" />
      </View>
    );
  }

  return (
    <View className="pb-4">
      <FlatList
        ref={(r) => {
          listRef.current = r;
        }}
        data={safeBanners}
        keyExtractor={(b) => b.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        snapToAlignment="center"
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: 24, gap: 12 }}
        getItemLayout={(_, i) => ({ length: itemWidth + 12, offset: (itemWidth + 12) * i, index: i })}
        onMomentumScrollEnd={(e) => {
          const x = e.nativeEvent.contentOffset.x;
          const nextIndex = Math.round(x / (itemWidth + 12));
          if (Number.isFinite(nextIndex)) setIndex(nextIndex);
        }}
        renderItem={({ item }) => (
          <Pressable className={clsx('rounded-3xl overflow-hidden bg-slate-100', width > 560 ? 'w-[520px]' : 'w-full')} style={{ width: itemWidth }}>
            <Image
              source={item.imageSource ?? { uri: item.imageUrl }}
              style={{ width: '100%', height: 180 }}
              contentFit="cover"
              cachePolicy="disk"
              transition={200}
            />
          </Pressable>
        )}
      />

      <View className="flex-row justify-center mt-3">
        <View className="flex-row gap-x-2">
          {safeBanners.map((b, i) => (
            <View
              key={b.id}
              className={clsx('h-2 rounded-full', i === index ? 'w-5 bg-primary' : 'w-2 bg-border')}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

