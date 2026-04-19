import React from 'react';
import { View, TextInput, Text, TextInputProps } from 'react-native';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
  containerClassName?: string;
}

const Input: React.FC<InputProps> = ({ 
  label, 
  error, 
  icon, 
  rightElement,
  containerClassName,
  className,
  ...props 
}) => {
  return (
    <View className={cn('w-full mb-4', containerClassName)}>
      {label && (
        <Text className="text-sm font-inter-medium text-slate-700 mb-1.5 ml-1">
          {label}
        </Text>
      )}
      <View 
        className={cn(
          'flex-row items-center bg-white border border-border rounded-xl px-4 py-3',
          error && 'border-danger',
          'focus:border-primary' // Note: focus state needs custom management in RN if not using specialized libs
        )}
      >
        {icon && <View className="mr-3">{icon}</View>}
        <TextInput
          className={cn(
            'flex-1 text-base text-slate-900 font-inter',
            className
          )}
          placeholderTextColor="#94A3B8"
          {...props}
        />
        {rightElement ? <View className="ml-2">{rightElement}</View> : null}
      </View>
      {error && (
        <Text className="text-xs text-danger mt-1 ml-1 font-inter">
          {error}
        </Text>
      )}
    </View>
  );
};

export default Input;
