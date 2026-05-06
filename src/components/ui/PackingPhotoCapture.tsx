import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  Pressable,
  Text,
  View,
  useWindowDimensions,
  ScrollView,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import {
  ChevronLeft,
  Flashlight,
  FlashlightOff,
  Image as ImageIcon,
  CheckCircle2,
  Camera,
  Truck,
  Check,
} from 'lucide-react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { safeImpact, ImpactFeedbackStyle } from '../../utils/safeHaptics';

/* ── Swap Camera Icon (same as scan.tsx) ── */
function SwapCameraIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 6v6h-6"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M3 12a9 9 0 0 1 15.64-6.36L21 6"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M3 18v-6h6"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M21 12a9 9 0 0 1-15.64 6.36L3 18"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M15 10h2a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-5a1 1 0 0 1 1-1h2l1-1.5h4l1 1.5z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="13.5" r="2" stroke={color} strokeWidth={2} />
    </Svg>
  );
}

export type PackingPhotoCaptureProps = {
  visible: boolean;
  title: string;
  hintText?: string;
  primaryColor?: string;
  onClose: () => void;
  onCaptured: (uri: string) => void;
  // Customizable review screen labels
  reviewTitle?: string;
  reviewHint?: string;
  confirmLabel?: string;
};

const PRIMARY = '#16A34A';

