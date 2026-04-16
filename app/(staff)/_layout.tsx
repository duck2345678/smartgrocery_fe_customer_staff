import React, { createContext, useContext, useState, useEffect } from 'react';
import { Stack } from 'expo-router';
import { View } from 'react-native';

// Create a Context for the global SLA "tick"
const SLAContext = createContext<{ now: number }>({ now: Date.now() });

export const useSLA = () => useContext(SLAContext);

export default function StaffLayout() {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    // Single global timer: updates every 60 seconds as suggested by Tech Lead
    // to prevent CPU overload in list rendering
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <SLAContext.Provider value={{ now }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ title: 'Staff Dashboard' }} />
      </Stack>
    </SLAContext.Provider>
  );
}
