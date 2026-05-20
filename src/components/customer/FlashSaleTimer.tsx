import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { Clock } from 'lucide-react-native';

interface Props {
  endTime: string;
  onExpire?: () => void;
  compact?: boolean;
}

export const FlashSaleTimer = ({ endTime, onExpire, compact = false }: Props) => {
  const [timeLeft, setTimeLeft] = useState<{ h: string; m: string; s: string } | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      const end = new Date(endTime).getTime();
      const now = new Date().getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft(null);
        clearInterval(timer);
        onExpire?.();
        return;
      }

      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({
        h: h.toString().padStart(2, '0'),
        m: m.toString().padStart(2, '0'),
        s: s.toString().padStart(2, '0'),
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime]);

  if (!timeLeft) return null;

  if (compact) {
    return (
      <View className="flex-row items-center bg-red-500/10 px-1.5 py-0.5 rounded-md border border-red-500/20">
        <Clock size={10} color="#EF4444" />
        <Text className="text-[9px] font-outfit-bold text-red-500 ml-1">
          {timeLeft.h}:{timeLeft.m}:{timeLeft.s}
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-row items-center bg-red-50 px-2 py-1 rounded-full border border-red-200">
      <Clock size={14} color="#EF4444" />
      <Text className="text-[11px] font-outfit-bold text-red-600 ml-1.5">
        Kết thúc trong: <Text className="text-red-700">{timeLeft.h}:{timeLeft.m}:{timeLeft.s}</Text>
      </Text>
    </View>
  );
};
