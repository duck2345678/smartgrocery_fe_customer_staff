import React from 'react';
import { View, Text, ViewProps } from 'react-native';
import { OrderAssignment, AssignmentStatus } from '../../types/fulfillment';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { Clock, MapPin, Package, Phone } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface OrderCardProps {
  order: OrderAssignment;
  remainingMinutes: number;
  onAction?: (order: OrderAssignment) => void;
}

const OrderCard: React.FC<OrderCardProps> = React.memo(({ order, remainingMinutes, onAction }) => {
  const isCritical = remainingMinutes <= 5 && order.status !== AssignmentStatus.COMPLETED;
  const isWarning = remainingMinutes <= 15 && remainingMinutes > 5;

  // Trigger Haptics for critical orders (only if it just became critical or on first render)
  React.useEffect(() => {
    if (isCritical) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [isCritical]);

  const slaColorClass = isCritical 
    ? 'text-danger' 
    : isWarning 
      ? 'text-warning' 
      : 'text-success';

  return (
    <Card 
      className={cn(
        'mb-4 border-l-4',
        isCritical ? 'border-l-danger bg-red-50' : isWarning ? 'border-l-warning' : 'border-l-primary'
      )}
    >
      <View className="flex-row justify-between items-start mb-3">
        <View>
          <Text className="text-xs font-inter-bold text-slate-400 uppercase tracking-tight">
            Order #{order.orderCode}
          </Text>
          <Text className="text-lg font-outfit-bold text-slate-900">{order.customerName}</Text>
        </View>
        <Badge 
          label={order.status} 
          variant={order.status === AssignmentStatus.IN_PROGRESS ? 'info' : 'neutral'} 
        />
      </View>

      <View className="space-y-2 mb-4">
        <View className="flex-row items-center">
          <Clock size={16} color={isCritical ? '#DC2626' : '#64748B'} />
          <Text className={cn('ml-2 text-sm font-inter-bold', slaColorClass)}>
            SLA: {remainingMinutes} mins remaining
          </Text>
        </View>

        <View className="flex-row items-center">
          <Package size={16} color="#64748B" />
          <Text className="ml-2 text-sm text-slate-600 font-inter">
            {order.totalItems} items • {order.taskType}
          </Text>
        </View>

        <View className="flex-row items-center">
          <MapPin size={16} color="#64748B" />
          <Text className="ml-2 text-sm text-slate-600 font-inter" numberOfLines={1}>
            {order.deliveryAddress}
          </Text>
        </View>
      </View>

      <View className="flex-row gap-x-2">
        <Button 
          label={order.status === AssignmentStatus.PENDING ? 'Start Picking' : 'Continue'} 
          className="flex-1 py-3"
          onPress={() => onAction?.(order)}
        />
        <Button 
          label="" 
          variant="outline" 
          className="px-4"
          icon={<Phone size={20} color="#22C55E" />}
        />
      </View>
    </Card>
  );
});

export default OrderCard;
