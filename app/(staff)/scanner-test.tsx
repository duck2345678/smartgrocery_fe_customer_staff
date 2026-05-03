import React, { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import BarcodeScanner from '../../src/components/staff/BarcodeScanner';
import Button from '../../src/components/ui/Button';
import Card from '../../src/components/ui/Card';
import { safeNotification, NotificationFeedbackType } from '../../src/utils/safeHaptics';

export default function StaffScannerTestScreen() {
  const [open, setOpen] = useState(false);
  const [last, setLast] = useState<string | null>(null);

  const onScan = useCallback((code: string) => {
    setLast(code);
    setOpen(false);
    void safeNotification(NotificationFeedbackType.Success);
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Stack.Screen options={{ title: 'Test Scanner', headerShown: true }} />

      <View className="p-4 gap-y-3">
        <Card className="p-4">
          <Text className="font-outfit-bold text-slate-900">Barcode Scanner</Text>
          <Text className="text-xs font-inter text-slate-500 mt-1">Quét thử bất kỳ mã nào để kiểm tra camera.</Text>
          <View className="mt-3">
            <Button label="Mở Scanner" onPress={() => setOpen(true)} />
          </View>
        </Card>

        <Card className="p-4">
          <Text className="text-xs font-inter text-slate-500">Lần quét gần nhất</Text>
          <Text className="mt-2 font-outfit-bold text-slate-900">{last ?? '—'}</Text>
        </Card>
      </View>

      {open ? (
        <View className="absolute inset-0 z-50">
          <BarcodeScanner onScan={onScan} onClose={() => setOpen(false)} />
        </View>
      ) : null}
    </SafeAreaView>
  );
}
