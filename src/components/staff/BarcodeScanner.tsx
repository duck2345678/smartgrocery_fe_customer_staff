import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Linking, BackHandler, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useIsFocused } from '@react-navigation/native';
import { X, Zap, ZapOff, Settings } from 'lucide-react-native';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
  isActive?: boolean;
}

export default function BarcodeScanner({ 
  onScan, 
  onClose, 
  isActive = true 
}: BarcodeScannerProps) {
  const isFocused = useIsFocused();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [torch, setTorch] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [showReadyHint, setShowReadyHint] = useState(false);

  useEffect(() => {
    if (!permission) return;
    if (!permission.granted && permission.canAskAgain) {
      void requestPermission();
    }
  }, [permission, requestPermission]);

  useEffect(() => {
    if (!isFocused || !isActive) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [isActive, isFocused, onClose]);

  useEffect(() => {
    if (!isFocused || !isActive) return;
    setIsCameraReady(false);
    setShowReadyHint(false);
    const timer = setTimeout(() => setShowReadyHint(true), 1800);
    return () => clearTimeout(timer);
  }, [isActive, isFocused]);

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    onScan(data);
    
    // Reset scanner after a short delay to allow subsequent scans 
    // without manual trigger, but preventing "rapid fire" scans.
    setTimeout(() => setScanned(false), 1200);
  };

  if (!permission || permission.granted === false) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-900 p-8">
        <View className="bg-red-500/20 p-4 rounded-full mb-6">
          <Settings size={48} color="#EF4444" />
        </View>
        <Text className="text-white text-xl font-outfit-bold text-center mb-2">
          {!permission ? 'Đang yêu cầu...' : 'Quyền truy cập bị từ chối'}
        </Text>
        <Text className="text-slate-400 text-center font-inter mb-10 leading-6">
          Chúng tôi cần quyền truy cập Camera để quét mã vạch sản phẩm. Vui lòng bật quyền này trong Cài đặt để tiếp tục.
        </Text>
        
        <View className="w-full gap-y-4">
          <TouchableOpacity 
            onPress={() => Linking.openSettings()}
            className="bg-primary py-4 rounded-2xl items-center"
          >
            <Text className="text-white font-inter-bold">Mở Cài đặt</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={onClose}
            className="bg-white/10 py-4 rounded-2xl items-center"
          >
            <Text className="text-white font-inter-bold">Đóng</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!isFocused || !isActive) {
    return (
      <View className="flex-1 bg-black items-center justify-center px-8">
        <Text className="text-white font-inter text-center">
          Camera chưa sẵn sàng. Vui lòng đóng và mở lại scanner.
        </Text>
        <TouchableOpacity
          onPress={onClose}
          className="mt-6 bg-white/15 py-3 px-6 rounded-2xl"
        >
          <Text className="text-white font-inter-bold">Đóng</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <CameraView
        facing="back"
        active={isFocused && isActive}
        onCameraReady={() => setIsCameraReady(true)}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: [
            'qr', 'ean13', 'ean8', 'code128', 'code39', 'upc_a', 'upc_e'
          ],
        }}
        enableTorch={torch}
        className="flex-1"
      >
        <View className="flex-1 bg-black/30 items-center justify-center">
          {/* Target Overlay */}
          <View 
            className="w-72 h-48 border-2 border-white/50 rounded-3xl items-center justify-center"
            style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
          >
            <View className="w-10 h-0.5 bg-primary absolute top-0" />
            <View className="w-0.5 h-10 bg-primary absolute top-0 left-0" />
            {/* ... other corners omitted for brevity but implied in premium design ... */}
          </View>
          
          <Text className="text-white font-inter-bold mt-6 text-center px-10">
            Căn chỉnh mã vạch vào khung để tự động quét
          </Text>
        </View>

        {!isCameraReady ? (
          <View className="absolute inset-0 items-center justify-center">
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text className="text-white font-inter mt-3">Đang khởi động camera...</Text>
            {showReadyHint ? (
              <Text className="text-slate-300 font-inter text-xs mt-2 px-8 text-center">
                Nếu vẫn thấy màn hình đen, hãy bấm Đóng rồi mở lại scanner.
              </Text>
            ) : null}
          </View>
        ) : null}

        {/* Controls Overlay */}
        <View className="absolute top-12 right-6">
          <TouchableOpacity 
            onPress={() => setTorch(!torch)}
            className="w-12 h-12 rounded-full bg-black/50 items-center justify-center"
          >
            {torch ? <Zap size={24} color="#F59E0B" /> : <ZapOff size={24} color="#FFF" />}
          </TouchableOpacity>
        </View>
      </CameraView>

      <View className="absolute top-12 left-6">
        <TouchableOpacity
          onPress={onClose}
          className="w-12 h-12 rounded-full bg-black/60 items-center justify-center"
        >
          <X size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <View className="absolute bottom-10 left-6 right-6">
        <TouchableOpacity
          onPress={onClose}
          className="bg-white/20 py-3 rounded-2xl items-center"
        >
          <Text className="text-white font-inter-bold">Đóng scanner</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
