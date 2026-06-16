import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, Text, TextInput, View } from 'react-native';
import { ChevronDown, MapPin, Search, X } from 'lucide-react-native';
import {
  administrativeProvinces,
  findProvinceByName,
  normalizeAdministrativeSearch,
  type AdministrativeProvince,
  type AdministrativeWard,
} from '../../data/vietnamAdministrativeUnits';

type LocationChange = {
  city: string;
  ward: string;
  district: string;
};

type Props = {
  city: string;
  ward: string;
  onChange: (location: LocationChange) => void;
};

type PickerMode = 'province' | 'ward';

export default function AddressLocationPicker({ city, ward, onChange }: Props) {
  const [pickerMode, setPickerMode] = useState<PickerMode | null>(null);
  const [query, setQuery] = useState('');

  const selectedProvince = useMemo(() => findProvinceByName(city), [city]);
  const wardOptions = selectedProvince?.wards ?? [];

  const options = useMemo(() => {
    const normalizedQuery = normalizeAdministrativeSearch(query);
    const source = pickerMode === 'province' ? administrativeProvinces : wardOptions;
    if (!normalizedQuery) return source;
    return source.filter((item) => normalizeAdministrativeSearch(item.name).includes(normalizedQuery));
  }, [pickerMode, query, wardOptions]);

  const openPicker = (mode: PickerMode) => {
    if (mode === 'ward' && !selectedProvince) return;
    setQuery('');
    setPickerMode(mode);
  };

  const closePicker = () => {
    setPickerMode(null);
    setQuery('');
  };

  const selectProvince = (province: AdministrativeProvince) => {
    onChange({
      city: province.name,
      ward: '',
      district: province.name,
    });
    closePicker();
  };

  const selectWard = (selectedWard: AdministrativeWard) => {
    const provinceName = selectedProvince?.name ?? city;
    onChange({
      city: provinceName,
      ward: selectedWard.name,
      district: provinceName,
    });
    closePicker();
  };

  const title = pickerMode === 'province' ? 'Chọn tỉnh/thành phố' : 'Chọn phường/xã';
  const placeholder = pickerMode === 'province' ? 'Tìm tỉnh/thành phố' : 'Tìm phường/xã';
  const selectedValue = pickerMode === 'province' ? city : ward;

  return (
    <View style={{ gap: 16 }}>
      <DropdownField
        label="Tỉnh/Thành phố *"
        value={city}
        placeholder="Chọn tỉnh/thành phố"
        onPress={() => openPicker('province')}
      />
      <DropdownField
        label="Phường/Xã *"
        value={ward}
        placeholder={selectedProvince ? 'Chọn phường/xã' : 'Chọn tỉnh/thành phố trước'}
        onPress={() => openPicker('ward')}
        disabled={!selectedProvince}
        helper={!selectedProvince ? 'Bạn cần chọn tỉnh/thành phố trước khi chọn phường/xã.' : undefined}
      />

      <Modal visible={pickerMode !== null} transparent animationType="slide" onRequestClose={closePicker}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15, 23, 42, 0.38)' }}>
          <View
            style={{
              maxHeight: '78%',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              backgroundColor: '#f8fafc',
              paddingBottom: 16,
            }}
          >
            <View
              style={{
                paddingHorizontal: 18,
                paddingTop: 16,
                paddingBottom: 12,
                borderBottomWidth: 1,
                borderBottomColor: '#e2e8f0',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text className="font-outfit-bold text-[17px] text-slate-900">{title}</Text>
                <Pressable
                  onPress={closePicker}
                  className="w-9 h-9 rounded-full bg-white items-center justify-center border border-slate-200"
                >
                  <X size={18} color="#475569" />
                </Pressable>
              </View>
              <View className="mt-4 flex-row items-center rounded-2xl border border-slate-200 bg-white px-4">
                <Search size={18} color="#94A3B8" />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder={placeholder}
                  placeholderTextColor="#94A3B8"
                  className="ml-3 flex-1 py-3 font-inter text-[15px] text-slate-900"
                  autoFocus
                />
              </View>
            </View>

            <FlatList
              data={options}
              keyExtractor={(item) => item.code}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ padding: 12 }}
              ListEmptyComponent={
                <View className="items-center px-6 py-10">
                  <Text className="font-inter text-[14px] text-slate-500 text-center">
                    Không tìm thấy đơn vị hành chính phù hợp.
                  </Text>
                </View>
              }
              renderItem={({ item }) => {
                const active = item.name === selectedValue;
                return (
                  <Pressable
                    onPress={() => {
                      if (pickerMode === 'province') selectProvince(item as AdministrativeProvince);
                      else selectWard(item as AdministrativeWard);
                    }}
                    className="mb-2 flex-row items-center justify-between rounded-2xl border px-4 py-3"
                    style={{
                      backgroundColor: active ? '#ecfdf5' : '#fff',
                      borderColor: active ? '#16A34A' : '#e2e8f0',
                    }}
                  >
                    <Text className="font-inter-bold text-[14px] text-slate-800">{item.name}</Text>
                    {active ? <Text className="font-inter-bold text-[13px] text-[#16A34A]">Đã chọn</Text> : null}
                  </Pressable>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

function DropdownField({
  label,
  value,
  placeholder,
  onPress,
  disabled,
  helper,
}: {
  label: string;
  value: string;
  placeholder: string;
  onPress: () => void;
  disabled?: boolean;
  helper?: string;
}) {
  return (
    <View>
      <Text className="text-[13px] font-inter-bold text-slate-500 mb-2 ml-1">{label}</Text>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        className="flex-row items-center rounded-2xl border px-4 py-3"
        style={{
          backgroundColor: disabled ? '#f1f5f9' : '#f8fafc',
          borderColor: disabled ? '#e2e8f0' : '#e2e8f0',
          opacity: disabled ? 0.72 : 1,
        }}
      >
        <MapPin size={18} color={disabled ? '#CBD5E1' : '#94A3B8'} />
        <Text
          className="ml-3 flex-1 font-inter text-[14px]"
          style={{ color: value ? '#0f172a' : '#94a3b8' }}
          numberOfLines={1}
        >
          {value || placeholder}
        </Text>
        <ChevronDown size={18} color={disabled ? '#CBD5E1' : '#64748B'} />
      </Pressable>
      {helper ? <Text className="mt-1 ml-1 font-inter text-[12px] text-slate-400">{helper}</Text> : null}
    </View>
  );
}
