import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, TouchableOpacityProps, View, type GestureResponderEvent } from 'react-native';
import { safeImpact, safeNotification, ImpactFeedbackStyle, NotificationFeedbackType } from '../../utils/safeHaptics';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility to merge tailwind classes safely
 */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type ButtonVariant = 'solid' | 'outline' | 'ghost';
export type HapticVariant = 'light' | 'medium' | 'success' | 'error' | 'none';

interface ButtonProps extends TouchableOpacityProps {
  label: string;
  variant?: ButtonVariant;
  loading?: boolean;
  hapticVariant?: HapticVariant;
  className?: string;
  textClassName?: string;
  icon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  label,
  variant = 'solid',
  loading = false,
  hapticVariant = 'light',
  className,
  textClassName,
  icon,
  onPress,
  disabled,
  ...props
}) => {
  const handlePress = (event: GestureResponderEvent) => {
    if (loading || disabled) return;

    if (hapticVariant !== 'none') {
      switch (hapticVariant) {
        case 'light':
          void safeImpact(ImpactFeedbackStyle.Light);
          break;
        case 'medium':
          void safeImpact(ImpactFeedbackStyle.Medium);
          break;
        case 'success':
          void safeNotification(NotificationFeedbackType.Success);
          break;
        case 'error':
          void safeNotification(NotificationFeedbackType.Error);
          break;
      }
    }

    onPress?.(event);
  };

  const variantStyles = {
    solid: 'bg-primary border border-primary',
    outline: 'border border-primary bg-surface',
    ghost: 'bg-transparent',
  };

  const textVariantStyles = {
    solid: 'text-primary-fg',
    outline: 'text-primary',
    ghost: 'text-primary',
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={handlePress}
      disabled={disabled || loading}
      className={cn(
        'px-5 py-3.5 rounded-3xl flex-row justify-center items-center',
        variantStyles[variant],
        (disabled || loading) && 'opacity-50',
        className
      )}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'solid' ? '#ffffff' : undefined} />
      ) : (
        <>
          {icon && <View className={label ? 'mr-2' : ''}>{icon}</View>}
          {label ? (
            <Text 
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.85}
              className={cn(
                'text-base font-outfit-bold text-center',
                textVariantStyles[variant],
                textClassName
              )}
            >
              {label}
            </Text>
          ) : null}
        </>
      )}
    </TouchableOpacity>
  );
};

export default Button;
