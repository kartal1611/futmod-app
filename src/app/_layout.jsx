import { useEffect, useState } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { View, Text, ActivityIndicator, StatusBar } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { useRenkler } from '../constants/theme';
import NeonParilti from '../components/NeonParilti';
import { AnaSayfaIkonu, SbcIkonu, CoinIkonu, PuanlarimIkonu, ForumIkonu, IletisimIkonu, ProfilIkonu } from '../components/nav/TabIkonlari';
import LoginEkrani from '../screens/LoginEkrani';
import AdminLoginEkrani from '../screens/AdminLoginEkrani';
import AdminPanelEkrani from '../screens/AdminPanelEkrani';

function TabIcon({ Ikon, label, focused, RENKLER }) {
  const renk = focused ? RENKLER.vurgu : RENKLER.metinUcuncul;
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 4 }}>
      <View style={focused ? {
        shadowColor: RENKLER.vurgu, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 6, elevation: 6,
      } : null}>
        <Ikon renk={renk} boyut={23} />
      </View>
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.75}
        style={{
          fontSize: 9.5,
          color: renk,
          marginTop: 3,
          fontWeight: focused ? '700' : '400',
          textAlign: 'center',
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export default function RootLayout() {
  const { user, panelMode, init } = useAuthStore();
  const temaInit = useThemeStore((s) => s.init);
  const RENKLER = useRenkler();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [oturumOncesiEkran, setOturumOncesiEkran] = useState('login'); // 'login' | 'adminLogin'

  useEffect(() => {
    let bitti = false;
    Promise.all([init(), temaInit()]).finally(() => { if (!bitti) setReady(true); });
    // Hard safety net: never let a slow/stuck network call keep the app on
    // the loading screen forever.
    const zamanAsimi = setTimeout(() => { bitti = true; setReady(true); }, 10000);
    return () => clearTimeout(zamanAsimi);
  }, []);

  // Tapping a "trade" notification opens that specific trade card directly;
  // tapping a "sbc" (new content) notification opens the SBC list.
  useEffect(() => {
    const abone = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      if (data?.type === 'trade' && data?.tradeId) {
        router.push(`/trade/${data.tradeId}`);
      } else if (data?.type === 'sbc') {
        router.push('/sbc');
      }
    });
    return () => abone.remove();
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: RENKLER.bg, alignItems: 'center', justifyContent: 'center' }}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color={RENKLER.vurgu} />
        <Text style={{ color: RENKLER.metinIkincil, marginTop: 12 }}>FutMod yükleniyor...</Text>
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
    <View style={{ flex: 1, backgroundColor: RENKLER.bg }}>
      <StatusBar barStyle="light-content" />
      {/* Sekmelerin (Tabs) DIŞINDA, en üst seviyede TEK bir sabit katman —
          önceki tasarımda her ekranın kendi ScrollView'ından önce ayrı ayrı
          eklenmişti, ama gerçek cihazda içerikle birlikte kayıyordu
          (ekran görüntüsüyle doğrulandı: sayfa aşağı kaydırılınca köşe
          süsü de aşağı inip HIZLI ERİŞİM bölümünün üstünde kalıyordu).
          Burada, Tabs navigator'ının render ettiği hiçbir iç ScrollView'a
          hiç girmediği için artık kesinlikle sabit kalır. */}
      <NeonParilti />
      <Tabs
        style={{ flex: 1 }}
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: 'transparent' },
          tabBarStyle: {
            backgroundColor: RENKLER.bg,
            borderTopColor: RENKLER.ayrici,
            borderTopWidth: 1,
            height: 70,
            paddingBottom: 8,
          },
          tabBarShowLabel: false,
        }}
      >
        <Tabs.Screen name="index" options={{ tabBarIcon: ({ focused }) => <TabIcon Ikon={AnaSayfaIkonu} label="Ana Sayfa" focused={focused} RENKLER={RENKLER} /> }} />
        <Tabs.Screen name="sbc" options={{ tabBarIcon: ({ focused }) => <TabIcon Ikon={SbcIkonu} label="SBC" focused={focused} RENKLER={RENKLER} /> }} />
        <Tabs.Screen name="toruncoin" options={{ tabBarIcon: ({ focused }) => <TabIcon Ikon={CoinIkonu} label="Coin" focused={focused} RENKLER={RENKLER} /> }} />
        <Tabs.Screen name="puanlarim" options={{ tabBarIcon: ({ focused }) => <TabIcon Ikon={PuanlarimIkonu} label="Puanlarım" focused={focused} RENKLER={RENKLER} /> }} />
        <Tabs.Screen name="forum" options={{ tabBarIcon: ({ focused }) => <TabIcon Ikon={ForumIkonu} label="Forum" focused={focused} RENKLER={RENKLER} /> }} />
        {/* Kadro Yorumlama artık Forum sekmesi içinde bir kategori — ayrı sekme değil, ama
            /kadro-yorumlama/[id] detay rotası hâlâ o kategoriden push edilerek kullanılıyor. */}
        <Tabs.Screen name="kadro-yorumlama" options={{ href: null }} />
        <Tabs.Screen name="iletisim" options={{ tabBarIcon: ({ focused }) => <TabIcon Ikon={IletisimIkonu} label="İletişim" focused={focused} RENKLER={RENKLER} /> }} />
        <Tabs.Screen name="profil" options={{ tabBarIcon: ({ focused }) => <TabIcon Ikon={ProfilIkonu} label="Profil" focused={focused} RENKLER={RENKLER} /> }} />
        <Tabs.Screen name="evrimler" options={{ href: null }} />
        <Tabs.Screen name="oyuncular" options={{ href: null }} />
        <Tabs.Screen name="trade" options={{ href: null }} />
      </Tabs>
    </View>
  );
}
