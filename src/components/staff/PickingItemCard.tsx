import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { FulfillmentItem } from '../../types/fulfillment';
import Card from '../ui/Card';
import { Plus, Minus, Lock, CheckCircle2, AlertCircle } from 'lucide-react-native';
import { clsx } from 'clsx';
import * as Haptics from 'expo-haptics';

interface PickingItemCardProps {
  item: FulfillmentItem;
  onIncrement: (itemId: number) => void;
  onDecrement: (itemId: number) => void;
  onReportProblem: (itemId: number) => void;
}

export default function PickingItemCard({ 
  item, 
  onIncrement, 
  onDecrement,
  onReportProblem 
}: PickingItemCardProps) {
  const isCompleted = item.pickedQuantity >= item.quantity;
  const isUnlocked = item.isUnlocked || isCompleted;

  const handleIncrement = () => {
    if (!isUnlocked) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onIncrement(item.id);
  };

  return (
    <Card 
      className={clsx(
        'mb-3 border-l-4 transition-all duration-300',
        isCompleted ? 'border-l-success bg-green-50' : isUnlocked ? 'border-l-primary' : 'border-l-slate-300 opacity-60'
      )}
    >
      <View className="flex-row">
        {/* Product Info */}
        <View className="flex-1">
          <View className="flex-row items-center mb-1">
            <Text className="text-xs font-inter-bold text-slate-400 uppercase mr-2">SKU: {item.sku}</Text>
            {isCompleted && <CheckCircle2 size={14} color="#22C55E" />}
          </View>
          <Text className="text-base font-outfit-bold text-slate-900 mb-1">{item.productName}</Text>
          <Text className="text-sm text-slate-500 font-inter mb-3">{item.variantName}</Text>
          
          <View className="flex-row items-center">
            <Text className="text-slate-400 text-xs font-inter">Cần lấy: </Text>
            <Text className="text-slate-900 font-inter-bold text-sm">{item.quantity}</Text>
          </View>
        </View>

        {/* Action / Count Area */}
        <View className="items-end justify-between ml-2">
          {!isUnlocked ? (
            <View className="items-center justify-center bg-slate-100 w-24 h-24 rounded-2xl">
              <Lock size={20} color="#94A3B8" />
              <Text className="text-[10px] text-slate-400 font-inter-bold mt-2 uppercase">Quét để mở</Text>
            </View>
          ) : (
            <View className="items-center">
              <View className="flex-row items-center bg-slate-100 rounded-xl p-1 mb-2">
                <TouchableOpacity 
                  onPress={() => onDecrement(item.id)}
                  disabled={item.pickedQuantity <= 0}
                  className={clsx('p-2', item.pickedQuantity <= 0 && 'opacity-30')}
                >
                  <Minus size={20} color="#1E293B" />
                </TouchableOpacity>
                
                <View className="px-3 min-w-[40px] items-center">
                  <Text className={clsx('text-xl font-outfit-bold', isCompleted ? 'text-success' : 'text-slate-900')}>
                    {item.pickedQuantity}
                  </Text>
                </View>

                <TouchableOpacity 
                  onPress={handleIncrement}
                  disabled={isCompleted}
                  className={clsx('p-2', isCompleted && 'opacity-30')}
                >
                  <Plus size={20} color="#1E293B" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity 
                onPress={() => onReportProblem(item.id)}
                className="flex-row items-center"
              >
                <AlertCircle size={12} color="#94A3B8" />
                <Text className="text-[10px] text-slate-400 font-inter ml-1">Báo sự cố</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Card>
  );
}
