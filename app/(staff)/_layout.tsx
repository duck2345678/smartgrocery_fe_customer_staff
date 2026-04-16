import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Tabs } from 'expo-router';
import { AppState, AppStateStatus } from 'react-native';
import { LayoutDashboard, ClipboardList } from 'lucide-react-native';

// Create a Context for the global SLA "tick"
const SLAContext = createContext<{ now: number }>({ now: Date.now() });

export const useSLA = () => useContext(SLAContext);

export default function StaffLayout() {
  const [now, setNow] = useState(Date.now());
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    // 1. Centralized SLA Tick: updates every 60 seconds
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 60000);

    // 2. Tech Lead's "Bulletproof" AppState Resync Logic
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App has come to the foreground! Resync immediately.
        console.log('App has come to the foreground! Resyncing SLA Timer...');
        setNow(Date.now());
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, []);

  return (
    <SLAContext.Provider value={{ now }}>
      <Tabs screenOptions={{ 
        tabBarActiveTintColor: '#2563EB',
        headerShown: false,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#F1F5F9',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontFamily: 'Inter',
          fontSize: 12,
        }
      }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color }) => <LayoutDashboard size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="assignments"
          options={{
            title: 'Phân công',
            tabBarIcon: ({ color }) => <ClipboardList size={24} color={color} />,
          }}
        />
      </Tabs>
    </SLAContext.Provider>
  );
}
