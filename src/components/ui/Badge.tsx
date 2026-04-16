import React from 'react';
import { View, Text } from 'react-native';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  className?: string;
  textClassName?: string;
}

const Badge: React.FC<BadgeProps> = ({ 
  label, 
  variant = 'neutral',
  className,
  textClassName
}) => {
  const variantStyles = {
    success: 'bg-green-100 border-green-200',
    warning: 'bg-amber-100 border-amber-200',
    danger: 'bg-red-100 border-red-200',
    info: 'bg-blue-100 border-blue-200',
    neutral: 'bg-slate-100 border-slate-200',
  };

  const textStyles = {
    success: 'text-green-700',
    warning: 'text-amber-700',
    danger: 'text-red-700',
    info: 'text-blue-700',
    neutral: 'text-slate-700',
  };

  return (
    <View 
      className={cn(
        'px-2.5 py-0.5 rounded-full border',
        variantStyles[variant],
        className
      )}
    >
      <Text 
        className={cn(
          'text-xs font-inter-bold uppercase tracking-wider',
          textStyles[variant],
          textClassName
        )}
      >
        {label}
      </Text>
    </View>
  );
};

export default Badge;
