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
  Trash2,
  ChevronDown,
  ChevronUp,
  Search,
  ShoppingBag,
  Utensils,
  X,
  CheckCircle2,
} from 'lucide-react-native';
import { useAuthStore } from '../../src/store/authStore';
import { smartListsApi, type SmartList } from '../../src/api/smartLists';
import { productApi } from '../../src/api/products';
import Card from '../../src/components/ui/Card';

const TYPE_LABELS: Record<SmartList['type'], string> = {
  SHOPPING: 'Mua sắm',
  MEAL_PLAN: 'Thực đơn',
};

const TYPE_COLORS: Record<SmartList['type'], string> = {
  SHOPPING: '#3B82F6',
  MEAL_PLAN: '#F97316',
};

function formatDate(s: string) {
  if (!s) return '';
  return new Date(s).toLocaleDateString('vi-VN');
}

export default function SmartListsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const userId = user?.id ?? 0;

  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createType, setCreateType] = useState<SmartList['type']>('SHOPPING');
  const [addToListId, setAddToListId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const listsQuery = useQuery({
    queryKey: ['smart-lists', userId],
    queryFn: () => smartListsApi.getUserLists(userId),
    enabled: !!userId,
    staleTime: 30_000,
  });

  const productsQuery = useQuery({
    queryKey: ['products-search-sl', searchQuery],
    queryFn: () => productApi.getProducts({ search: searchQuery || undefined, size: 30 }),
    enabled: addToListId !== null,
    staleTime: 60_000,
  });

  const createMutation = useMutation({
    mutationFn: () => smartListsApi.createList(userId, createName.trim(), createType),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['smart-lists', userId] });
      setShowCreate(false);
      setCreateName('');
      setCreateType('SHOPPING');
    },
    onError: (e: Error) => Alert.alert('Lỗi', e.message),
  });

  const deleteListMutation = useMutation({
    mutationFn: (listId: number) => smartListsApi.deleteList(listId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['smart-lists', userId] });
      setExpandedId(null);
    },
    onError: (e: Error) => Alert.alert('Lỗi', e.message),
  });

  const addItemMutation = useMutation({
    mutationFn: ({ listId, variantId }: { listId: number; variantId: number }) =>
      smartListsApi.addItem(listId, variantId, 1),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['smart-lists', userId] }),
    onError: (e: Error) => Alert.alert('Lỗi', e.message),
  });

  const removeItemMutation = useMutation({
    mutationFn: (itemId: number) => smartListsApi.removeItem(itemId),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['smart-lists', userId] }),
    onError: (e: Error) => Alert.alert('Lỗi', e.message),
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await listsQuery.refetch();
    setRefreshing(false);
  };

  const confirmDeleteList = (listId: number, name: string) => {
    Alert.alert('Xoá danh sách', `Xoá "${name}"?`, [
      { text: 'Huỷ', style: 'cancel' },
      { text: 'Xoá', style: 'destructive', onPress: () => deleteListMutation.mutate(listId) },
    ]);
  };

  const openAddItem = (listId: number) => {
    setAddToListId(listId);
    setSearchQuery('');
  };

  const closeAddItem = () => {
    setAddToListId(null);
    setSearchQuery('');
  };

  const lists = listsQuery.data ?? [];

  const currentList = addToListId != null ? lists.find((l) => l.id === addToListId) : null;
  const addedVariantIds = new Set(currentList?.items.map((i) => i.variant.id) ?? []);

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
          <Text className="text-xl font-outfit-bold text-text">Danh sách thông minh</Text>
          <Text className="text-xs font-inter text-muted mt-0.5">Lưu sản phẩm cần mua</Text>
        </View>
        <Pressable
          onPress={() => setShowCreate(true)}
          className="w-10 h-10 rounded-2xl bg-primary items-center justify-center"
        >
          <Plus size={20} color="#fff" />
        </Pressable>
      </View>

      {/* Body */}
      <View className="flex-1 px-4 pb-4">
        {listsQuery.isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#22C55E" />
            <Text className="text-xs font-inter text-muted mt-2">Đang tải…</Text>
          </View>
        ) : listsQuery.isError ? (
          <Card className="p-4 mt-4">
            <Text className="font-inter-bold text-text">Không tải được danh sách.</Text>
            <Pressable
              onPress={() => void listsQuery.refetch()}
              className="mt-3 px-4 py-3 rounded-2xl bg-primary items-center"
            >
              <Text className="font-outfit-bold text-primary-fg">Thử lại</Text>
            </Pressable>
          </Card>
        ) : lists.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <View className="w-16 h-16 rounded-full bg-surface border border-border items-center justify-center mb-4">
              <ShoppingBag size={28} color="#64748B" />
            </View>
            <Text className="text-sm font-inter-bold text-text">Chưa có danh sách nào</Text>
            <Text className="text-xs font-inter text-muted mt-1 text-center">
              Nhấn + để tạo danh sách mua sắm đầu tiên.
            </Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={{ paddingTop: 10, paddingBottom: 18, gap: 10 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
            showsVerticalScrollIndicator={false}
          >
            {lists.map((list) => {
              const isExpanded = expandedId === list.id;
              return (
                <Card key={list.id} className="p-4">
                  {/* List header */}
                  <Pressable
                    onPress={() => setExpandedId(isExpanded ? null : list.id)}
                    className="flex-row items-center"
                  >
                    <View
                      className="w-10 h-10 rounded-2xl items-center justify-center mr-3"
                      style={{ backgroundColor: TYPE_COLORS[list.type] + '20' }}
                    >
                      {list.type === 'MEAL_PLAN' ? (
                        <Utensils size={18} color={TYPE_COLORS[list.type]} />
                      ) : (
                        <ShoppingBag size={18} color={TYPE_COLORS[list.type]} />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text className="font-inter-bold text-text">{list.name}</Text>
                      <View className="flex-row items-center mt-1" style={{ gap: 6 }}>
                        <View
                          style={{
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                            borderRadius: 99,
                            backgroundColor: TYPE_COLORS[list.type] + '20',
                          }}
                        >
                          <Text style={{ fontSize: 10, fontWeight: '700', color: TYPE_COLORS[list.type] }}>
                            {TYPE_LABELS[list.type]}
                          </Text>
                        </View>
                        <Text className="text-xs font-inter text-muted">
                          {list.items.length} sản phẩm · {formatDate(list.createdAt)}
                        </Text>
                      </View>
                    </View>
                    {isExpanded ? (
                      <ChevronUp size={18} color="#94A3B8" />
                    ) : (
                      <ChevronDown size={18} color="#94A3B8" />
                    )}
                  </Pressable>

                  {/* Expanded content */}
                  {isExpanded ? (
                    <View className="mt-4">
                      {list.items.length > 0 ? (
                        <View style={{ gap: 8 }}>
                          {list.items.map((item) => (
                            <View
                              key={item.id}
                              className="flex-row items-center justify-between bg-surface rounded-2xl px-3 py-2"
                            >
                              <View style={{ flex: 1 }}>
                                <Text className="text-sm font-inter-bold text-text" numberOfLines={1}>
                                  {item.variant.name}
                                </Text>
                                <Text className="text-xs font-inter text-muted">
                                  x{item.quantity}
                                  {item.variant.unit ? ` · ${item.variant.unit}` : ''}
                                  {item.variant.price > 0
                                    ? ` · ${item.variant.price.toLocaleString('vi-VN')}₫`
                                    : ''}
                                </Text>
                              </View>
                              <Pressable
                                onPress={() => removeItemMutation.mutate(item.id)}
                                disabled={removeItemMutation.isPending}
                                className="w-8 h-8 items-center justify-center rounded-xl"
                              >
                                {removeItemMutation.isPending ? (
                                  <ActivityIndicator size="small" color="#EF4444" />
                                ) : (
                                  <Trash2 size={15} color="#EF4444" />
                                )}
                              </Pressable>
                            </View>
                          ))}
                        </View>
                      ) : (
                        <Text className="text-xs font-inter text-muted text-center py-3">
                          Danh sách trống. Thêm sản phẩm bên dưới.
                        </Text>
                      )}

                      <View className="flex-row mt-3" style={{ gap: 8 }}>
                        <Pressable
                          onPress={() => openAddItem(list.id)}
                          className="flex-1 py-2.5 rounded-2xl border border-primary items-center flex-row justify-center"
                          style={{ gap: 6 }}
                        >
                          <Plus size={15} color="#22C55E" />
                          <Text className="text-sm font-inter-bold text-primary">Thêm sản phẩm</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => confirmDeleteList(list.id, list.name)}
                          disabled={deleteListMutation.isPending}
                          className="w-10 h-10 rounded-2xl border border-red-200 bg-red-50 items-center justify-center"
                        >
                          {deleteListMutation.isPending ? (
                            <ActivityIndicator size="small" color="#EF4444" />
                          ) : (
                            <Trash2 size={16} color="#EF4444" />
                          )}
                        </Pressable>
                      </View>
                    </View>
                  ) : null}
                </Card>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* Create List Modal */}
      <Modal visible={showCreate} transparent animationType="fade" onRequestClose={() => setShowCreate(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
          <View className="bg-white rounded-t-3xl p-6 pb-10">
            <View className="flex-row items-center justify-between mb-5">
              <Text className="text-lg font-outfit-bold text-text">Tạo danh sách mới</Text>
              <Pressable onPress={() => setShowCreate(false)}>
                <X size={22} color="#64748B" />
              </Pressable>
            </View>

            <Text className="text-sm font-inter-bold text-text mb-2">Tên danh sách</Text>
            <TextInput
              value={createName}
              onChangeText={setCreateName}
              placeholder="VD: Thực phẩm tuần này"
              placeholderTextColor="#94A3B8"
              className="border border-border rounded-2xl px-4 py-3 font-inter text-text mb-4"
              autoFocus
            />

            <Text className="text-sm font-inter-bold text-text mb-2">Loại</Text>
            <View className="flex-row" style={{ gap: 10 }}>
              {(['SHOPPING', 'MEAL_PLAN'] as const).map((t) => (
                <Pressable
                  key={t}
                  onPress={() => setCreateType(t)}
                  className="flex-1 py-3 rounded-2xl border items-center"
                  style={{
                    borderColor: createType === t ? TYPE_COLORS[t] : '#E2E8F0',
                    backgroundColor: createType === t ? TYPE_COLORS[t] + '15' : '#F8FAFC',
                  }}
                >
                  <Text
                    className="font-inter-bold text-sm"
                    style={{ color: createType === t ? TYPE_COLORS[t] : '#64748B' }}
                  >
                    {TYPE_LABELS[t]}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              onPress={() => {
                if (!createName.trim()) return;
                createMutation.mutate();
              }}
              disabled={!createName.trim() || createMutation.isPending}
              className="mt-5 py-4 rounded-2xl bg-primary items-center"
              style={{ opacity: !createName.trim() || createMutation.isPending ? 0.5 : 1 }}
            >
              {createMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="font-outfit-bold text-primary-fg">Tạo danh sách</Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Add Product Modal */}
      <Modal
        visible={addToListId !== null}
        transparent
        animationType="slide"
        onRequestClose={closeAddItem}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
          <View className="bg-white rounded-t-3xl" style={{ maxHeight: '80%' }}>
            <View className="px-6 pt-6 pb-3">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-lg font-outfit-bold text-text">Thêm sản phẩm</Text>
                <Pressable onPress={closeAddItem}>
                  <X size={22} color="#64748B" />
                </Pressable>
              </View>

              <View className="flex-row items-center border border-border rounded-2xl px-4 bg-surface">
                <Search size={16} color="#94A3B8" />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Tìm sản phẩm…"
                  placeholderTextColor="#94A3B8"
                  className="flex-1 ml-2 py-3 font-inter text-text"
                  autoFocus
                />
                {searchQuery.length > 0 ? (
                  <Pressable onPress={() => setSearchQuery('')}>
                    <X size={14} color="#94A3B8" />
                  </Pressable>
                ) : null}
              </View>
            </View>

            <ScrollView
              contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32, gap: 8 }}
              keyboardShouldPersistTaps="handled"
            >
              {productsQuery.isLoading ? (
                <View className="py-8 items-center">
                  <ActivityIndicator color="#22C55E" />
                </View>
              ) : (productsQuery.data ?? []).length === 0 ? (
                <View className="py-8 items-center">
                  <Text className="text-sm font-inter text-muted">
                    {searchQuery ? 'Không tìm thấy sản phẩm.' : 'Nhập tên để tìm kiếm.'}
                  </Text>
                </View>
              ) : (
                (productsQuery.data ?? []).map((product) => {
                  if (!product.variantId) return null;
                  const alreadyAdded = addedVariantIds.has(product.variantId);
                  return (
                    <Pressable
                      key={product.id}
                      onPress={() => {
                        if (alreadyAdded || !addToListId || !product.variantId) return;
                        addItemMutation.mutate({ listId: addToListId, variantId: product.variantId });
                      }}
                      disabled={alreadyAdded || addItemMutation.isPending}
                      className="flex-row items-center justify-between bg-surface rounded-2xl px-4 py-3 border border-border"
                      style={{ opacity: alreadyAdded ? 0.6 : 1 }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text className="text-sm font-inter-bold text-text" numberOfLines={1}>
                          {product.name}
                        </Text>
                        <Text className="text-xs font-inter text-muted">
                          {product.price > 0 ? `${product.price.toLocaleString('vi-VN')}₫` : ''}
                          {product.unit ? ` · ${product.unit}` : ''}
                        </Text>
                      </View>
                      {alreadyAdded ? (
                        <CheckCircle2 size={18} color="#22C55E" />
                      ) : (
                        <View className="w-8 h-8 rounded-xl bg-primary items-center justify-center">
                          <Plus size={15} color="#fff" />
                        </View>
                      )}
                    </Pressable>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
