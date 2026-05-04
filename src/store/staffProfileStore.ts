import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type StaffProfileState = {
  receiveInAppNotifications: boolean;
  setReceiveInAppNotifications: (value: boolean) => void;
};

export const useStaffProfileStore = create<StaffProfileState>()(
  persist(
    (set) => ({
      receiveInAppNotifications: true,
      setReceiveInAppNotifications: (value) => set({ receiveInAppNotifications: value }),
    }),
    {
      name: 'sg_staff_profile_v1',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
