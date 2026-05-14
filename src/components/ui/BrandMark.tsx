import React from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import logo from '../../assets/smartgrocery-logo.png';

export default function BrandMark({ size = 36 }: { size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
      }}
    >
      <Image source={logo} style={{ width: '100%', height: '100%' }} contentFit="contain" />
    </View>
  );
}
