import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Flashlight, FlashlightOff, X, Image as ImageIcon } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import Svg, { Circle, Path } from 'react-native-svg';
import { safeImpact, ImpactFeedbackStyle } from '../../../src/utils/safeHaptics';
import { useStaffProductsStore } from '../../../src/store/staffProductsStore';

type Facing = 'back' | 'front';

function SwapCameraIcon({ size, color }: { size: number; color: string }) {
  const strokeWidth = 2;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 6v6h-6"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M3 12a9 9 0 0 1 15.64-6.36L21 6"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M3 18v-6h6"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M21 12a9 9 0 0 1-15.64 6.36L3 18"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M15 10h2a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-5a1 1 0 0 1 1-1h2l1-1.5h4l1 1.5z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="13.5" r="2" stroke={color} strokeWidth={strokeWidth} />
    </Svg>
  );
}

export default function StaffBarcodeScanScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const setSearch = useStaffProductsStore((s) => s.setSearch);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<Facing>('back');
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scanningLockedRef = useRef(false);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const frame = useMemo(() => {
    const safeW = Math.min(width, 420);
    const frameW = Math.max(260, Math.floor(safeW * 0.78));
    const frameH = Math.max(170, Math.floor(frameW * 0.62));
    const top = Math.max(90, Math.floor(height * 0.22));
    return { frameW, frameH, top };
  }, [height, width]);

  const showToast = (message: string) => {
    setToast(message);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 900);
  };

  const toggleFacing = () => {
    setFacing((v) => (v === 'back' ? 'front' : 'back'));
    void safeImpact(ImpactFeedbackStyle.Light);
    showToast(facing === 'back' ? 'Đã chuyển sang camera trước' : 'Đã chuyển sang camera sau');
  };

  const toggleTorch = () => {
    setTorchEnabled((v) => !v);
    void safeImpact(ImpactFeedbackStyle.Light);
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled) {
        showToast('Tính năng quét từ ảnh đang được phát triển');
      }
    } catch (e) {
      showToast('Lỗi khi mở thư viện ảnh');
    }
  };

  const onBarcodeScanned = (e: { data?: string } | any) => {
    const value = String(e?.data ?? '').trim();
    if (!value) return;
    if (scanningLockedRef.current) return;
    scanningLockedRef.current = true;
    void safeImpact(ImpactFeedbackStyle.Medium);
    setSearch(value);
    showToast('Đã quét mã');
    setTimeout(() => router.back(), 250);
  };

  const needsPermission = permission?.granted !== true;

  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="flex-1 bg-black">
        {needsPermission ? (
          <View className="flex-1 items-center justify-center px-6">
            <Text className="text-base font-outfit-bold text-white text-center">Cần quyền camera để quét mã vạch</Text>
            <Text className="text-xs font-inter text-white/80 text-center mt-2">
              Vui lòng cấp quyền để sử dụng tính năng quét.
            </Text>
            <Pressable
              onPress={() => void requestPermission()}
              className="mt-4 px-5 py-3 rounded-2xl bg-primary items-center"
            >
              <Text className="font-outfit-bold text-primary-fg">Cấp quyền camera</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <CameraView
              style={{ flex: 1 }}
              facing={facing}
              enableTorch={torchEnabled}
              onBarcodeScanned={onBarcodeScanned}
              barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'qr'] }}
            />

            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
              <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.35)' }} />

              <View style={{ position: 'absolute', top: frame.top, left: (width - frame.frameW) / 2, width: frame.frameW, height: frame.frameH }}>
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 18, borderWidth: 2, borderColor: 'rgba(255,255,255,0.55)' }} />
                <View style={{ position: 'absolute', left: 14, right: 14, top: frame.frameH * 0.52, height: 3, borderRadius: 2, backgroundColor: '#EF4444' }} />
              </View>

              <View className="absolute top-4 left-4">
                <Pressable
                  testID="scanner-close"
                  onPress={() => router.back()}
                  className="w-14 h-14 rounded-full bg-black/45 items-center justify-center"
                  hitSlop={10}
                >
                  <X size={28} color="#ffffff" />
                </Pressable>
              </View>

              <View className="absolute top-4 right-4 items-end" style={{ gap: 14 }}>
                <Pressable
                  testID="scanner-torch"
                  onPress={toggleTorch}
                  className="w-14 h-14 rounded-full bg-black/45 items-center justify-center"
                  hitSlop={10}
                >
                  {torchEnabled ? <FlashlightOff size={28} color="#ffffff" /> : <Flashlight size={28} color="#ffffff" />}
                </Pressable>

                <Pressable
                  testID="scanner-switch-camera"
                  onPress={toggleFacing}
                  className="w-14 h-14 rounded-full bg-black/45 items-center justify-center"
                  hitSlop={10}
                >
                  <SwapCameraIcon size={28} color="#ffffff" />
                </Pressable>
              </View>

              <View className="absolute bottom-12 left-4">
                <Pressable
                  testID="scanner-pick-image"
                  onPress={pickImage}
                  className="w-14 h-14 rounded-full bg-black/45 items-center justify-center"
                  hitSlop={10}
                >
                  <ImageIcon size={28} color="#ffffff" />
                </Pressable>
              </View>

              <View className="absolute left-0 right-0" style={{ top: frame.top + frame.frameH + 22 }}>
                <Text className="text-base font-inter text-white text-center">Căn lề mã vạch vào khung để quét</Text>
              </View>

              {toast ? (
                <View className="absolute left-0 right-0 top-20 items-center">
                  <View className="px-4 py-2 rounded-full bg-black/55">
                    <Text className="text-xs font-inter-bold text-white">{toast}</Text>
                  </View>
                </View>
              ) : null}
            </View>
          </>
        )}

        {Platform.OS === 'web' ? (
          <View className="absolute bottom-6 left-0 right-0 items-center">
            <View className="px-4 py-2 rounded-full bg-black/60">
              <Text className="text-xs font-inter text-white/90">Chế độ quét camera có thể bị giới hạn trên Web.</Text>
            </View>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}
