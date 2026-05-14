import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ActivityIndicator,
  useColorScheme,
  ScrollView,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Send, ThumbsUp, ThumbsDown, Sparkles, ShoppingCart, ChevronDown, AlertTriangle, ChefHat, Salad, Search } from 'lucide-react-native';

import { useAuthStore } from '../../../src/store/authStore';
import { useCart } from '../../../src/hooks/useCart';
import { aiApi } from '../../../src/api/ai';
import { productApi } from '../../../src/api/products';
import type { AiChatResponse, ProposedItem } from '../../../src/types/ai';
import type { Product } from '../../../src/types/product';
import { safeImpact, safeNotification, ImpactFeedbackStyle, NotificationFeedbackType } from '../../../src/utils/safeHaptics';

// ─── Types ───────────────────────────────────────────────────────
type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  trustScore?: number;
  proposedItems?: ProposedItem[];
  removeVariantIds?: number[];
  removeReasons?: Record<number, string>;
  explanations?: Record<number, string>;
  feedbackType?: 'HELPFUL' | 'NOT_HELPFUL' | null;
  expectationPrompt?: string | null;
};

type ProductMeta = Pick<Product, 'id' | 'name' | 'price' | 'imageUrl' | 'stock' | 'unit'>;

// ─── Quick Suggestion Chips (MEMM: Motivation Trigger) ──────────
const QUICK_SUGGESTIONS = [
  { label: '🍳 Bữa tối healthy', icon: ChefHat, message: 'Gợi ý bữa tối healthy cho gia đình' },
  { label: '🥗 Giảm cân', icon: Salad, message: 'Tôi muốn giảm cân, gợi ý thực đơn phù hợp' },
  { label: '🛒 Kiểm tra giỏ', icon: ShoppingCart, message: 'Kiểm tra giỏ hàng của tôi có an toàn không' },
  { label: '🔍 Tìm thay thế', icon: Search, message: 'Gợi ý sản phẩm thay thế lành mạnh hơn' },
];

// ─── Typing Indicator ───────────────────────────────────────────
function TypingIndicator() {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
        ])
      );
    animate(dot1, 0).start();
    animate(dot2, 200).start();
    animate(dot3, 400).start();
  }, []);

  const dotStyle = (anim: Animated.Value) => ({
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16A34A',
    marginHorizontal: 3,
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, -6] }) }],
  });

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 20, paddingVertical: 12 }}>
      <View style={{
        backgroundColor: 'rgba(22, 163, 74, 0.08)',
        borderRadius: 20,
        borderTopLeftRadius: 4,
        paddingHorizontal: 20,
        paddingVertical: 14,
        flexDirection: 'row',
        alignItems: 'center',
      }}>
        <Animated.View style={dotStyle(dot1)} />
        <Animated.View style={dotStyle(dot2)} />
        <Animated.View style={dotStyle(dot3)} />
      </View>
    </View>
  );
}

function MessageAppear({ children }: { children: React.ReactNode }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start();
  }, [opacity, translateY]);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}

