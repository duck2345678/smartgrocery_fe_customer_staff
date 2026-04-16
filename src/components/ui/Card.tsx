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
    elevated: 'bg-surface shadow-sm shadow-slate-400',
    outline: 'bg-transparent border border-border',
    flat: 'bg-slate-100',
  };

  return (
    <View 
      className={cn(
        'rounded-2xl p-4',
        variantStyles[variant],
        className
      )}
      style={variant === 'elevated' ? {
        elevation: 3, // For Android performance
      } : {}}
      {...props}
    >
      {children}
    </View>
  );
};

export default Card;
