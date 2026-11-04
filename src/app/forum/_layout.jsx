import { Stack } from 'expo-router';

// Bildirimden veya başka sekmeden bir başlığa gelince altta liste kalsın, geri çalışsın.
export const unstable_settings = { initialRouteName: 'index' };

export default function ForumLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }} />;
}
