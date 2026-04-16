import React from 'react';
import { ScrollView, View, Text, SafeAreaView } from 'react-native';
import Button from '../../src/components/ui/Button';
import Card from '../../src/components/ui/Card';
import Badge from '../../src/components/ui/Badge';
import Input from '../../src/components/ui/Input';
import { Search, User, Package, Bell } from 'lucide-react-native';
import { Stack } from 'expo-router';

export default function DesignSystemScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: true, title: 'Design System Showcase' }} />
      <ScrollView className="flex-1 p-6">
        
        {/* Colors & Theming */}
        <Section title="Colors & Theming">
          <View className="flex-row flex-wrap gap-4">
            <ColorBlock color="bg-primary" label="Primary (Customer/Staff)" />
            <ColorBlock color="bg-success" label="Success" />
            <ColorBlock color="bg-warning" label="Warning" />
            <ColorBlock color="bg-danger" label="Danger" />
          </View>
        </Section>

        {/* Typography */}
        <Section title="Typography">
          <Text className="text-3xl font-outfit-bold text-slate-900 mb-2">Outfit Bold (Heading)</Text>
          <Text className="text-xl font-outfit text-slate-700 mb-4">Outfit Regular (Sub-heading)</Text>
          <Text className="text-base font-inter-bold text-slate-900">Inter Bold (Action/Small Label)</Text>
          <Text className="text-base font-inter-medium text-slate-700">Inter Medium (Body Strong)</Text>
          <Text className="text-base font-inter text-slate-600">Inter Regular (Body Copy)</Text>
        </Section>

        {/* Buttons */}
        <Section title="Buttons (with Haptics)">
          <View className="gap-y-4">
            <Button label="Primary Solid" variant="solid" />
            <Button label="Primary Outline" variant="outline" />
            <Button label="Ghost Button" variant="ghost" />
            <Button label="Loading State" loading />
            <Button label="Staff Mode Press" hapticVariant="medium" className="bg-blue-600" />
          </View>
        </Section>

        {/* Badges */}
        <Section title="Badges (Status Tags)">
          <View className="flex-row flex-wrap gap-2">
            <Badge label="Pending" variant="neutral" />
            <Badge label="Picking" variant="warning" />
            <Badge label="Assigned" variant="info" />
            <Badge label="Delivered" variant="success" />
            <Badge label="Cancelled" variant="danger" />
          </View>
        </Section>

        {/* Cards */}
        <Section title="Cards">
          <Card className="mb-4">
            <View className="flex-row items-center">
              <Package size={24} color="#22C55E" />
              <View className="ml-3 flex-1">
                <Text className="font-outfit-bold text-lg">Premium Grocery Pack</Text>
                <Text className="text-slate-500">Fresh organic vegetables delivered daily.</Text>
              </View>
              <Badge label="New" variant="success" />
            </View>
          </Card>
          <Card variant="outline">
            <Text className="font-inter-medium italic text-slate-500 text-center">Outline style card for secondary info.</Text>
          </Card>
        </Section>

        {/* Inputs */}
        <Section title="Inputs & Search">
          <Input 
            label="Full Name" 
            placeholder="Enter your name" 
            icon={<User size={20} color="#94A3B8" />} 
          />
          <Input 
            label="Search Products" 
            placeholder="Apple, Milk, Bread..." 
            icon={<Search size={20} color="#94A3B8" />} 
          />
          <Input 
            label="Email Address" 
            value="invalid-email" 
            error="Please enter a valid email address" 
          />
        </Section>

        <View className="h-20" />
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <View className="mb-8">
      <Text className="text-xs font-inter-bold text-slate-400 uppercase tracking-widest mb-4">
        {title}
      </Text>
      {children}
    </View>
  );
}

function ColorBlock({ color, label }: { color: string, label: string }) {
  return (
    <View className="items-center w-32">
      <View className={`w-full h-16 rounded-xl ${color} shadow-sm mb-2`} />
      <Text className="text-xs text-center text-slate-600 font-inter-medium">{label}</Text>
    </View>
  );
}
