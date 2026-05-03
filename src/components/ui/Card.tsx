import React from 'react';
import { View, ViewProps } from 'react-native';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CardProps extends ViewProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'elevated' | 'outline' | 'flat';
}

const Card: React.FC<CardProps> = ({ 
  children, 
  className, 
  variant = 'elevated',
  ...props 
}) => {
  const variantStyles = {
    elevated: 'bg-surface border border-border',
    outline: 'bg-transparent border border-border',
    flat: 'bg-surface2 border border-border/60',
  };

  return (
    <View 
      className={cn(
        'rounded-3xl p-4',
        variantStyles[variant],
        className
      )}
      style={variant === 'elevated' ? {
        elevation: 4,
        shadowColor: '#0F172A',
        shadowOpacity: 0.08,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 4 },
      } : {}}
      {...props}
    >
      {children}
    </View>
  );
};

export default Card;