// ─── Product Card (MEMM: Trust Building — inline recommendation) ─
function ProductCard({ item, explanation, productMeta, isAdded, onAddToCart }: {
  item: ProposedItem;
  explanation?: string;
  productMeta?: ProductMeta;
  isAdded?: boolean;
  onAddToCart: (productId: number, quantity: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={{
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      padding: 14,
      marginTop: 8,
      borderWidth: 1,
      borderColor: '#E2E8F0',
      shadowColor: '#0F172A',
      shadowOpacity: 0.04,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
    }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#F1F5F9', marginRight: 10, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
          {productMeta?.imageUrl ? (
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            <Animated.Image source={{ uri: productMeta.imageUrl }} style={{ width: 44, height: 44 }} />
          ) : (
            <ShoppingCart size={16} color="#94A3B8" />
          )}
        </View>
        <View style={{ flex: 1, marginRight: 12 }}>
          <Text style={{ fontSize: 14, fontFamily: 'Outfit-Bold', color: '#1E293B' }} numberOfLines={2}>
            {productMeta?.name || `Sản phẩm #${item.productId}`}
          </Text>
          <Text style={{ fontSize: 12, fontFamily: 'Inter', color: '#64748B', marginTop: 2 }}>SL: {Math.min(item.quantity, 999)} sản phẩm</Text>
          {productMeta?.price != null && (
            <Text style={{ fontSize: 12, fontFamily: 'Inter-Bold', color: '#16A34A', marginTop: 2 }}>
              {productMeta.price.toLocaleString('vi-VN')}₫ {productMeta.unit ? `/ ${productMeta.unit}` : ''}
            </Text>
          )}
        </View>
        <Pressable
          onPress={() => {
            if (!isAdded) {
              onAddToCart(item.productId, item.quantity);
              safeNotification(NotificationFeedbackType.Success);
            }
          }}
          disabled={isAdded || productMeta?.stock === 0}
          style={{
            backgroundColor: isAdded ? '#F1F5F9' : (productMeta?.stock === 0 ? '#CBD5E1' : '#16A34A'),
            borderRadius: 12,
            paddingHorizontal: 14,
            paddingVertical: 8,
            flexDirection: 'row',
            alignItems: 'center',
            borderWidth: isAdded ? 1 : 0,
            borderColor: '#E2E8F0',
          }}
        >
          <ShoppingCart size={14} color={isAdded ? '#94A3B8' : '#fff'} />
          <Text style={{ 
            color: isAdded ? '#94A3B8' : '#fff', 
            fontSize: 12, 
            fontFamily: 'Inter-Bold', 
            marginLeft: 6 
          }}>
            {isAdded ? 'Đã thêm' : (productMeta?.stock === 0 ? 'Hết hàng' : 'Thêm')}
          </Text>
        </Pressable>
      </View>

      {/* MEMM Trust Building: Expandable Reason & Nutrition (Accordion) */}
      {(item.reason || explanation || item.nutritionFacts) && (
        <Pressable onPress={() => setExpanded(!expanded)} style={{ marginTop: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Sparkles size={12} color="#F59E0B" />
            <Text style={{ fontSize: 11, fontFamily: 'Inter', color: '#F59E0B', marginLeft: 4 }}>
              {expanded ? 'Ẩn chi tiết' : 'Xem lý do & dinh dưỡng'}
            </Text>
            <ChevronDown size={12} color="#F59E0B" style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }} />
          </View>
          {expanded && (
            <View style={{ marginTop: 6, backgroundColor: '#F8FAFC', borderRadius: 8, padding: 8 }}>
              {(item.reason || explanation) && (
                <Text style={{ fontSize: 12, fontFamily: 'Inter', color: '#475569', lineHeight: 18, marginBottom: 6 }}>
                  Lý do: {item.reason || explanation}
                </Text>
              )}
              
              {item.nutritionFacts && (
                <View style={{ flexDirection: 'row', gap: 12, borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 6 }}>
                  {item.nutritionFacts.calories !== undefined && (
                    <Text style={{ fontSize: 11, fontFamily: 'Inter-Bold', color: '#16A34A' }}>
                      🔥 {item.nutritionFacts.calories} kcal
                    </Text>
                  )}
                  {item.nutritionFacts.protein !== undefined && (
                    <Text style={{ fontSize: 11, fontFamily: 'Inter-Bold', color: '#16A34A' }}>
                      💪 {item.nutritionFacts.protein}g đạm
                    </Text>
                  )}
                </View>
              )}

              {item.allergyWarning && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                  <AlertTriangle size={10} color="#16A34A" />
                  <Text style={{ fontSize: 10, fontFamily: 'Inter', color: '#16A34A', marginLeft: 4 }}>
                    {item.allergyWarning}
                  </Text>
                </View>
              )}
            </View>
          )}
        </Pressable>
      )}
    </View>
  );
}

// ─── Feedback Buttons (MEMM: Expectation Management — Inline) ───
function FeedbackButtons({ messageId, currentFeedback, onFeedback }: {
  messageId: string;
  currentFeedback?: 'HELPFUL' | 'NOT_HELPFUL' | null;
  onFeedback: (messageId: string, type: 'HELPFUL' | 'NOT_HELPFUL') => void;
}) {
  return (
    <View style={{ flexDirection: 'row', marginTop: 8, gap: 8 }}>
      <Pressable
        onPress={() => onFeedback(messageId, 'HELPFUL')}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 10,
          paddingVertical: 5,
          borderRadius: 20,
          backgroundColor: currentFeedback === 'HELPFUL' ? '#DCFCE7' : '#F1F5F9',
        }}
      >
        <ThumbsUp size={13} color={currentFeedback === 'HELPFUL' ? '#16A34A' : '#94A3B8'} />
        <Text style={{
          fontSize: 11, fontFamily: 'Inter', marginLeft: 4,
          color: currentFeedback === 'HELPFUL' ? '#16A34A' : '#94A3B8',
        }}>Hữu ích</Text>
      </Pressable>
      <Pressable
        onPress={() => onFeedback(messageId, 'NOT_HELPFUL')}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 10,
          paddingVertical: 5,
          borderRadius: 20,
          backgroundColor: currentFeedback === 'NOT_HELPFUL' ? '#FEE2E2' : '#F1F5F9',
        }}
      >
        <ThumbsDown size={13} color={currentFeedback === 'NOT_HELPFUL' ? '#EF4444' : '#94A3B8'} />
        <Text style={{
          fontSize: 11, fontFamily: 'Inter', marginLeft: 4,
          color: currentFeedback === 'NOT_HELPFUL' ? '#EF4444' : '#94A3B8',
        }}>Chưa tốt</Text>
      </Pressable>
    </View>
  );
}

