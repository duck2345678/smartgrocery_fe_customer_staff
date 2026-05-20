import { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Animated,
  TouchableOpacity,
  Alert,
  Modal,
  StyleSheet,
} from 'react-native';
import {
  MessageSquare,
  Send,
  ShoppingCart,
  Plus,
  CheckCircle,
  CheckCheck,
  History,
  Trash2,
  Edit3,
  X,
  Menu,
  Sparkles,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { aiApi } from '../../../src/api/ai';
import { cartApi } from '../../../src/api/cart';
import { useAuthStore } from '../../../src/store/authStore';
import { chatHistoryApi, ChatSessionDto } from '../../../src/api/chatHistory';

const AI_LIST_CODE_PREFIX = 'AI-CHAT';

type ShoppingItem = {
  productId: number;
  variantId: number | null;
  name: string;
  imageUrl: string | null;
  price: number | null;
  unit: string;
  role: string;
};

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  shoppingItems?: ShoppingItem[];
}

const resolveImageUrl = (input: string | null | undefined): string => {
  const raw = typeof input === 'string' ? input.trim() : '';
  if (!raw) return 'https://dummyimage.com/400x400/22c55e/ffffff&text=SG';
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
  const base = (process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:8080/api/v1').replace(/\/api\/v1$/i, '').replace(/\/+$/, '');
  return raw.startsWith('/') ? `${base}${raw}` : `${base}/${raw}`;
};

const formatPrice = (price: number | null): string => {
  if (price == null) return '';
  return price.toLocaleString('vi-VN') + 'đ';
};

const formatDate = (dateStr: string): string => {
  try {
    const d = new Date(dateStr);
    return `${d.getDate()}/${d.getMonth() + 1} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  } catch {
    return '';
  }
};

export default function CustomerAiChatTab() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const userId = useAuthStore((s) => s.user?.id);
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Chào bạn! Mình là Trợ lý mua sắm AI của SmartGrocery. Mình có thể gợi ý thực đơn món ăn, giúp bạn kiểm tra nguyên liệu hay giải đáp mọi câu hỏi mua sắm. Bạn cần mình giúp gì hôm nay?',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [addedItems, setAddedItems] = useState<Set<number>>(new Set());
  const [addingItems, setAddingItems] = useState<Set<number>>(new Set());
  const [addingAll, setAddingAll] = useState(false);
  const [activeAiListCode, setActiveAiListCode] = useState(`${AI_LIST_CODE_PREFIX}-${Date.now()}`);

  // Persistent History States
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [sessions, setSessions] = useState<ChatSessionDto[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Custom Cross-platform Modal Rename States
  const [renamingSession, setRenamingSession] = useState<ChatSessionDto | null>(null);
  const [renamingTitle, setRenamingTitle] = useState('');

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const toastAnim = useRef(new Animated.Value(0)).current;
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flatListRef = useRef<FlatList>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastAnim.setValue(0);
    Animated.spring(toastAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();
    toastTimer.current = setTimeout(() => {
      Animated.timing(toastAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setToast(null));
    }, 3000);
  }, [toastAnim]);

  // Load chat session list
  const loadSessions = async () => {
    if (!userId) return;
    setIsLoadingSessions(true);
    try {
      const res = await chatHistoryApi.getSessions(0, 50);
      setSessions(res?.content || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  // Select/Open a past session
  const handleSelectSession = async (sessionId: number) => {
    setIsDrawerOpen(false);
    setLoading(true);
    try {
      const res = await chatHistoryApi.getSessionDetails(sessionId);
      setActiveSessionId(sessionId);
      
      if (res.messages && res.messages.length > 0) {
        const mapped: Message[] = res.messages.map((m) => ({
          id: m.id.toString(),
          role: m.role.toLowerCase() as 'user' | 'assistant',
          content: m.content,
          shoppingItems: m.shoppingItems || undefined,
        }));
        setMessages(mapped);
      } else {
        setMessages([]);
      }
    } catch (e) {
      showToast('Không thể tải lịch sử tin nhắn.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Start new session
  const handleStartNewChat = () => {
    setActiveSessionId(null);
    setIsDrawerOpen(false);
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: 'Chào bạn! Mình là Trợ lý mua sắm AI của SmartGrocery. Mình có thể gợi ý thực đơn món ăn, giúp bạn kiểm tra nguyên liệu hay giải đáp mọi câu hỏi mua sắm. Bạn cần mình giúp gì hôm nay?',
      },
    ]);
    setInput('');
  };

  // Rename action
  const handleRenameSession = async (sessionId: number, newTitle: string) => {
    try {
      await chatHistoryApi.renameSession(sessionId, newTitle);
      showToast('Đã đổi tên cuộc trò chuyện');
      void loadSessions();
    } catch {
      showToast('Không thể đổi tên cuộc trò chuyện.', 'error');
    }
  };

  // Delete action
  const handleDeleteSession = async (sessionId: number) => {
    try {
      await chatHistoryApi.deleteSession(sessionId);
      showToast('Đã xóa cuộc trò chuyện');
      if (activeSessionId === sessionId) {
        handleStartNewChat();
      }
      void loadSessions();
    } catch {
      showToast('Không thể xóa cuộc trò chuyện.', 'error');
    }
  };

  const confirmDelete = (session: ChatSessionDto) => {
    Alert.alert(
      'Xóa cuộc trò chuyện',
      `Bạn có chắc chắn muốn xóa "${session.title}" không?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => handleDeleteSession(session.id),
        },
      ]
    );
  };

  // Invalidate cart query to update badge count across all tabs
  const invalidateCart = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['cart'] });
  }, [queryClient]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const apiMessages = [...messages, userMessage].map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const res = await aiApi.askChat(apiMessages, userId, undefined, activeSessionId || undefined);

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: res.reply || 'Hệ thống đang gặp sự cố kết nối, xin lỗi bạn!',
        shoppingItems: res.shoppingItems && res.shoppingItems.length > 0 ? res.shoppingItems : undefined,
      };

      if (aiResponse.shoppingItems) {
        setAddedItems(new Set());
        setAddingItems(new Set());
        setActiveAiListCode(`${AI_LIST_CODE_PREFIX}-${Date.now()}`);
      }

      if (res.sessionId) {
        setActiveSessionId(res.sessionId);
        void loadSessions();
      }

      setMessages((prev) => [...prev, aiResponse]);
    } catch (error) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Có lỗi xảy ra khi gửi tin nhắn. Bạn vui lòng thử lại sau nhé!',
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  // Add single item — optimistic UI + parallel-safe
  const handleAddToCart = useCallback(async (item: ShoppingItem) => {
    if (!item.variantId || addingItems.has(item.productId) || addedItems.has(item.productId)) return;

    setAddingItems((prev) => new Set(prev).add(item.productId));
    try {
      await cartApi.addItem({
        variantId: item.variantId,
        quantity: 1,
        source: 'AI',
        aiListCode: activeAiListCode,
        aiListName: 'Danh sach AI tu chat',
      });
      setAddedItems((prev) => new Set(prev).add(item.productId));
      invalidateCart(); // Instant badge update!
    } catch {
      showToast('Không thể thêm sản phẩm vào giỏ hàng.', 'error');
    } finally {
      setAddingItems((prev) => {
        const next = new Set(prev);
        next.delete(item.productId);
        return next;
      });
    }
  }, [addingItems, addedItems, activeAiListCode, invalidateCart, showToast]);

  // Add ALL items in a single batch API call — fastest possible!
  const handleAddAllToCart = useCallback(async (items: ShoppingItem[]) => {
    const validItems = items.filter((i) => i.variantId != null && !addedItems.has(i.productId));
    if (validItems.length === 0) {
      showToast('Tất cả sản phẩm đã được thêm vào giỏ hàng!');
      return;
    }

    setAddingAll(true);
    try {
      await cartApi.batchAddItems(
        validItems.map((item) => ({ variantId: item.variantId!, quantity: 1 }))
          .map((item) => ({
            ...item,
            source: 'AI',
            aiListCode: activeAiListCode,
            aiListName: 'Danh sach AI tu chat',
          }))
      );
      setAddedItems(new Set(validItems.map((i) => i.productId)));
      invalidateCart();
      showToast(`✅ Đã thêm ${validItems.length} sản phẩm vào giỏ hàng thành công!`);
    } catch {
      showToast('Có lỗi xảy ra khi thêm vào giỏ hàng. Vui lòng thử lại!', 'error');
      invalidateCart();
    } finally {
      setAddingAll(false);
    }
  }, [addedItems, activeAiListCode, invalidateCart, showToast]);

  useEffect(() => {
    if (userId) {
      void loadSessions();
    } else {
      setSessions([]);
      setActiveSessionId(null);
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: 'Chào bạn! Mình là Trợ lý mua sắm AI của SmartGrocery. Vui lòng đăng nhập để lưu lịch sử cuộc trò chuyện nhé!',
        },
      ]);
    }
  }, [userId]);

  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages, loading]);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const renderShoppingItems = (items: ShoppingItem[]) => {
    const isMealIngredientList = items.some((i) => i.role === 'PRIMARY' || i.role === 'SECONDARY')
      && items.some((i) => i.role === 'SECONDARY'); // Only meal lists have SECONDARY items
    const primaryItems = items.filter((i) => i.role === 'PRIMARY');
    const secondaryItems = items.filter((i) => i.role === 'SECONDARY');
    const allAdded = items.every((i) => addedItems.has(i.productId));

    return (
      <View className="mt-3">
        {/* Add All button */}
        <Pressable
          onPress={() => handleAddAllToCart(items)}
          disabled={addingAll || allAdded}
          className={`flex-row items-center justify-center py-2.5 rounded-xl mb-3 ${
            allAdded ? 'bg-emerald-500' : addingAll ? 'bg-primary/60' : 'bg-primary active:bg-primary/90'
          }`}
        >
          {addingAll ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : allAdded ? (
            <CheckCheck size={16} color="#FFFFFF" />
          ) : (
            <ShoppingCart size={16} color="#FFFFFF" />
          )}
          <Text className="text-white font-outfit-bold text-sm ml-2">
            {allAdded ? 'Đã thêm tất cả!' : addingAll ? 'Đang thêm...' : `Thêm tất cả vào giỏ hàng (${items.length})`}
          </Text>
        </Pressable>

        {isMealIngredientList ? (
          /* Meal ingredient mode: show primary/secondary section headers */
          <>
            {primaryItems.length > 0 && (
              <>
                <Text className="text-xs font-outfit-bold text-primary mb-2 uppercase tracking-wide">📌 Nguyên liệu chính</Text>
                {primaryItems.map((item) => renderSingleItem(item))}
              </>
            )}
            {secondaryItems.length > 0 && (
              <>
                <Text className="text-xs font-outfit-bold text-muted mb-2 mt-2 uppercase tracking-wide">🧂 Gia vị & phụ liệu</Text>
                {secondaryItems.map((item) => renderSingleItem(item))}
              </>
            )}
          </>
        ) : (
          /* Product / discount list mode: flat list, no section headers */
          items.map((item) => renderSingleItem(item))
        )}
      </View>
    );
  };

  const renderSingleItem = (item: ShoppingItem) => {
    const isAdded = addedItems.has(item.productId);
    const isAdding = addingItems.has(item.productId);
    return (
      <View
        key={item.productId}
        className="flex-row items-center bg-background rounded-xl p-2.5 mb-2 border border-border"
      >
        <Pressable
          onPress={() => router.push(`/(customer)/products/${item.productId}` as never)}
          className="flex-row flex-1 items-center active:opacity-70"
        >
          <Image
            source={{ uri: resolveImageUrl(item.imageUrl) }}
            className="w-12 h-12 rounded-lg"
            resizeMode="cover"
          />
          <View className="flex-1 ml-3 mr-2">
            <Text className="text-sm font-inter-semibold text-text" numberOfLines={2}>
              {item.name}
            </Text>
            {item.price != null && (
              <Text className="text-xs font-inter text-primary mt-0.5">
                {formatPrice(item.price)}/{item.unit}
              </Text>
            )}
          </View>
        </Pressable>
        <Pressable
          onPress={() => handleAddToCart(item)}
          disabled={isAdded || isAdding}
          className={`w-9 h-9 rounded-xl items-center justify-center ${
            isAdded ? 'bg-emerald-100' : isAdding ? 'bg-primary/20' : 'bg-primary/10 active:bg-primary/20'
          }`}
        >
          {isAdding ? (
            <ActivityIndicator size="small" color="#10B981" />
          ) : isAdded ? (
            <CheckCircle size={18} color="#10B981" />
          ) : (
            <Plus size={18} color="#10B981" />
          )}
        </Pressable>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      className="flex-1 bg-slate-50"
    >
      {/* Redesigned Premium Header with Menu & Start New Chat buttons */}
      <View 
        style={{ paddingTop: Math.max(insets.top, 16), paddingBottom: 16 }}
        className="bg-primary flex-row items-center justify-between px-4 shadow-md z-10"
      >
        <TouchableOpacity
          onPress={() => setIsDrawerOpen(true)}
          disabled={!userId}
          className="w-10 h-10 items-center justify-center rounded-full bg-emerald-600/40 active:bg-emerald-600/60"
        >
          <History size={20} color="#FFFFFF" />
        </TouchableOpacity>

        <Text className="text-white text-lg font-outfit-bold text-center tracking-wide">Trợ lý Mua sắm AI</Text>

        <TouchableOpacity
          onPress={handleStartNewChat}
          className="w-10 h-10 items-center justify-center rounded-full bg-emerald-600/40 active:bg-emerald-600/60"
        >
          <Plus size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* History Slide-out Drawer Panel overlay */}
      {isDrawerOpen && (
        <View style={StyleSheet.absoluteFillObject} className="z-30 flex-row">
          {/* Backdrop */}
          <Pressable 
            className="absolute inset-0 bg-black/50" 
            onPress={() => setIsDrawerOpen(false)}
          />

          {/* Drawer content */}
          <View className="w-[80%] h-full bg-white shadow-2xl z-40 p-4" style={{ paddingTop: Math.max(insets.top, 20) }}>
            <View className="flex-row items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <View className="flex-row items-center">
                <Sparkles size={18} color="#059669" className="mr-2" />
                <Text className="font-outfit-bold text-[16px] text-slate-800">Lịch sử AI Chat</Text>
              </View>
              <TouchableOpacity onPress={() => setIsDrawerOpen(false)} className="p-1">
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Quick "+ New Chat" in drawer */}
            <Pressable
              onPress={handleStartNewChat}
              className="flex-row items-center justify-center bg-emerald-50 border border-emerald-200 py-3 rounded-xl mb-4 active:bg-emerald-100"
            >
              <Plus size={16} color="#059669" className="mr-1.5" />
              <Text className="text-emerald-700 font-outfit-bold text-sm">Cuộc trò chuyện mới</Text>
            </Pressable>

            {/* Sessions List */}
            {isLoadingSessions ? (
              <View className="flex-1 justify-center items-center">
                <ActivityIndicator color="#059669" size="small" />
              </View>
            ) : sessions.length === 0 ? (
              <View className="flex-1 justify-center items-center p-4">
                <MessageSquare size={32} color="#CBD5E1" className="mb-2" />
                <Text className="text-xs font-inter text-slate-400 text-center">Chưa có cuộc trò chuyện nào trước đây.</Text>
              </View>
            ) : (
              <FlatList
                data={sessions}
                keyExtractor={(item) => item.id.toString()}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => {
                  const isActive = activeSessionId === item.id;
                  return (
                    <View 
                      className={`flex-row items-center rounded-xl p-3 mb-2 border ${
                        isActive ? 'bg-emerald-50/70 border-emerald-200' : 'bg-slate-50 border-slate-100 active:bg-slate-100'
                      }`}
                    >
                      <Pressable 
                        onPress={() => handleSelectSession(item.id)}
                        className="flex-1 pr-2"
                      >
                        <Text 
                          numberOfLines={1} 
                          className={`text-sm font-inter-semibold ${
                            isActive ? 'text-emerald-800' : 'text-slate-700'
                          }`}
                        >
                          {item.title}
                        </Text>
                        <Text className="text-[10px] font-inter text-slate-400 mt-1">
                          Cập nhật: {formatDate(item.updatedAt)}
                        </Text>
                      </Pressable>
                      
                      <View className="flex-row space-x-2">
                        <TouchableOpacity
                          onPress={() => {
                            setRenamingSession(item);
                            setRenamingTitle(item.title);
                          }}
                          className="p-1.5 rounded-lg bg-white border border-slate-200 active:bg-slate-50"
                        >
                          <Edit3 size={12} color="#64748B" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => confirmDelete(item)}
                          className="p-1.5 rounded-lg bg-white border border-rose-100 active:bg-rose-50"
                        >
                          <Trash2 size={12} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                }}
              />
            )}
          </View>
        </View>
      )}

      {/* Cross-platform Premium Custom Rename Modal */}
      <Modal
        visible={renamingSession !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setRenamingSession(null)}
      >
        <View className="flex-1 items-center justify-center bg-black/60 px-4">
          <View className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl">
            <Text className="text-base font-outfit-bold text-slate-800 mb-2">Đổi tên cuộc trò chuyện</Text>
            <Text className="text-xs font-inter text-slate-400 mb-4">Nhập tiêu đề mới cho cuộc trò chuyện này:</Text>
            <TextInput
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-inter mb-6 text-sm"
              value={renamingTitle}
              onChangeText={setRenamingTitle}
              placeholder="Nhập tiêu đề..."
              autoFocus
            />
            <View className="flex-row justify-end space-x-3">
              <Pressable
                onPress={() => setRenamingSession(null)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 active:bg-slate-50"
              >
                <Text className="font-inter-semibold text-slate-600 text-sm">Hủy</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  if (renamingSession && renamingTitle.trim()) {
                    void handleRenameSession(renamingSession.id, renamingTitle.trim());
                    setRenamingSession(null);
                  }
                }}
                className="px-5 py-2.5 rounded-xl bg-primary active:bg-primary/95"
              >
                <Text className="font-inter-semibold text-white text-sm">Lưu</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Toast Notification */}
      {toast && (
        <Animated.View
          style={{
            position: 'absolute',
            top: Math.max(insets.top, 16) + 60,
            left: 16,
            right: 16,
            zIndex: 999,
            opacity: toastAnim,
            transform: [{ translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
          }}
        >
          <View
            style={{
              backgroundColor: toast.type === 'success' ? '#10B981' : '#EF4444',
              borderRadius: 14,
              paddingHorizontal: 16,
              paddingVertical: 12,
              flexDirection: 'row',
              alignItems: 'center',
              shadowColor: '#000',
              shadowOpacity: 0.15,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 4 },
              elevation: 8,
            }}
          >
            <Text style={{ color: '#fff', fontFamily: 'Inter-Bold', fontSize: 14, flex: 1, flexWrap: 'wrap' }}>
              {toast.message}
            </Text>
          </View>
        </Animated.View>
      )}

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 20, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const isUser = item.role === 'user';
          return (
            <View className={`flex-row mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
              {!isUser && (
                <View className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-200 items-center justify-center mr-2 self-start shadow-sm">
                  <MessageSquare size={15} color="#10B981" />
                </View>
              )}
              <View
                className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                  isUser
                    ? 'bg-primary rounded-tr-none shadow-sm'
                    : 'bg-white border border-slate-100 rounded-tl-none shadow-sm'
                }`}
              >
                <Text
                  className={`text-[14px] font-inter leading-5 ${
                    isUser ? 'text-white font-inter-semibold' : 'text-slate-800'
                  }`}
                >
                  {item.content}
                </Text>
                {/* Shopping Items Interactive List */}
                {!isUser && item.shoppingItems && item.shoppingItems.length > 0 && (
                  renderShoppingItems(item.shoppingItems)
                )}
              </View>
            </View>
          );
        }}
        ListFooterComponent={
          loading ? (
            <View className="flex-row items-center mb-4 justify-start pl-10">
              <View className="bg-white border border-slate-100 px-4 py-3 rounded-2xl rounded-tl-none flex-row items-center shadow-sm">
                <ActivityIndicator size="small" color="#10B981" className="mr-2" />
                <Text className="text-xs font-inter text-muted">AI đang soạn câu trả lời...</Text>
              </View>
            </View>
          ) : null
        }
      />

      {/* Redesigned Premium Input Area */}
      <View 
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}
        className="p-4 bg-primary border-t border-emerald-600 flex-row items-center z-10 shadow-lg"
      >
        <View className="flex-1 bg-white rounded-3xl flex-row items-center px-4 py-1.5 border border-emerald-100 shadow-inner">
          <TextInput
            className="flex-1 text-slate-800 font-inter text-sm max-h-24 py-1"
            placeholder="Hỏi AI món ngon, giảm giá hôm nay..."
            placeholderTextColor="#94A3B8"
            value={input}
            onChangeText={setInput}
            multiline
          />
          <TouchableOpacity
            onPress={sendMessage}
            disabled={!input.trim() || loading}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: input.trim() && !loading ? '#16A34A' : '#F1F5F9',
              marginLeft: 8,
            }}
          >
            <Send size={15} color={input.trim() && !loading ? '#FFFFFF' : '#94A3B8'} />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
