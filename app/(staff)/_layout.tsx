import React, { createContext, useContext, useState, useEffect } from 'react';
import { Tabs } from 'expo-router';
import { LayoutDashboard, ClipboardList, Package, Truck, Settings } from 'lucide-react-native';

// Create a Context for the global SLA "tick"
const SLAContext = createContext<{ now: number }>({ now: Date.now() });

export const useSLA = () => useContext(SLAContext);

export default function StaffLayout() {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    // Single global timer: updates every 60 seconds to optimize performance
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <SLAContext.Provider value={{ now }}>
      <Tabs screenOptions={{ 
        tabBarActiveTintColor: '#2563EB',
        headerShown: false,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#F1F5F9',
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
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
            title: 'Assigned',
            tabBarIcon: ({ color }) => <ClipboardList size={24} color={color} />,
          }}
        />
        {/* Picking, Packing, Settings tabs to be added in future sprints */}
      </Tabs>
    </SLAContext.Provider>
  );
}
