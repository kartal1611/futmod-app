import { useEffect, useState } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { View, Text, ActivityIndicator, StatusBar } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useAuthStore } from '../store/authStore';
import { RENKLER } from '../constants/theme';
import LoginEkrani from '../screens/LoginEkrani';
import AdminLoginEkrani from '../screens/AdminLoginEkrani';
import AdminPanelEkrani from '../screens/AdminPanelEkrani';

function TabIcon({ emoji, label, focused }) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 4 }}>
      <Text style={{ fontSize: 20 }}>{emoji}</Text>
      <Text style={{
        fontSize: 10,
        color: focused ? RENKLER.vurgu : RENKLER.metinUcuncul,
        marginTop: 2,
        fontWeight: focused ? '700' : '400',
      }}>
        {label}
      </Text>
    </View>
  );
}

export default function RootLayout() {
  const { user, panelMode, init } = useAuthStore();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [oturumOncesiEkran, setOturumOncesiEkran] = useState('login'); // 'login' | 'adminLogin'

  useEffect(() => {
    let bitti = false;
    init().finally(() => { if (!bitti) setReady(true); });
    // Hard safety net: never let a slow/stuck network call keep the app on
    // the loading screen forever.
    const zamanAsimi = setTimeout(() => { bitti = true; setReady(true); }, 10000);
    return () => clearTimeout(zamanAsimi);
  }, []);

  // Tapping a "trade" notification opens that specific trade card directly.
  useEffect(() => {
    const abone = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      if (data?.type === 'trade' && data?.tradeId) {
        router.push(`/trade/${data.tradeId}`);
      }
    });
    return () => abone.remove();
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: RENKLER.bg, alignItems: 'center', justifyContent: 'center' }}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color={RENKLER.vurgu} />
        <Text style={{ color: RENKLER.metinIkincil, marginTop: 12 }}>TorunFC yükleniyor...</Text>
      </View>
    );
  }

  if (!user) {
    if (oturumOncesiEkran === 'adminLogin') {
      return <AdminLoginEkrani onGeri={() => setOturumOncesiEkran('login')} />;
    }
    return <LoginEkrani onAdminGiris={() => setOturumOncesiEkran('adminLogin')} />;
  }

  if (panelMode === 'admin' && user.isAdmin) {
    return (
      <>
        <StatusBar barStyle="light-content" />
        <AdminPanelEkrani />
      </>
    );
  }

  return (
    <>
      <StatusBar barStyle="light-content" />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: RENKLER.bg2,
            borderTopColor: RENKLER.ayrici,
            borderTopWidth: 1,
            height: 70,
            paddingBottom: 8,
          },
          tabBarShowLabel: false,
        }}
      >
        <Tabs.Screen name="index" options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" label="Ana Sayfa" focused={focused} /> }} />
        <Tabs.Screen name="toruncoin" options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🪙" label="Toruncoin" focused={focused} /> }} />
        <Tabs.Screen name="puanlarim" options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🎡" label="Puanlarım" focused={focused} /> }} />
        <Tabs.Screen name="iletisim" options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="✉️" label="İletişim" focused={focused} /> }} />
        <Tabs.Screen name="profil" options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="👤" label="Profil" focused={focused} /> }} />
        <Tabs.Screen name="sbc" options={{ href: null }} />
        <Tabs.Screen name="trade" options={{ href: null }} />
      </Tabs>
    </>
  );
}
