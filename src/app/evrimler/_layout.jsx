import { Stack } from 'expo-router';

export default function EvrimlerLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }} />;
}
