import { useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { ChevronLeft, Send, Bot, User } from 'lucide-react-native';
import { useAuthStore } from '../../src/store/authStore';
import { aiApi } from '../../src/api/ai';

type Message = {
  id: string;
  role: 'user' | 'ai';
  text: string;
};

const SUGGESTED_PROMPTS = [
  'Gợi ý thực phẩm giàu protein',
  'Tôi cần mua gì cho bữa sáng lành mạnh?',
  'Sản phẩm nào tốt cho người ăn kiêng?',
  'Tôi nên ăn gì để tăng cơ?',
];

export default function AiChatScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const scrollRef = useRef<ScrollView>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'ai',
      text: 'Xin chào! Tôi là trợ lý mua sắm AI của SmartGrocery. Tôi có thể giúp bạn tìm sản phẩm, gợi ý thực đơn, hoặc tư vấn dinh dưỡng. Bạn cần hỗ trợ gì?',
    },
  ]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const userId = user?.id;

  const scrollToBottom = () => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading || !userId) return;

    const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', text: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    scrollToBottom();

    try {
      let sid = sessionId;
      if (sid === null) {
        const session = await aiApi.createChatSession(userId);
        sid = session.id;
        setSessionId(sid);
      }

      const reply = await aiApi.askChat(text.trim(), sid);
      const aiMsg: Message = { id: `a-${Date.now()}`, role: 'ai', text: reply };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (e) {
      const errMsg: Message = {
        id: `err-${Date.now()}`,
        role: 'ai',
        text: 'Xin lỗi, tôi không thể trả lời lúc này. Vui lòng thử lại sau.',
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
      scrollToBottom();
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View className="px-4 pt-3 pb-3 flex-row items-center border-b border-border bg-white">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 rounded-2xl bg-surface border border-border items-center justify-center mr-3"
        >
          <ChevronLeft size={20} color="#0F172A" />
        </Pressable>
        <View
          className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 items-center justify-center mr-3"
        >
          <Bot size={20} color="#22C55E" />
        </View>
        <View style={{ flex: 1 }}>
          <Text className="text-base font-outfit-bold text-text">Trợ lý AI</Text>
          <Text className="text-xs font-inter text-muted">SmartGrocery Assistant</Text>
        </View>
        {isLoading ? (
          <View className="flex-row items-center" style={{ gap: 4 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#22C55E' }} />
            <Text className="text-xs font-inter text-primary">Đang trả lời…</Text>
          </View>
        ) : (
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#22C55E' }} />
        )}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 8, gap: 12 }}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={scrollToBottom}
        >
          {messages.map((msg) => (
            <View
              key={msg.id}
              className={`flex-row items-end ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              style={{ gap: 8 }}
            >
              {msg.role === 'ai' ? (
                <View className="w-7 h-7 rounded-xl bg-emerald-50 border border-emerald-100 items-center justify-center mb-0.5">
                  <Bot size={14} color="#22C55E" />
                </View>
              ) : null}

              <View
                style={{ maxWidth: '78%' }}
                className={`rounded-3xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-primary rounded-br-lg'
                    : 'bg-white border border-border rounded-bl-lg'
                }`}
              >
                <Text
                  className={`text-sm font-inter leading-5 ${
                    msg.role === 'user' ? 'text-primary-fg' : 'text-text'
                  }`}
                  selectable
                >
                  {msg.text}
                </Text>
              </View>

              {msg.role === 'user' ? (
                <View className="w-7 h-7 rounded-xl bg-slate-100 items-center justify-center mb-0.5">
                  <User size={14} color="#64748B" />
                </View>
              ) : null}
            </View>
          ))}

          {isLoading ? (
            <View className="flex-row items-end justify-start" style={{ gap: 8 }}>
              <View className="w-7 h-7 rounded-xl bg-emerald-50 border border-emerald-100 items-center justify-center">
                <Bot size={14} color="#22C55E" />
              </View>
              <View className="bg-white border border-border rounded-3xl rounded-bl-lg px-4 py-3">
                <View className="flex-row items-center" style={{ gap: 4 }}>
                  {[0, 1, 2].map((i) => (
                    <View
                      key={i}
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: '#94A3B8',
                        opacity: 0.6 + i * 0.2,
                      }}
                    />
                  ))}
                </View>
              </View>
            </View>
          ) : null}

          {/* Suggested prompts (only at start) */}
          {messages.length === 1 ? (
            <View style={{ gap: 8, marginTop: 4 }}>
              <Text className="text-xs font-inter text-muted text-center">Bạn có thể hỏi tôi:</Text>
              <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <Pressable
                    key={prompt}
                    onPress={() => void sendMessage(prompt)}
                    className="px-3 py-2 rounded-2xl border border-emerald-200 bg-emerald-50"
                  >
                    <Text className="text-xs font-inter text-emerald-700">{prompt}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}
        </ScrollView>

        {/* Input bar */}
        <View className="px-4 py-3 bg-white border-t border-border flex-row items-end" style={{ gap: 10 }}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Nhập câu hỏi…"
            placeholderTextColor="#94A3B8"
            className="flex-1 border border-border rounded-2xl px-4 py-3 font-inter text-text bg-surface"
            multiline
            maxLength={500}
            style={{ maxHeight: 100 }}
            onSubmitEditing={() => void sendMessage(input)}
            blurOnSubmit={false}
          />
          <Pressable
            onPress={() => void sendMessage(input)}
            disabled={!input.trim() || isLoading}
            className="w-11 h-11 rounded-2xl bg-primary items-center justify-center"
            style={{ opacity: !input.trim() || isLoading ? 0.4 : 1 }}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Send size={18} color="#fff" />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
