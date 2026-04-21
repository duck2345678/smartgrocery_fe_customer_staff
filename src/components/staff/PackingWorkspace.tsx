import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Alert, Linking } from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { AssignmentStatus, OrderAssignment } from '../../types/fulfillment';
import { fileApi } from '../../api/file';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { Camera as CameraIcon, CheckCircle2, Package, X, RefreshCcw, Settings } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useIsFocused } from '@react-navigation/native';

interface PackingWorkspaceProps {
  assignment: OrderAssignment;
  onUpdateStatus: (status: AssignmentStatus, proofImageUrl: string) => Promise<void>;
  isUpdating: boolean;
}

export default function PackingWorkspace({ 
  assignment, 
  onUpdateStatus, 
  isUpdating 
}: PackingWorkspaceProps) {
  const isFocused = useIsFocused();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const cameraRef = React.useRef<CameraView>(null);

  useEffect(() => {
    if (showCamera) {
      (async () => {
        const { status } = await Camera.requestCameraPermissionsAsync();
        setHasPermission(status === 'granted');
      })();
    }
  }, [showCamera]);

  const takePhoto = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
        if (photo?.uri) {
          setPhotoUri(photo.uri);
          setShowCamera(false);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } catch (e) {
        console.error('Photo capture error:', e);
        Alert.alert('Lỗi', 'Không thể chụp ảnh. Vui lòng thử lại.');
      }
    }
  };

  const handleFinish = async () => {
    if (!photoUri) {
      Alert.alert('Yêu cầu', 'Bạn cần chụp ảnh bằng chứng đóng gói trước khi hoàn tất.');
      return;
    }
    if (isUploading || isUpdating) return;

    try {
      setIsUploading(true);
      // Tech Lead's Rule: Use Multipart Upload
      const { url } = await fileApi.upload(photoUri);
      await onUpdateStatus(AssignmentStatus.COMPLETED, url);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      console.error('Finalize error:', e);
      Alert.alert('Lỗi', 'Có lỗi xảy ra trong quá trình xác nhận đơn hàng.');
    } finally {
      setIsUploading(false);
    }
  };

  if (showCamera && isFocused) {
    if (hasPermission === false) {
      return (
        <View className="flex-1 justify-center items-center bg-slate-900 p-8">
          <Settings size={48} color="#EF4444" className="mb-6" />
          <Text className="text-white text-xl font-outfit-bold text-center mb-2">Quyền truy cập bị từ chối</Text>
          <Text className="text-slate-400 text-center font-inter mb-10">
            Cần quyền Camera để chụp ảnh bằng chứng đóng gói.
          </Text>
          <Button label="Mở Cài đặt" onPress={() => Linking.openSettings()} className="w-full mb-4" />
          <Button label="Quay lại" variant="ghost" onPress={() => setShowCamera(false)} />
        </View>
      );
    }

    return (
      <View className="flex-1 bg-black">
        <CameraView ref={cameraRef} className="flex-1">
          <View className="flex-1 justify-between p-6">
            <TouchableOpacity onPress={() => setShowCamera(false)} className="w-10 h-10 bg-black/40 rounded-full items-center justify-center">
              <X size={24} color="#FFF" />
            </TouchableOpacity>
            
            <View className="items-center mb-10">
              <Text className="text-white font-inter-bold mb-4 text-center">Chụp ảnh kiện hàng đã đóng gói</Text>
              <TouchableOpacity 
                onPress={takePhoto}
                className="w-20 h-20 rounded-full bg-white border-8 border-slate-300 items-center justify-center shadow-lg"
              />
            </View>
          </View>
        </CameraView>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ padding: 24 }}>
      <View className="mb-6">
        <Text className="text-xs font-inter-bold text-slate-400 uppercase mb-1">Quy trình đóng gói</Text>
        <Text className="text-2xl font-outfit-bold text-slate-900">Xác nhận bằng chứng</Text>
      </View>

      <Card className="mb-6 p-4 bg-blue-50 border border-blue-100">
        <View className="flex-row items-center mb-3">
          <Package size={20} color="#2563EB" />
          <Text className="ml-2 font-inter-bold text-blue-800">Kiểm tra lần cuối</Text>
        </View>
        <Text className="text-xs text-blue-600 font-inter">
          Đảm bảo toàn bộ {assignment.totalItems} sản phẩm đã được đặt vào túi/thùng và đóng gói kỹ càng.
        </Text>
      </Card>

      {/* Proof Photo Area */}
      <View className="mb-8">
        <Text className="text-sm font-inter-bold text-slate-600 mb-4">Hình ảnh bằng chứng</Text>
        
        {photoUri ? (
          <View className="relative">
            <Image 
              source={{ uri: photoUri }} 
              className="w-full h-64 rounded-3xl bg-slate-100"
              resizeMode="cover"
            />
            <TouchableOpacity 
              onPress={() => setShowCamera(true)}
              className="absolute bottom-4 right-4 bg-white/90 px-4 py-2 rounded-full flex-row items-center border border-slate-200"
            >
              <RefreshCcw size={16} color="#475569" />
              <Text className="ml-2 text-slate-600 font-inter-bold text-xs">Chụp lại</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity 
            onPress={() => setShowCamera(true)}
            className="w-full h-64 rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 items-center justify-center"
          >
            <View className="bg-white p-4 rounded-full shadow-sm mb-4">
              <CameraIcon size={32} color="#2563EB" />
            </View>
            <Text className="text-slate-600 font-inter-bold">Chạm để chụp ảnh</Text>
            <Text className="text-slate-400 text-xs mt-1">Ảnh chụp kiện hàng thực tế</Text>
          </TouchableOpacity>
        )}
      </View>

      <Button 
        label="Đóng gói & Bàn giao Shipper"
        onPress={handleFinish}
        loading={isUploading || isUpdating}
        disabled={!photoUri}
        hapticVariant="success"
        className="mt-4"
      />
      
      <View className="mt-8 flex-row justify-center items-center">
        <CheckCircle2 size={16} color="#94A3B8" />
        <Text className="ml-2 text-slate-400 text-xs font-inter italic">
          Hoàn tất đóng gói để bàn giao cho đơn vị vận chuyển.
        </Text>
      </View>
    </ScrollView>
  );
}
