import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { AlertTriangle, Info, X } from 'lucide-react-native';

export type NotificationBannerProps = {
  title: string;
  body?: string;
  variant?: 'info' | 'error';
  onPress?: () => void;
  onDismiss?: () => void;
};

const variantStyles = {
  info: {
    container: '#0F172A',
    accent: '#38BDF8',
    icon: Info,
  },
  error: {
    container: '#7F1D1D',
    accent: '#FCA5A5',
    icon: AlertTriangle,
  },
} as const;

export function NotificationBanner({ title, body, variant = 'info', onPress, onDismiss }: NotificationBannerProps) {
  const config = variantStyles[variant];
  const Icon = config.icon;

  return (
    <Pressable onPress={onPress} style={{ width: '100%' }}>
      <View
        style={{
          backgroundColor: config.container,
          borderRadius: 18,
          paddingVertical: 14,
          paddingHorizontal: 14,
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 12,
          borderWidth: 1,
          borderColor: variant === 'error' ? '#FCA5A533' : '#38BDF833',
          shadowColor: '#000',
          shadowOpacity: 0.18,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 8 },
          elevation: 8,
        }}
      >
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: variant === 'error' ? '#FCA5A51A' : '#38BDF81A',
          }}
        >
          <Icon size={18} color={config.accent} />
        </View>

        <View style={{ flex: 1, paddingRight: onDismiss ? 28 : 0 }}>
          <Text style={{ color: '#FFFFFF', fontFamily: 'Outfit-Bold', fontSize: 14 }}>{title}</Text>
          {body ? (
            <Text style={{ color: '#E2E8F0', fontFamily: 'Inter-Regular', fontSize: 12, marginTop: 4, lineHeight: 18 }} numberOfLines={3}>
              {body}
            </Text>
          ) : null}
        </View>

        {onDismiss ? (
          <Pressable
            onPress={onDismiss}
            hitSlop={10}
            style={{ position: 'absolute', top: 10, right: 10, width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={16} color="#CBD5E1" />
          </Pressable>
        ) : null}
      </View>
    </Pressable>
  );
}
