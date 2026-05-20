import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }} initialRouteName="index">
      <Stack.Screen name="index" />
      <Stack.Screen name="details" />
      <Stack.Screen name="work-history" />
      <Stack.Screen name="payslip" />
      <Stack.Screen name="change-password" />
    </Stack>
  );
}