function ConflictWarning({ removeVariantIds, removeReasons }: {
  removeVariantIds: number[];
  removeReasons: Record<number, string>;
}) {
  if (!removeVariantIds || removeVariantIds.length === 0) return null;
  return (
    <View style={{
      backgroundColor: '#FFF1F2',
      borderRadius: 12,
      padding: 12,
      marginTop: 8,
      borderWidth: 1,
      borderColor: '#FECACA',
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
        <AlertTriangle size={16} color="#EF4444" />
        <Text style={{ fontSize: 13, fontFamily: 'Outfit-Bold', color: '#B91C1C', marginLeft: 6 }}>
          Cảnh báo an toàn giỏ hàng
        </Text>
      </View>
      {removeVariantIds.map((id) => (
        <Text key={id} style={{ fontSize: 12, fontFamily: 'Inter', color: '#991B1B', marginTop: 4, lineHeight: 18 }}>
          ⚠️ **{removeReasons[id] || `Variant #${id} cần loại bỏ`}**
        </Text>
      ))}
    </View>
  );
}

// ─── Rich Markdown Renderer ─────────────────────────────────────
function FormattedText({ text, style }: { text: string; style: any }) {
  // Normalize: convert literal \n sequences to real newlines
  const normalized = text
    .replace(/\\n/g, '\n')       // literal \n → real newline
    .replace(/\r\n/g, '\n')     // Windows line endings
    .replace(/\r/g, '\n');       // old Mac line endings
  const blocks = normalized.split('\n');

  return (
    <View>
      {blocks.map((line, lineIdx) => {
        const trimmed = line.trim();

        // Empty line → spacer
        if (!trimmed) {
          return <View key={lineIdx} style={{ height: 6 }} />;
        }

        // Section header: lines starting with emoji + bold (e.g., "🍽️ **Thực đơn:**")
        const sectionMatch = trimmed.match(/^([\u{1F300}-\u{1FAD6}\u{2600}-\u{27BF}]+)\s*\*\*(.*?)\*\*/u);
        if (sectionMatch) {
          const emoji = sectionMatch[1];
          const title = sectionMatch[2];
          const rest = trimmed.slice(sectionMatch[0].length).trim();
          return (
            <View key={lineIdx} style={{ marginTop: lineIdx > 0 ? 10 : 0, marginBottom: 4 }}>
              <Text style={{ fontSize: 15, fontFamily: 'Outfit-Bold', color: style?.color || '#1E293B', lineHeight: 22 }}>
                {emoji} {title}
              </Text>
              {rest ? <RichInlineText text={rest} baseStyle={style} /> : null}
            </View>
          );
        }

        // Numbered list: "1. ", "2. "
        const numberedMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (numberedMatch) {
          return (
            <View key={lineIdx} style={{ flexDirection: 'row', paddingLeft: 4, marginTop: 6, marginBottom: 2 }}>
              <View style={{
                width: 22, height: 22, borderRadius: 11,
                backgroundColor: 'rgba(22,163,74,0.12)',
                alignItems: 'center', justifyContent: 'center',
                marginRight: 8, marginTop: 1,
              }}>
                <Text style={{ fontSize: 11, fontFamily: 'Inter-Bold', color: '#16A34A' }}>
                  {numberedMatch[1]}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <RichInlineText text={numberedMatch[2]} baseStyle={style} />
              </View>
            </View>
          );
        }

        // Bullet list: "- " or "• "
        const bulletMatch = trimmed.match(/^[-•]\s+(.*)/);
        if (bulletMatch) {
          return (
            <View key={lineIdx} style={{ flexDirection: 'row', paddingLeft: 8, marginTop: 4, marginBottom: 2 }}>
              <Text style={{ fontSize: 8, color: '#16A34A', marginRight: 8, marginTop: 6, lineHeight: 20 }}>●</Text>
              <View style={{ flex: 1 }}>
                <RichInlineText text={bulletMatch[1]} baseStyle={style} />
              </View>
            </View>
          );
        }

        // Regular text
        return (
          <View key={lineIdx} style={{ marginTop: lineIdx > 0 ? 2 : 0 }}>
            <RichInlineText text={trimmed} baseStyle={style} />
          </View>
        );
      })}
    </View>
  );
}

/** Renders inline text with **bold**, *italic*, and — separators */
function RichInlineText({ text, baseStyle }: { text: string; baseStyle: any }) {
  // Split by **bold** and *italic* patterns
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|—)/g);

  return (
    <Text style={{ ...baseStyle, lineHeight: 22 }}>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <Text key={i} style={{ fontFamily: 'Outfit-Bold', color: baseStyle?.color || '#1E293B' }}>
              {part.substring(2, part.length - 2)}
            </Text>
          );
        }
        if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
          return (
            <Text key={i} style={{ fontFamily: 'Inter', fontStyle: 'italic', color: baseStyle?.color || '#64748B' }}>
              {part.substring(1, part.length - 1)}
            </Text>
          );
        }
        if (part === '—') {
          return <Text key={i} style={{ color: '#CBD5E1' }}> — </Text>;
        }
        return <Text key={i}>{part}</Text>;
      })}
    </Text>
  );
}

