import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, TouchableOpacityProps } from 'react-native';
import * as Haptics from 'expo-haptics';
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
}

const Button: React.FC<ButtonProps> = ({
  label,
  variant = 'solid',
  loading = false,
  hapticVariant = 'light',
  className,
  textClassName,
  onPress,
  disabled,
  ...props
}) => {
  const handlePress = (event: any) => {
    if (loading || disabled) return;

    // Trigger Haptics sparingly as per user's "bulletproof" advice
    if (hapticVariant !== 'none') {
      switch (hapticVariant) {
        case 'light':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'medium':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'success':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case 'error':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;
      }
    }

    onPress?.(event);
  };

  const variantStyles = {
    solid: 'bg-primary',
    outline: 'border-2 border-primary bg-transparent',
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
        'px-6 py-4 rounded-xl flex-row justify-center items-center',
        variantStyles[variant],
        (disabled || loading) && 'opacity-50',
        className
      )}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'solid' ? 'white' : 'currentColor'} />
      ) : (
        <Text 
          className={cn(
            'text-lg font-outfit-bold text-center',
            textVariantStyles[variant],
            textClassName
          )}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
};

export default Button;
