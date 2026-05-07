import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import {
  ChevronLeft,
  Zap,
  Image as ImageIcon,
  RefreshCw,
  Scan,
  CheckCircle2,
  ShoppingBag,
  Sun,
  ChevronRight,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { safeImpact, ImpactFeedbackStyle } from '../../../src/utils/safeHaptics';
import { useStaffProductsStore } from '../../../src/store/staffProductsStore';

const PRIMARY_GREEN = '#22C55E';

export default function StaffBarcodeScanScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const setSearch = useStaffProductsStore((s) => s.setSearch);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const scanningLockedRef = useRef(false);

  /* Animation for scanning line */
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const startAnimation = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnim, {
            toValue: 1,
            duration: 2500,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(scanLineAnim, {
            toValue: 0,
            duration: 2500,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      ).start();
    };
    startAnimation();
  }, [scanLineAnim]);

  const frameSize = useMemo(() => {
    const size = Math.min(width * 0.75, 300);
    return size;
  }, [width]);

  const translateY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, frameSize],
  });

  const toggleFacing = () => {
    setFacing((v) => (v === 'back' ? 'front' : 'back'));
    void safeImpact(ImpactFeedbackStyle.Light);
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
        void safeImpact(ImpactFeedbackStyle.Medium);
      }
    } catch (e) {
      // error
    }
  };

  const onBarcodeScanned = (e: any) => {
    const value = String(e?.data ?? '').trim();
    if (!value || scanningLockedRef.current) return;
    scanningLockedRef.current = true;
    void safeImpact(ImpactFeedbackStyle.Heavy);
    setSearch(value);
    setTimeout(() => router.back(), 300);
  };

  if (!permission?.granted) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', textAlign: 'center' }}>
          Cần quyền camera để quét mã vạch
        </Text>
        <Pressable
          onPress={() => void requestPermission()}
          style={{ marginTop: 20, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 16, backgroundColor: PRIMARY_GREEN }}
        >
          <Text style={{ color: '#fff', fontWeight: '700' }}>Cấp quyền camera</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <CameraView
        style={{ flex: 1 }}
        facing={facing}
        enableTorch={torchEnabled}
        onBarcodeScanned={onBarcodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'qr'],
        }}
      />

      {/* Overlay */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.45)' }}>
        <SafeAreaView style={{ flex: 1 }}>
          
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10 }}>
            <Pressable
              onPress={() => router.back()}
              style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' }}
            >
              <ChevronLeft size={24} color="#fff" />
            </Pressable>
            
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>Quét mã đơn hàng</Text>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 4 }}>Đưa mã vạch vào khung để quét</Text>
            </View>

            <Pressable
              onPress={toggleTorch}
              style={{ alignItems: 'center', gap: 4 }}
            >
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={22} color={torchEnabled ? '#FACC15' : '#fff'} fill={torchEnabled ? '#FACC15' : 'transparent'} />
              </View>
              <Text style={{ color: '#fff', fontSize: 10, fontWeight: '600' }}>Flash</Text>
            </Pressable>
          </View>

          {/* Viewfinder Area */}
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ width: frameSize, height: frameSize, position: 'relative' }}>
              {/* Corner brackets */}
              <View style={{ position: 'absolute', left: 0, top: 0, width: 40, height: 40, borderLeftWidth: 4, borderTopWidth: 4, borderColor: PRIMARY_GREEN, borderTopLeftRadius: 24 }} />
              <View style={{ position: 'absolute', right: 0, top: 0, width: 40, height: 40, borderRightWidth: 4, borderTopWidth: 4, borderColor: '#fff', borderTopRightRadius: 24 }} />
              <View style={{ position: 'absolute', left: 0, bottom: 0, width: 40, height: 40, borderLeftWidth: 4, borderBottomWidth: 4, borderColor: '#fff', borderBottomLeftRadius: 24 }} />
              <View style={{ position: 'absolute', right: 0, bottom: 0, width: 40, height: 40, borderRightWidth: 4, borderBottomWidth: 4, borderColor: PRIMARY_GREEN, borderBottomRightRadius: 24 }} />
              
              {/* Animated Scan Line */}
              <Animated.View 
                style={{ 
                  position: 'absolute', 
                  left: 10, 
                  right: 10, 
                  height: 3, 
                  backgroundColor: PRIMARY_GREEN,
                  borderRadius: 2,
                  shadowColor: PRIMARY_GREEN,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 1,
                  shadowRadius: 10,
                  elevation: 10,
                  transform: [{ translateY }]
                }} 
              >
                <View style={{ position: 'absolute', right: -2, top: -4, width: 10, height: 10, borderRadius: 5, backgroundColor: PRIMARY_GREEN, shadowColor: PRIMARY_GREEN, shadowRadius: 10, shadowOpacity: 1 }} />
              </Animated.View>
            </View>

            {/* Status Pill */}
            <View style={{ marginTop: 40, flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 999, alignItems: 'center', gap: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 size={16} color={PRIMARY_GREEN} />
                <Text style={{ color: '#fff', fontSize: 11, fontWeight: '600' }}>Tự động nhận mã</Text>
              </View>
              <View style={{ width: 1, height: 12, backgroundColor: 'rgba(255,255,255,0.3)' }} />
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <ShoppingBag size={16} color={PRIMARY_GREEN} />
                <Text style={{ color: '#fff', fontSize: 11, fontWeight: '600' }}>Giữ máy ổn định</Text>
              </View>
              <View style={{ width: 1, height: 12, backgroundColor: 'rgba(255,255,255,0.3)' }} />
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Sun size={16} color={PRIMARY_GREEN} />
                <Text style={{ color: '#fff', fontSize: 11, fontWeight: '600' }}>Ánh sáng đầy đủ</Text>
              </View>
            </View>
          </View>

          {/* Bottom Controls */}
          <View style={{ paddingBottom: 40, paddingHorizontal: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Pressable
              onPress={pickImage}
              style={{ alignItems: 'center', gap: 8 }}
            >
              <View style={{ width: 60, height: 60, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }}>
                <ImageIcon size={26} color="#fff" />
              </View>
              <Text style={{ color: '#fff', fontSize: 11, fontWeight: '600' }}>Thư viện</Text>
            </Pressable>

            <View style={{ width: 88, height: 88, borderRadius: 44, borderWidth: 4, borderColor: PRIMARY_GREEN, alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ width: 68, height: 68, borderRadius: 34, backgroundColor: '#fff' }} />
            </View>

            <Pressable
              testID="scanner-switch-camera"
              onPress={toggleFacing}
              style={{ alignItems: 'center', gap: 8 }}
            >
              <View style={{ width: 60, height: 60, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }}>
                <RefreshCw size={26} color="#fff" />
              </View>
              <Text style={{ color: '#fff', fontSize: 11, fontWeight: '600' }}>Đổi camera</Text>
            </Pressable>
          </View>

          {/* Floating Info Card */}
          <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
            <View style={{ backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 24, padding: 16, flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: PRIMARY_GREEN, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Scan size={24} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827' }}>Đưa mã vạch vào khung</Text>
                <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>Hỗ trợ mã 1D/2D, QR</Text>
              </View>
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}>
                <ChevronRight size={18} color="#9CA3AF" />
              </View>
            </View>
          </View>

        </SafeAreaView>
      </View>
    </View>
  );
}