// ═══════════════════════════════════════════════════════════════
//  MAIN CHAT SCREEN (MEMM-Driven)
// ═══════════════════════════════════════════════════════════════
export default function AiChatScreen() {
  const user = useAuthStore((s) => s.user);
  const colorScheme = useColorScheme();
  const { addProduct } = useCart();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [addedProductIds, setAddedProductIds] = useState<Set<number>>(new Set());
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [productMeta, setProductMeta] = useState<Record<number, ProductMeta>>({});
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const insets = useSafeAreaInsets();
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);

  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      }
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const isDark = colorScheme === 'dark';
  const colors = useMemo(() => ({
    bg: isDark ? '#0B1220' : '#FAFBFC',
    card: isDark ? 'rgba(30,41,59,0.55)' : 'rgba(255,255,255,0.7)',
    border: isDark ? 'rgba(148,163,184,0.2)' : '#E2E8F0',
    text: isDark ? '#E2E8F0' : '#1E293B',
    muted: isDark ? '#94A3B8' : '#64748B',
    inputBg: isDark ? '#111827' : '#F8FAFC',
    headerBg: isDark ? '#15803D' : '#16A34A',
  }), [isDark]);

  const userTurns = useMemo(() => messages.filter((m) => m.role === 'user').length, [messages]);
  const feedbackCount = useMemo(() => messages.filter((m) => m.feedbackType != null).length, [messages]);
  const learningProgress = Math.min(100, feedbackCount * 20);

  // Show welcome message on mount
  useEffect(() => {
    const name = user?.fullName?.split(' ').pop() || 'bạn';
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: `Chào ${name}! Hôm nay bạn muốn nấu gì? 🍳\n\nTôi có thể giúp bạn:\n🍽️ Lên thực đơn phù hợp sức khỏe\n🛒 Kiểm tra giỏ hàng an toàn\n🔄 Gợi ý thay thế lành mạnh`,
      timestamp: new Date(),
    }]);
  }, []);

  // ─── Send Message ─────────────────────────────────────────────
  const sendMessage = useCallback(async (text?: string) => {
    const messageText = (text || input).trim();
    if (!messageText || isLoading) return;

    setInput('');
    safeImpact(ImpactFeedbackStyle.Light);

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response: AiChatResponse = await aiApi.chatWithAi(
        { message: messageText, sessionId },
        { clientRawText: messageText }
      );

      if (response.sessionId) setSessionId(response.sessionId);

      // hydrate product metadata for richer inline cards
      if (response.proposedItems?.length) {
        const missingIds = response.proposedItems
          .map((x) => x.productId)
          .filter((id, idx, arr) => arr.indexOf(id) === idx)
          .filter((id) => !productMeta[id]);
        if (missingIds.length) {
          const fetched = await Promise.all(
            missingIds.map(async (id) => {
              try {
                const p = await productApi.getProductById(id);
                return [id, { id: p.id, name: p.name, price: p.price, imageUrl: p.imageUrl, stock: p.stock, unit: p.unit }] as const;
              } catch {
                return null;
              }
            })
          );
          setProductMeta((prev) => {
            const next = { ...prev };
            fetched.forEach((entry) => {
              if (entry) next[entry[0]] = entry[1];
            });
            return next;
          });
        }
      }

      const shouldShowSurvey = (userTurns + 1) % 5 === 0;

      const aiMsg: ChatMessage = {
        id: response.aiMessageId || `ai-${Date.now()}`,
        role: 'assistant',
        content: response.reply,
        timestamp: new Date(),
        trustScore: response.trustScore,
        proposedItems: response.proposedItems,
        removeVariantIds: response.removeVariantIds,
        removeReasons: response.removeReasons,
        explanations: response.explanations,
        expectationPrompt: response.expectationPrompt || (shouldShowSurvey ? 'Gợi ý của AI có hữu ích không?' : null),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      setMessages((prev) => [...prev, {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại! 🙏',
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, productMeta, sessionId, userTurns]);

  // ─── Handle Feedback (Optimistic UI) ──────────────────────────
  const handleFeedback = useCallback(async (messageId: string, type: 'HELPFUL' | 'NOT_HELPFUL') => {
    safeImpact(ImpactFeedbackStyle.Light);
    // Optimistic update
    setMessages((prev) =>
      prev.map((m) => m.id === messageId ? { ...m, feedbackType: type } : m)
    );
    try {
      if (!/^\d+$/.test(messageId)) return;
      await aiApi.submitFeedback(messageId, type);
    } catch {
      // Silent fail — feedback is non-critical
    }
  }, []);

  // ─── Add to Cart Handler ──────────────────────────────────────
  const handleAddToCart = useCallback(async (productId: number, quantity: number) => {
    try {
      const product = await productApi.getProductById(productId);
      if (product && product.stock > 0) {
        await addProduct({ product, quantity });
        setAddedProductIds((prev) => new Set([...prev, productId]));
        safeImpact(ImpactFeedbackStyle.Medium);
      }
    } catch (err) {
      console.error('Add to cart failed', err);
    }
  }, [addProduct]);

  const handleAddAll = useCallback(async (items: ProposedItem[]) => {
    safeImpact(ImpactFeedbackStyle.Heavy);
    for (const item of items) {
      if (!addedProductIds.has(item.productId)) {
        await handleAddToCart(item.productId, item.quantity);
      }
    }
  }, [addedProductIds, handleAddToCart]);

  // ─── Render Message ───────────────────────────────────────────
  const renderMessage = useCallback(({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';

    return (
      <MessageAppear>
      <View style={{
        alignItems: isUser ? 'flex-end' : 'flex-start',
        paddingHorizontal: 16,
        paddingVertical: 4,
      }}>
        {/* Chat Bubble */}
        <View style={{
          maxWidth: '85%',
          borderRadius: 20,
          ...(isUser
            ? { borderBottomRightRadius: 4, backgroundColor: '#16A34A' }
            : { borderTopLeftRadius: 4, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }),
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}>
          <FormattedText 
            text={item.content}
            style={{
              fontSize: 15,
              fontFamily: 'Inter',
              lineHeight: 22,
              color: isUser ? '#FFFFFF' : colors.text,
            }}
          />
          <Text 
            style={{ 
              fontSize: 10, 
              fontFamily: 'Inter', 
              color: isUser ? 'rgba(255,255,255,0.7)' : colors.muted,
              marginTop: 4,
              alignSelf: isUser ? 'flex-end' : 'flex-start'
            }}
            accessibilityLabel={`Thời gian gửi: ${item.timestamp.toLocaleTimeString()}`}
          >
            {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>

          {/* Trust Score Badge */}
          {!isUser && item.trustScore != null && (
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginTop: 8,
              alignSelf: 'flex-start',
            }}>
              <View style={{
                width: 6, height: 6, borderRadius: 3,
                backgroundColor: item.trustScore > 70 ? '#16A34A' : item.trustScore > 40 ? '#F59E0B' : '#EF4444',
                marginRight: 6,
              }} />
              <Text style={{ fontSize: 10, fontFamily: 'Inter', color: '#94A3B8' }}>
                Độ tin cậy: {Math.round(item.trustScore)}%
              </Text>
            </View>
          )}
        </View>

        {/* Conflict Warnings */}
        {!isUser && item.removeVariantIds && item.removeVariantIds.length > 0 && (
          <View style={{ maxWidth: '85%' }}>
            <ConflictWarning
              removeVariantIds={item.removeVariantIds}
              removeReasons={item.removeReasons || {}}
            />
          </View>
        )}

        {/* Product Cards (MEMM: Trust Building) */}
        {!isUser && item.proposedItems && item.proposedItems.length > 0 && (
          <View style={{ maxWidth: '85%', width: '100%' }}>
            {item.proposedItems.length > 1 && (
              <Pressable
                onPress={() => item.proposedItems && handleAddAll(item.proposedItems)}
                style={{
                  backgroundColor: 'rgba(22, 163, 74, 0.1)',
                  paddingVertical: 8,
                  borderRadius: 12,
                  alignItems: 'center',
                  marginTop: 10,
                  borderWidth: 1,
                  borderColor: '#16A34A',
                  borderStyle: 'dashed',
                }}
              >
                <Text style={{ fontSize: 13, fontFamily: 'Inter-Bold', color: '#16A34A' }}>
                  🛒 Bỏ tất cả vào giỏ
                </Text>
              </Pressable>
            )}
            {item.proposedItems.map((pi, idx) => (
              <ProductCard
                key={`${item.id}-pi-${idx}`}
                item={pi}
                explanation={item.explanations?.[pi.productId]?.toString()}
                productMeta={productMeta[pi.productId]}
                isAdded={addedProductIds.has(pi.productId)}
                onAddToCart={handleAddToCart}
              />
            ))}
          </View>
        )}

        {/* Feedback Buttons (MEMM: Expectation Management) */}
        {!isUser && item.id !== 'welcome' && /^\d+$/.test(item.id) && (
          <FeedbackButtons
            messageId={item.id}
            currentFeedback={item.feedbackType}
            onFeedback={handleFeedback}
          />
        )}

        {/* Satisfaction Prompt (MEMM: every 5 interactions) */}
        {!isUser && item.expectationPrompt && (
          <View style={{
            backgroundColor: '#FFF7ED',
            borderRadius: 12,
            padding: 12,
            marginTop: 8,
            maxWidth: '85%',
            borderLeftWidth: 3,
            borderLeftColor: '#F59E0B',
          }}>
            <Text style={{ fontSize: 13, fontFamily: 'Inter', color: '#92400E' }}>
              💡 {item.expectationPrompt}
            </Text>
          </View>
        )}
      </View>
      </MessageAppear>
    );
  }, [colors.border, colors.card, colors.text, handleAddToCart, handleFeedback, productMeta]);

  // ─── Quick Suggestions (MEMM: Motivation Trigger) ─────────────
  const showSuggestions = messages.length <= 1;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View
        onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
        style={{
          backgroundColor: colors.headerBg,
          paddingTop: Platform.OS === 'ios' ? insets.top + 10 : 44,
          paddingBottom: 16,
          paddingHorizontal: 20,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{
            width: 40, height: 40, borderRadius: 20,
            backgroundColor: 'rgba(255,255,255,0.2)',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Sparkles size={22} color="#fff" />
          </View>
          <View style={{ marginLeft: 12 }}>
            <Text style={{ fontSize: 18, fontFamily: 'Outfit-Bold', color: '#FFFFFF' }}>
              AI Trợ lý
            </Text>
            <Text style={{ fontSize: 12, fontFamily: 'Inter', color: 'rgba(255,255,255,0.8)' }}>
              SmartGrocery • MEMM Powered
            </Text>
          </View>
          <View style={{ marginLeft: 'auto', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 }}>
            <Text style={{ fontSize: 11, fontFamily: 'Inter-Bold', color: '#fff' }}>🎁 Có 3 deal hôm nay phù hợp với bạn</Text>
          </View>
        </View>

        <View style={{ marginTop: 10, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 11, fontFamily: 'Inter', color: '#fff' }}>AI đang học thêm về sở thích của bạn</Text>
            <Text style={{ fontSize: 11, fontFamily: 'Inter-Bold', color: '#fff' }}>{learningProgress}%</Text>
          </View>
          <View style={{ marginTop: 6, height: 6, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.25)' }}>
            <View style={{ width: `${learningProgress}%`, height: 6, borderRadius: 999, backgroundColor: '#fff' }} />
          </View>
        </View>
      </View>

      {/* Chat Messages */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={headerHeight}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingVertical: 12 }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListFooterComponent={isLoading ? <TypingIndicator /> : null}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={Platform.OS === 'android'}
        />

        {/* Quick Suggestion Chips */}
        {showSuggestions && (
          <View style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            paddingHorizontal: 16,
            paddingBottom: 8,
            gap: 8,
          }}>
            {QUICK_SUGGESTIONS.map((s, i) => (
              <Pressable
                key={i}
                onPress={() => sendMessage(s.message)}
                style={{
                  backgroundColor: colors.card,
                  borderRadius: 20,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderWidth: 1,
                  borderColor: colors.border,
                  shadowColor: '#0F172A',
                  shadowOpacity: 0.03,
                  shadowRadius: 4,
                  shadowOffset: { width: 0, height: 1 },
                }}
              >
                <Text style={{ fontSize: 13, fontFamily: 'Inter', color: colors.text }}>
                  {s.label}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Input Bar */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          paddingHorizontal: 12,
          paddingVertical: 10,
          backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: colors.border,
        }}>
          <TextInput
            ref={inputRef}
            value={input}
            onChangeText={setInput}
            placeholder="Nhập tin nhắn..."
            placeholderTextColor="#94A3B8"
            multiline
            maxLength={500}
            accessibilityLabel="Ô nhập tin nhắn cho AI"
            accessibilityHint="Nhập câu hỏi của bạn về dinh dưỡng hoặc thực phẩm"
            style={{
              flex: 1,
              maxHeight: 100,
              backgroundColor: colors.inputBg,
              borderRadius: 24,
              paddingHorizontal: 18,
              paddingVertical: 12,
              fontSize: 15,
              fontFamily: 'Inter',
              color: colors.text,
              borderWidth: 1,
              borderColor: colors.border,
            }}
            onSubmitEditing={() => sendMessage()}
            returnKeyType="send"
          />
          <Pressable
            onPress={() => sendMessage()}
            disabled={isLoading || !input.trim()}
            accessibilityLabel="Gửi tin nhắn"
            accessibilityRole="button"
            accessibilityState={{ disabled: isLoading || !input.trim() }}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: input.trim() ? '#16A34A' : '#E2E8F0',
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: 8,
              marginBottom: 0,
            }}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Send size={20} color={input.trim() ? '#FFFFFF' : '#94A3B8'} />
            )}
          </Pressable>
        </View>
        <View style={{ height: Platform.OS === 'ios' && !keyboardVisible ? insets.bottom : 0, backgroundColor: isDark ? '#0F172A' : '#FFFFFF' }} />
      </KeyboardAvoidingView>
    </View>
  );
}