export default function PackingPhotoCapture({
  visible,
  title,
  hintText = 'Chụp rõ đơn hàng đã đóng gói',
  primaryColor = PRIMARY,
  onClose,
  onCaptured,
  reviewTitle = 'Kiểm tra ảnh đóng gói',
  reviewHint = 'mã đơn và trạng thái đóng gói',
  confirmLabel = 'Bắt đầu giao hàng',
}: PackingPhotoCaptureProps) {
  const { width, height } = useWindowDimensions();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  const cameraRef = useRef<any>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Reset on close */
  useEffect(() => {
    if (!visible) {
      setFacing('back');
      setTorchEnabled(false);
      setIsBusy(false);
      setToast(null);
      setPreviewUri(null);
      setPreviewMode(false);
      if (toastTimer.current) clearTimeout(toastTimer.current);
    }
  }, [visible]);

  /* Auto-request permission */
  useEffect(() => {
    if (visible && permission && !permission.granted) {
      void requestPermission();
    }
  }, [visible, permission, requestPermission]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2000);
  }, []);

  /* ── Viewfinder dimensions ── */
  const frame = useMemo(() => {
    const maxW = Math.min(340, width - 40);
    const maxH = Math.min(440, height * 0.5);
    const w = maxW;
    const h = Math.min(Math.round(w * 1.05), maxH);
    return { w, h };
  }, [height, width]);

  /* ── Capture ── */
  const capturePhoto = useCallback(async () => {
    if (isBusy) return;
    setIsBusy(true);
    try {
      if (Platform.OS === 'web') {
        const res = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: false,
          quality: 0.9,
        });
        if (!res.canceled && res.assets?.[0]?.uri) {
          setPreviewUri(res.assets[0].uri);
          setPreviewMode(true);
        }
        return;
      }

      if (!cameraRef.current?.takePictureAsync) {
        showToast('Camera chưa sẵn sàng, thử lại.');
        return;
      }

      await safeImpact(ImpactFeedbackStyle.Medium);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        skipProcessing: true,
      });
      if (photo?.uri) {
        setPreviewUri(photo.uri);
        setPreviewMode(true);
      } else {
        showToast('Không thể lưu ảnh. Thử lại.');
      }
    } catch {
      showToast('Lỗi khi chụp ảnh. Thử lại.');
    } finally {
      setIsBusy(false);
    }
  }, [isBusy, showToast]);

  /* ── Pick from library ── */
  const pickFromLibrary = useCallback(async () => {
    if (isBusy) return;
    setIsBusy(true);
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.9,
      });
      if (!res.canceled && res.assets?.[0]?.uri) {
        setPreviewUri(res.assets[0].uri);
        setPreviewMode(true);
      }
    } catch {
      showToast('Lỗi khi mở thư viện ảnh.');
    } finally {
      setIsBusy(false);
    }
  }, [isBusy, showToast]);

  const confirmPhoto = useCallback(() => {
    if (previewUri) {
      onCaptured(previewUri);
    }
  }, [onCaptured, previewUri]);

  const retakePhoto = useCallback(() => {
    setPreviewUri(null);
    setPreviewMode(false);
  }, []);

  const needsPermission = !permission?.granted;

  /* ════════════════════════════════════════════════════
      RENDER PREVIEW SCREEN (Matching the screenshot)
      ════════════════════════════════════════════════════ */
  const renderReview = () => {
    return (
      <View style={{ flex: 1, backgroundColor: '#fff' }}>
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingTop: 54,
            paddingHorizontal: 16,
            paddingBottom: 16,
          }}
        >
          <Pressable
            onPress={retakePhoto}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: '#F8FAFC',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: '#F1F5F9',
            }}
          >
            <ChevronLeft size={24} color="#1E293B" />
          </Pressable>
          <Text
            style={{
              flex: 1,
              textAlign: 'center',
              fontSize: 18,
              fontWeight: '800',
              color: '#1E293B',
              marginRight: 44,
            }}
          >
            {reviewTitle}
          </Text>
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}>
          {/* Info bar */}
          <View
            style={{
              flexDirection: 'row',
              backgroundColor: '#F7FBF9',
              padding: 16,
              borderRadius: 16,
              alignItems: 'center',
              gap: 12,
              marginBottom: 20,
            }}
          >
            <CheckCircle2 size={24} color="#22C55E" />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, color: '#16A34A', fontWeight: '700' }}>
                Đảm bảo ảnh rõ nét, thể hiện đầy đủ
              </Text>
              <Text style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>
                {reviewHint}
              </Text>
            </View>
          </View>

          {/* Captured Image */}
          <View
            style={{
              width: '100%',
              aspectRatio: 1,
              borderRadius: 24,
              overflow: 'hidden',
              backgroundColor: '#F1F5F9',
              marginBottom: 24,
            }}
          >
            <Image
              source={{ uri: previewUri || '' }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          </View>

          {/* Criteria */}
          <View style={{ backgroundColor: '#F8FAFC', padding: 20, borderRadius: 20, gap: 12 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#475569', marginBottom: 4 }}>
              Tiêu chí ảnh hợp lệ
            </Text>

            {[
              'Mã đơn hiển thị rõ ràng',
              'Thấy rõ toàn bộ kiện hàng',
              'Ảnh không bị mờ, lóa sáng',
            ].map((text, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    backgroundColor: '#DCFCE7',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Check size={12} color="#16A34A" strokeWidth={3} />
                </View>
                <Text style={{ fontSize: 14, color: '#334155', fontWeight: '500' }}>{text}</Text>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Bottom Actions */}
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: '#fff',
            paddingHorizontal: 20,
            paddingBottom: 40,
            paddingTop: 16,
            flexDirection: 'row',
            gap: 12,
            borderTopWidth: 1,
            borderTopColor: '#F1F5F9',
          }}
        >
          <Pressable
            onPress={retakePhoto}
            style={{
              flex: 1,
              flexDirection: 'row',
              height: 56,
              borderRadius: 16,
              borderWidth: 1.5,
              borderColor: '#22C55E',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <Camera size={20} color="#16A34A" />
            <Text style={{ color: '#16A34A', fontSize: 16, fontWeight: '700' }}>Chụp lại</Text>
          </Pressable>

          <Pressable
            onPress={confirmPhoto}
            style={{
              flex: 1.4,
              flexDirection: 'row',
              height: 56,
              borderRadius: 16,
              backgroundColor: '#22C55E',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <Truck size={20} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>
              {confirmLabel}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="fullScreen"
    >
      {previewMode && previewUri ? (
        renderReview()
      ) : (
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          {/* HEADER — Back arrow + Title (centered) */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingTop: 54,
              paddingHorizontal: 16,
              paddingBottom: 8,
            }}
          >
            <Pressable
              onPress={onClose}
              testID="packing-photo-back"
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: 'rgba(255,255,255,0.1)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              hitSlop={10}
            >
              <ChevronLeft size={26} color="#fff" />
            </Pressable>
            <Text
              style={{
                flex: 1,
                textAlign: 'center',
                color: '#fff',
                fontSize: 17,
                fontWeight: '700',
                marginRight: 44,
              }}
              numberOfLines={1}
            >
              {title}
            </Text>
          </View>

          {/* FLASH TOGGLE — Centered pill */}
          <View style={{ alignItems: 'center', marginTop: 4, marginBottom: 10 }}>
            <Pressable
              onPress={() => {
                setTorchEnabled((v) => !v);
                void safeImpact(ImpactFeedbackStyle.Light);
              }}
              testID="packing-photo-flash"
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 999,
                backgroundColor: 'rgba(255,255,255,0.12)',
                gap: 6,
              }}
            >
              {torchEnabled ? (
                <FlashlightOff size={15} color="#fff" />
              ) : (
                <Flashlight size={15} color="#fff" />
              )}
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>
                {torchEnabled ? 'Tắt flash' : 'Bật đèn flash'}
              </Text>
            </Pressable>
          </View>

          {/* CAMERA VIEWFINDER */}
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            {needsPermission ? (
              <View style={{ alignItems: 'center', paddingHorizontal: 24 }}>
                <Text
                  style={{ color: '#fff', fontSize: 15, fontWeight: '700', textAlign: 'center' }}
                >
                  Cần quyền camera để chụp ảnh
                </Text>
                <Pressable
                  onPress={() => void requestPermission()}
                  style={{
                    marginTop: 16,
                    paddingHorizontal: 24,
                    paddingVertical: 12,
                    borderRadius: 16,
                    backgroundColor: primaryColor,
                  }}
                >
                  <Text style={{ color: '#fff', fontWeight: '700' }}>Cấp quyền camera</Text>
                </Pressable>
              </View>
            ) : Platform.OS === 'web' ? (
              <View
                style={{
                  width: frame.w,
                  height: frame.h,
                  borderRadius: 26,
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.15)',
                  backgroundColor: 'rgba(0,0,0,0.2)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: 'rgba(255,255,255,0.8)', fontWeight: '700' }}>
                  Camera không khả dụng trên Web
                </Text>
              </View>
            ) : (
              <View
                style={{ width: frame.w, height: frame.h, borderRadius: 26, overflow: 'hidden' }}
              >
                <CameraView
                  ref={cameraRef}
                  style={{ width: frame.w, height: frame.h }}
                  facing={facing}
                  enableTorch={torchEnabled}
                />
                <View
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <View style={{ width: frame.w * 0.88, height: frame.h * 0.72 }}>
                    <View
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        borderRadius: 18,
                        borderWidth: 2,
                        borderColor: 'rgba(255,255,255,0.18)',
                      }}
                    />
                    <View
                      style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        height: 1,
                        top: '33.333%',
                        backgroundColor: 'rgba(255,255,255,0.18)',
                      }}
                    />
                    <View
                      style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        height: 1,
                        top: '66.666%',
                        backgroundColor: 'rgba(255,255,255,0.18)',
                      }}
                    />
                    <View
                      style={{
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        width: 1,
                        left: '33.333%',
                        backgroundColor: 'rgba(255,255,255,0.18)',
                      }}
                    />
                    <View
                      style={{
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        width: 1,
                        left: '66.666%',
                        backgroundColor: 'rgba(255,255,255,0.18)',
                      }}
                    />
                    <View
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        width: 32,
                        height: 32,
                        borderLeftWidth: 4,
                        borderTopWidth: 4,
                        borderColor: primaryColor,
                        borderTopLeftRadius: 14,
                      }}
                    />
                    <View
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: 0,
                        width: 32,
                        height: 32,
                        borderRightWidth: 4,
                        borderTopWidth: 4,
                        borderColor: primaryColor,
                        borderTopRightRadius: 14,
                      }}
                    />
                    <View
                      style={{
                        position: 'absolute',
                        left: 0,
                        bottom: 0,
                        width: 32,
                        height: 32,
                        borderLeftWidth: 4,
                        borderBottomWidth: 4,
                        borderColor: primaryColor,
                        borderBottomLeftRadius: 14,
                      }}
                    />
                    <View
                      style={{
                        position: 'absolute',
                        right: 0,
                        bottom: 0,
                        width: 32,
                        height: 32,
                        borderRightWidth: 4,
                        borderBottomWidth: 4,
                        borderColor: primaryColor,
                        borderBottomRightRadius: 14,
                      }}
                    />
                  </View>
                </View>
                <View
                  style={{
                    position: 'absolute',
                    bottom: 14,
                    left: 0,
                    right: 0,
                    alignItems: 'center',
                  }}
                >
                  <View
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 7,
                      borderRadius: 999,
                      backgroundColor: 'rgba(0,0,0,0.50)',
                    }}
                  >
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '500' }}>
                      {hintText}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* TOAST */}
          {toast && (
            <View
              style={{ position: 'absolute', top: 120, left: 16, right: 16, alignItems: 'center' }}
            >
              <View
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 14,
                  backgroundColor: 'rgba(0,0,0,0.75)',
                }}
              >
                <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600', textAlign: 'center' }}>
                  {toast}
                </Text>
              </View>
            </View>
          )}

          {/* BOTTOM CONTROLS */}
          <View
            style={{
              paddingHorizontal: 32,
              paddingBottom: 44,
              paddingTop: 20,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: 'rgba(30,30,30,0.6)',
            }}
          >
            <Pressable
              onPress={pickFromLibrary}
              disabled={isBusy}
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: 'rgba(255,255,255,0.1)',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: isBusy ? 0.4 : 1,
              }}
            >
              <ImageIcon size={24} color="#fff" />
              <Text style={{ color: '#fff', fontSize: 10, marginTop: 3, fontWeight: '500' }}>
                Thư viện
              </Text>
            </Pressable>

            <Pressable
              onPress={capturePhoto}
              disabled={isBusy || needsPermission}
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: 'rgba(255,255,255,0.25)',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: isBusy || needsPermission ? 0.5 : 1,
              }}
            >
              {isBusy ? (
                <ActivityIndicator color="#fff" size="large" />
              ) : (
                <View
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    backgroundColor: '#fff',
                    borderWidth: 4,
                    borderColor: primaryColor,
                  }}
                />
              )}
            </Pressable>

            <Pressable
              onPress={() => {
                setFacing((f) => (f === 'back' ? 'front' : 'back'));
                void safeImpact(ImpactFeedbackStyle.Light);
              }}
              disabled={isBusy}
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: 'rgba(255,255,255,0.1)',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: isBusy ? 0.4 : 1,
              }}
            >
              <SwapCameraIcon size={24} color="#fff" />
              <Text style={{ color: '#fff', fontSize: 10, marginTop: 3, fontWeight: '500' }}>
                Đổi camera
              </Text>
            </Pressable>
          </View>
        </View>
      )}
    </Modal>
  );
}
