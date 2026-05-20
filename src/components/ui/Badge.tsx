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
    success: 'bg-emerald-50 border-emerald-200',
    warning: 'bg-amber-50 border-amber-200',
    danger: 'bg-rose-50 border-rose-200',
    info: 'bg-sky-50 border-sky-200',
    neutral: 'bg-slate-50 border-slate-200',
  };

  const textStyles = {
    success: 'text-emerald-700',
    warning: 'text-amber-700',
    danger: 'text-rose-700',
    info: 'text-sky-700',
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
