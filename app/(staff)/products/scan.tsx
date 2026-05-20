import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  Text,
  View,
  TextInput,
  useWindowDimensions,
  Modal,
  ScrollView,
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
  Keyboard,
  Search,
  X,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { safeImpact, ImpactFeedbackStyle } from '../../../src/utils/safeHaptics';
import { useStaffProductsStore } from '../../../src/store/staffProductsStore';

const PRIMARY_GREEN = '#10B981'; // Sync with app theme green

// Common Vietnamese fresh produce PLU lookup items (no barcode in supermarket)
const POPULAR_FRESH_ITEMS = [
  { name: 'Rau muống', code: 'RAU-01', category: 'Rau củ' },
  { name: 'Cà chua', code: 'QUA-02', category: 'Rau củ' },
  { name: 'Bắp cải', code: 'RAU-03', category: 'Rau củ' },
  { name: 'Cà rốt', code: 'RAU-04', category: 'Rau củ' },
  { name: 'Thịt ba rọi', code: 'THIT-01', category: 'Thịt tươi' },
  { name: 'Cá hồi', code: 'HAIS-01', category: 'Hải sản' },
  { name: 'Trứng gà', code: 'TRUNG-01', category: 'Trứng sữa' },
  { name: 'Hành lá', code: 'GIAVI-01', category: 'Gia vị' },
];

export default function StaffBarcodeScanScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const setSearch = useStaffProductsStore((s) => s.setSearch);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualInput, setManualInput] = useState('');
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

  const handleManualSearch = (keyword: string) => {
    const val = keyword.trim();
    if (!val) return;
    void safeImpact(ImpactFeedbackStyle.Medium);
    setShowManualModal(false);
    setSearch(val);
    router.back();
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
            
            <View style={{ alignItems: 'center', flex: 1, paddingHorizontal: 20 }}>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>Quét mã sản phẩm</Text>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 4, textAlign: 'center' }}>Đưa mã vạch vào khung để nhận diện</Text>
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
                <Text style={{ color: '#fff', fontSize: 11, fontWeight: '600' }}>Tự động quét</Text>
              </View>
              <View style={{ width: 1, height: 12, backgroundColor: 'rgba(255,255,255,0.3)' }} />
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <ShoppingBag size={16} color={PRIMARY_GREEN} />
                <Text style={{ color: '#fff', fontSize: 11, fontWeight: '600' }}>Để thẳng góc</Text>
              </View>
              <View style={{ width: 1, height: 12, backgroundColor: 'rgba(255,255,255,0.3)' }} />
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Sun size={16} color={PRIMARY_GREEN} />
                <Text style={{ color: '#fff', fontSize: 11, fontWeight: '600' }}>Đủ ánh sáng</Text>
              </View>
            </View>
          </View>

          {/* Bottom Controls */}
          <View style={{ paddingBottom: 30, paddingHorizontal: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
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

          {/* Redesigned Interactive Bottom Button for Barcodeless Products */}
          <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
            <Pressable 
              onPress={() => {
                void safeImpact(ImpactFeedbackStyle.Medium);
                setShowManualModal(true);
              }}
              style={({ pressed }) => ({
                backgroundColor: pressed ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.95)',
                borderRadius: 24,
                padding: 16,
                flexDirection: 'row',
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 6,
                elevation: 4
              })}
            >
              <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: PRIMARY_GREEN, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Keyboard size={24} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827' }}>Không có mã vạch?</Text>
                <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>Tìm bằng Tên hoặc Mã số nhanh (PLU)</Text>
              </View>
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}>
                <ChevronRight size={18} color="#9CA3AF" />
              </View>
            </Pressable>
          </View>

        </SafeAreaView>
      </View>

      {/* Manual Search Modal (Slide up) */}
      <Modal
        visible={showManualModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowManualModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
          <View style={{ 
            backgroundColor: '#fff', 
            borderTopLeftRadius: 32, 
            borderTopRightRadius: 32, 
            paddingTop: 24, 
            paddingHorizontal: 20, 
            paddingBottom: Platform.OS === 'ios' ? 40 : 24,
            maxHeight: '80%'
          }}>
            {/* Modal Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <View>
                <Text style={{ fontSize: 18, fontWeight: '800', color: '#1E293B' }}>Tìm kiếm thủ công</Text>
                <Text style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Dành cho sản phẩm không có mã vạch</Text>
              </View>
              <Pressable 
                onPress={() => setShowManualModal(false)} 
                style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={18} color="#64748B" />
              </Pressable>
            </View>

            {/* Search Input */}
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              backgroundColor: '#F8FAFC', 
              borderWidth: 1, 
              borderColor: '#E2E8F0', 
              borderRadius: 20, 
              paddingHorizontal: 16, 
              paddingVertical: 12,
              marginBottom: 20
            }}>
              <Search size={18} color="#64748B" />
              <TextInput
                value={manualInput}
                onChangeText={setManualInput}
                placeholder="Nhập tên sản phẩm hoặc mã PLU..."
                placeholderTextColor="#94A3B8"
                returnKeyType="search"
                onSubmitEditing={() => handleManualSearch(manualInput)}
                autoFocus
                style={{ flex: 1, marginLeft: 10, fontSize: 15, color: '#0F172A', padding: 0 }}
              />
              {manualInput.length > 0 && (
                <Pressable onPress={() => setManualInput('')}>
                  <X size={16} color="#94A3B8" />
                </Pressable>
              )}
            </View>

            {/* Quick Select Grid (PLU Vietnamese Fresh Goods) */}
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#64748B', marginBottom: 12, marginLeft: 4 }}>
              🏷️ Chọn nhanh sản phẩm tươi sống phổ biến:
            </Text>
            
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 10 }}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {POPULAR_FRESH_ITEMS.map((item, idx) => (
                  <Pressable
                    key={idx}
                    onPress={() => handleManualSearch(item.name)}
                    style={({ pressed }) => ({
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      borderRadius: 16,
                      backgroundColor: pressed ? '#E6FDF5' : '#F1F5F9',
                      borderWidth: 1,
                      borderColor: pressed ? PRIMARY_GREEN : '#E2E8F0',
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8
                    })}
                  >
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: PRIMARY_GREEN }} />
                    <View>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: '#1E293B' }}>{item.name}</Text>
                      <Text style={{ fontSize: 10, color: '#94A3B8', marginTop: 1 }}>{item.code} • {item.category}</Text>
                    </View>
                  </Pressable>
                ))}
              </View>

              {/* Action Button */}
              <Pressable
                onPress={() => handleManualSearch(manualInput)}
                disabled={!manualInput.trim()}
                style={({ pressed }) => ({
                  marginTop: 24,
                  backgroundColor: manualInput.trim() ? PRIMARY_GREEN : '#E2E8F0',
                  paddingVertical: 16,
                  borderRadius: 24,
                  alignItems: 'center',
                  opacity: pressed ? 0.9 : 1
                })}
              >
                <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>Tìm kiếm ngay</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
