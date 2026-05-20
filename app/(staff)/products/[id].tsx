import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Barcode, 
  Globe, 
  ShieldCheck, 
  Sparkles, 
  Hash, 
  Scale, 
  Tag, 
  Info, 
  Star, 
  Package 
} from 'lucide-react-native';
import Card from '../../../src/components/ui/Card';
import { productApi } from '../../../src/api/products';
import { resolveImageUrl } from '../../../src/utils/imageUtils';

export default function StaffProductDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const [imgFailed, setImgFailed] = useState(false);
  const productId = useMemo(() => {
    const raw = params.id;
    const v = Array.isArray(raw) ? raw[0] : raw;
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }, [params.id]);

  const productQuery = useQuery({
    queryKey: ['staff-product-dto', productId],
    queryFn: () => productApi.getProductDtoById(productId),
    enabled: productId > 0,
  });

  const product = productQuery.data;

  // Resolve status styling
  const statusConfig = useMemo(() => {
    if (!product?.status) return { label: 'Chưa rõ', bg: 'bg-slate-100', text: 'text-slate-600 border-slate-200' };
    const status = product.status.toUpperCase();
    if (status === 'ACTIVE') {
      return { label: 'Đang Bán', bg: 'bg-emerald-50', text: 'text-emerald-700 border-emerald-200' };
    }
    if (status === 'HIDDEN') {
      return { label: 'Đã Ẩn', bg: 'bg-amber-50', text: 'text-amber-700 border-amber-200' };
    }
    if (status === 'DELETED') {
      return { label: 'Đã Xóa', bg: 'bg-rose-50', text: 'text-rose-700 border-rose-200' };
    }
    return { label: product.status, bg: 'bg-slate-100', text: 'text-slate-700 border-slate-200' };
  }, [product?.status]);

  // Compute total stock of all variants
  const totalStock = useMemo(() => {
    if (!product?.variants) return 0;
    return product.variants.reduce((acc, v) => acc + (toNumber(v.stock) || 0), 0);
  }, [product?.variants]);

  const resolvedImage = useMemo(() => {
    if (!product) return '';
    return resolveImageUrl(product.image || product.imageUrl, product.name) || '';
  }, [product]);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <Stack.Screen options={{ title: 'Chi tiết sản phẩm', headerShown: false }} />

      {/* Header bar */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-surface border-b border-border z-10">
        <Pressable 
          onPress={() => router.back()} 
          className="w-10 h-10 rounded-full bg-slate-100 items-center justify-center active:bg-slate-200"
          hitSlop={8}
        >
          <ArrowLeft size={20} color="#334155" />
        </Pressable>
        <Text className="text-[17px] font-outfit-bold text-text">Chi tiết sản phẩm</Text>
        <View className="w-10" />
      </View>

      {productQuery.isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#10B981" />
          <Text className="text-sm font-inter text-muted mt-2">Đang tải chi tiết sản phẩm…</Text>
        </View>
      ) : productQuery.isError || !product ? (
        <View className="p-4 flex-1 justify-center items-center">
          <Card className="p-5 items-center max-w-[320px]">
            <View className="w-12 h-12 rounded-full bg-rose-50 items-center justify-center mb-3">
              <Info size={24} color="#EF4444" />
            </View>
            <Text className="font-outfit-bold text-base text-text text-center">Không tải được thông tin sản phẩm</Text>
            <Text className="text-xs font-inter text-muted mt-1 text-center leading-5">Vui lòng kiểm tra kết nối mạng và thử lại sau.</Text>
            <Pressable onPress={() => void productQuery.refetch()} className="mt-4 w-full py-3 rounded-2xl bg-primary items-center active:opacity-90">
              <Text className="font-outfit-bold text-primary-fg text-sm">Thử lại</Text>
            </Pressable>
          </Card>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
          
          {/* 1. Hero Image Card */}
          <View className="px-4 pt-4">
            <View className="relative bg-surface rounded-3xl overflow-hidden border border-border shadow-sm">
              {/* Product Image */}
              {(!resolvedImage || imgFailed) ? (
                <View className="w-full h-64 bg-slate-100 items-center justify-center">
                  <View className="w-16 h-16 rounded-full bg-[#EDF7F1] items-center justify-center mb-2">
                    <Package size={32} color="#10B981" />
                  </View>
                  <Text className="text-sm font-outfit-bold text-slate-800">
                    {product.name}
                  </Text>
                  <Text className="text-xs font-inter text-slate-400 mt-1">
                    (Không có hình ảnh sản phẩm)
                  </Text>
                </View>
              ) : (
                <Image 
                  source={{ uri: resolvedImage }} 
                  className="w-full h-64 bg-slate-100" 
                  contentFit="cover"
                  cachePolicy="disk"
                  transition={200}
                  onError={() => setImgFailed(true)}
                />
              )}

              {/* Status and Features Floating Badges */}
              <View className="absolute top-3 left-3 flex-row gap-2">
                <View className={`px-3 py-1 rounded-full border ${statusConfig.bg} ${statusConfig.text}`}>
                  <Text className="text-[11px] font-inter-bold uppercase tracking-wider">{statusConfig.label}</Text>
                </View>
                {product.isFeatured && (
                  <View className="px-3 py-1 rounded-full bg-amber-400 flex-row items-center gap-1">
                    <Star size={10} color="#ffffff" fill="#ffffff" />
                    <Text className="text-[11px] font-inter-bold text-white uppercase tracking-wider">Nổi bật</Text>
                  </View>
                )}
              </View>

              {/* Category tag */}
              <View className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-black/60">
                <Text className="text-[11px] font-inter-bold text-white uppercase tracking-wider">
                  {product.category?.name || product.categoryName || 'Khác'}
                </Text>
              </View>
            </View>
          </View>

          {/* 2. Core Metadata Dashboard */}
          <View className="px-4 mt-4">
            <Card className="p-5">
              <Text className="text-xs font-inter text-primary-600 uppercase tracking-widest font-bold">
                {product.brand || 'Thương hiệu phổ thông'}
              </Text>
              <Text className="text-xl font-outfit-bold text-text mt-1">{product.name}</Text>
              {product.shortDescription && (
                <Text className="text-xs font-inter text-muted mt-2 leading-5 italic">{product.shortDescription}</Text>
              )}

              {/* Grid of key statistics */}
              <View className="flex-row flex-wrap border-t border-slate-100 mt-4 pt-4 -mx-2">
                <MetaItem 
                  icon={<Hash size={14} color="#64748B" />} 
                  label="Mã sản phẩm" 
                  value={product.productCode || `SP-${product.id}`} 
                />
                <MetaItem 
                  icon={<Globe size={14} color="#64748B" />} 
                  label="Xuất xứ" 
                  value={product.originCountry || 'Không rõ'} 
                />
                <MetaItem 
                  icon={<Package size={14} color="#64748B" />} 
                  label="Tổng tồn kho" 
                  value={`${totalStock} đơn vị`} 
                  highlight
                />
                <MetaItem 
                  icon={<Sparkles size={14} color="#64748B" />} 
                  label="Lượt mua" 
                  value={`${product.purchaseCount || 0} lượt`} 
                />
              </View>
            </Card>
          </View>

          {/* 3. Product Variants Section */}
          <View className="px-4 mt-5">
            <View className="flex-row items-center gap-2 mb-3">
              <Package size={18} color="#10B981" />
              <Text className="text-[15px] font-outfit-bold text-text">Phiên bản & Tồn kho ({product.variants?.length || 0})</Text>
            </View>

            {!product.variants || product.variants.length === 0 ? (
              <Card className="p-4 items-center">
                <Text className="text-xs font-inter text-muted">Sản phẩm này chưa được cấu hình phiên bản.</Text>
              </Card>
            ) : (
              <View className="gap-3">
                {product.variants.map((variant, index) => {
                  const varStock = toNumber(variant.stock);
                  const isOutOfStock = varStock <= 0;
                  const isLowStock = varStock > 0 && varStock <= 5;
                  
                  const stockColor = isOutOfStock 
                    ? { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-100', label: 'Hết hàng' } 
                    : isLowStock 
                      ? { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', label: `Sắp hết (${varStock})` } 
                      : { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', label: `Còn hàng (${varStock})` };

                  const variantPrice = toNumber(variant.netPrice || variant.net_price);
                  const variantComparePrice = toNumber(variant.compareAtPrice || variant.compare_at_price);
                  const discountPercent = variantComparePrice > variantPrice && variantPrice > 0
                    ? Math.round((1 - variantPrice / variantComparePrice) * 100)
                    : 0;

                  return (
                    <Card key={variant.id || index} className="p-4 border-l-4 border-l-primary shadow-sm">
                      {/* Title & Status */}
                      <View className="flex-row justify-between items-start">
                        <View className="flex-1 pr-2">
                          <Text className="text-base font-outfit-bold text-text">
                            {variant.variantName || product.name}
                          </Text>
                          <Text className="text-[11px] font-inter text-muted mt-0.5">
                            Đơn vị: {String(variant.unit || 'đơn vị').toUpperCase()}
                          </Text>
                        </View>
                        <View className={`px-2.5 py-0.5 rounded-full border ${stockColor.bg} ${stockColor.text} ${stockColor.border}`}>
                          <Text className="text-[10px] font-inter-bold">{stockColor.label}</Text>
                        </View>
                      </View>

                      {/* Barcode & SKU Box (Crucial for Staff) */}
                      <View className="bg-slate-50 border border-slate-100 rounded-xl p-3 mt-3 flex-row justify-between items-center">
                        <View className="flex-1 pr-2 border-r border-slate-200">
                          <View className="flex-row items-center gap-1.5">
                            <Barcode size={13} color="#64748B" />
                            <Text className="text-[10px] font-inter text-muted">Barcode (Mã vạch)</Text>
                          </View>
                          <Text className="text-xs font-mono font-bold text-slate-800 mt-1 select-all" numberOfLines={1}>
                            {variant.barcode || '—'}
                          </Text>
                        </View>
                        <View className="flex-1 pl-3">
                          <View className="flex-row items-center gap-1.5">
                            <Tag size={13} color="#64748B" />
                            <Text className="text-[10px] font-inter text-muted">SKU (Mã lưu kho)</Text>
                          </View>
                          <Text className="text-xs font-mono font-bold text-slate-800 mt-1 select-all" numberOfLines={1}>
                            {variant.sku || '—'}
                          </Text>
                        </View>
                      </View>

                      {/* Prices Breakdown */}
                      <View className="flex-row justify-between items-center mt-3 pt-3 border-t border-slate-100">
                        <View>
                          <Text className="text-[10px] font-inter text-muted">Giá bán thực tế</Text>
                          <View className="flex-row items-baseline gap-2 mt-0.5">
                            <Text className="text-lg font-outfit-bold text-emerald-600">
                              {formatMoney(variantPrice)}
                            </Text>
                            {discountPercent > 0 && (
                              <Text className="text-[11px] font-inter text-muted line-through">
                                {formatMoney(variantComparePrice)}
                              </Text>
                            )}
                          </View>
                        </View>
                        
                        {discountPercent > 0 && (
                          <View className="px-2 py-0.5 rounded-lg bg-orange-100">
                            <Text className="text-[11px] font-inter-bold text-orange-700">Giảm {discountPercent}%</Text>
                          </View>
                        )}
                      </View>

                      {/* Details / Dimensions */}
                      <View className="flex-row flex-wrap mt-3 pt-3 border-t border-slate-100 -mx-1">
                        <SpecItem label="Khối lượng" value={variant.weightGram ? `${variant.weightGram}g` : '—'} />
                        <SpecItem label="Đóng gói" value={variant.packageSize || '—'} />
                        <SpecItem label="Màu sắc" value={variant.color || '—'} />
                        <SpecItem label="Kích thước" value={variant.size || '—'} />
                      </View>
                    </Card>
                  );
                })}
              </View>
            )}
          </View>

          {/* 4. Product Full Description */}
          {product.description && (
            <View className="px-4 mt-5">
              <View className="flex-row items-center gap-2 mb-3">
                <ShieldCheck size={18} color="#10B981" />
                <Text className="text-[15px] font-outfit-bold text-text">Mô tả sản phẩm</Text>
              </View>
              <Card className="p-4">
                <Text className="text-xs font-inter text-slate-600 leading-6">{product.description}</Text>
              </Card>
            </View>
          )}

        </ScrollView>
      )}
    </SafeAreaView>
  );
}

/* ── Auxiliary Subcomponents ────────────────────────────── */

function MetaItem({ icon, label, value, highlight = false }: { icon: React.ReactNode; label: string; value: string; highlight?: boolean }) {
  return (
    <View className="w-1/2 p-2">
      <View className="flex-row items-center gap-1.5">
        {icon}
        <Text className="text-[10px] font-inter text-muted uppercase tracking-wider">{label}</Text>
      </View>
      <Text 
        className={`text-sm mt-1 ${highlight ? 'font-outfit-bold text-primary-600' : 'font-inter-bold text-slate-800'}`}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

function SpecItem({ label, value }: { label: string; value: string }) {
  return (
    <View className="w-1/4 px-1">
      <Text className="text-[9px] font-inter text-muted uppercase tracking-wider">{label}</Text>
      <Text className="text-xs font-inter-bold text-slate-700 mt-0.5" numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function formatMoney(v: number) {
  if (!Number.isFinite(v)) return '—';
  return v.toLocaleString('vi-VN') + ' ₫';
}

function toNumber(v: unknown): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}
