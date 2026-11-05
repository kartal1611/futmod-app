import { useEffect, useState } from 'react';
import { Tabs, useRouter, ThemeProvider, DarkTheme } from 'expo-router';
import { View, Text, ActivityIndicator, StatusBar, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';
import { useThemeStore } from '../store/themeStore';
import { useRenkler } from '../constants/theme';
import NeonParilti from '../components/NeonParilti';
import { ForumIkonu, ContentIkonu, BildirimIkonu, ProfilIkonu } from '../components/nav/TabIkonlari';
import { useBildirimStore } from '../store/bildirimStore';
import LoginEkrani from '../screens/LoginEkrani';
import AdminLoginEkrani from '../screens/AdminLoginEkrani';
import AdminPanelEkrani from '../screens/AdminPanelEkrani';
import KurallarOnayEkrani from '../screens/KurallarOnayEkrani';
import TanitimEkrani from '../screens/TanitimEkrani';
import * as SecureStore from 'expo-secure-store';

// Varsayılan davranışta expo-notifications, uygulama ÖN PLANDAYKEN gelen
// bildirimi tamamen sessizce yutar — hiç banner/ses göstermez (arka planda
// veya kapalıyken normal görünür). Kullanıcı app'i açık tutup test ederken
// "bildirim gelmedi" sanmasının asıl nedeni muhtemelen buydu; bildirim
// aslında gelmiş ama gösterilmemişti. Bu handler modül yüklenirken (import
// zamanında) bir kez ayarlanır — component render'ından önce olması şart.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const BILDIRIM_YENILEME_ARALIGI = 60000;
const TANITIM_KEY = 'futmod_tanitim_goruldu';

function TabIcon({ Ikon, label, focused, RENKLER, rozet = 0 }) {
  const renk = focused ? RENKLER.vurgu : RENKLER.metinUcuncul;
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 4 }}>
      <View style={focused ? {
        shadowColor: RENKLER.vurgu, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 6, elevation: 6,
      } : null}>
        <Ikon renk={renk} boyut={23} />
        {rozet > 0 ? (
          <View style={{
            position: 'absolute', top: -4, right: -9, minWidth: 16, height: 16, borderRadius: 8, paddingHorizontal: 3,
            alignItems: 'center', justifyContent: 'center', backgroundColor: RENKLER.hata,
          }}>
            <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>{rozet > 99 ? '99+' : rozet}</Text>
          </View>
        ) : null}
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
  const [tanitimGoster, setTanitimGoster] = useState(false);

  useEffect(() => {
    let bitti = false;
    Promise.all([
      init(),
      temaInit(),
      SecureStore.getItemAsync(TANITIM_KEY).then((g) => setTanitimGoster(!g)).catch(() => {}),
    ]).finally(() => { if (!bitti) setReady(true); });
    // Hard safety net: never let a slow/stuck network call keep the app on
    // the loading screen forever.
    const zamanAsimi = setTimeout(() => { bitti = true; setReady(true); }, 10000);
    return () => clearTimeout(zamanAsimi);
  }, []);

  // Giriş yapılınca bildirim izni iste + push token'ı sunucuya kaydet. Eskiden
  // token yalnızca Profil ekranı açılınca kaydediliyordu → FutMod uygulamasına
  // hiç bildirim gitmiyordu (tek token Expo Go'dan kalmaydı).
  useEffect(() => {
    if (!user || panelMode === 'admin') return;
    (async () => {
      try {
        let { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted') ({ status } = await Notifications.requestPermissionsAsync());
        if (status !== 'granted') return;
        const tokenResp = await Notifications.getExpoPushTokenAsync();
        await api.registerPushToken(tokenResp.data, Platform.OS);
      } catch { /* bildirim en iyi çaba — uygulamayı asla bozmasın */ }
    })();
  }, [user?.id]);

  // Rozet bildirim gelmeden de güncel kalsın; yalnızca üye modunda anlamlı.
  const bildirimYenile = useBildirimStore((s) => s.yenile);
  const okunmamis = useBildirimStore((s) => s.okunmamis);
  useEffect(() => {
    if (!user || panelMode === 'admin') return undefined;
    bildirimYenile();
    const zamanlayici = setInterval(bildirimYenile, BILDIRIM_YENILEME_ARALIGI);
    return () => clearInterval(zamanlayici);
  }, [user?.id, panelMode]);

  // Tapping a "forum" (new reply) notification opens that thread directly.
  const bildirimYonlendir = (data) => {
    if (data?.type === 'forum' && data.threadId) {
      router.push(`/forum/${data.threadId}`);
    } else if (data?.type === 'sbc') {
      router.push('/content');
    }
  };

  useEffect(() => {
    // addNotificationResponseReceivedListener SADECE bu listener kayıtlı
    // OLDUKTAN SONRA gelen dokunuşları yakalar. Uygulama tamamen kapalıyken
    // bildirime dokunulup açılan "cold start"ta, dokunma olayı listener
    // henüz bağlanmadan önce zaten geçmiş oluyor — bu yüzden hiçbir şey
    // olmuyordu. getLastNotificationResponseAsync() o son dokunuşu ilk
    // render'da geriye dönük okur.
    let iptal = false;
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!iptal && response) bildirimYonlendir(response.notification.request.content.data);
    });
    const abone = Notifications.addNotificationResponseReceivedListener((response) => {
      bildirimYonlendir(response.notification.request.content.data);
    });
    return () => { iptal = true; abone.remove(); };
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

  if (!user && tanitimGoster) {
    return (
      <TanitimEkrani
        onBitti={() => {
          setTanitimGoster(false);
          SecureStore.setItemAsync(TANITIM_KEY, '1').catch(() => {});
        }}
      />
    );
  }

  if (!user) {
    if (oturumOncesiEkran === 'adminLogin') {
      return <AdminLoginEkrani onGeri={() => setOturumOncesiEkran('login')} />;
    }
    return <LoginEkrani onAdminGiris={() => setOturumOncesiEkran('adminLogin')} />;
  }

  if (panelMode !== 'admin' && !user.termsAcceptedAt) {
    return (
      <>
        <StatusBar barStyle="light-content" />
        <KurallarOnayEkrani />
      </>
    );
  }

  if (panelMode === 'admin' && user.isAdmin) {
    return (
      <>
        <StatusBar barStyle="light-content" />
        <AdminPanelEkrani />
      </>
    );
  }

  // React Navigation'ın kendi varsayılan teması hiç özelleştirilmemişti —
  // bu da NavigationContainer'ın en alt seviyesinde (her ekranın kendi
  // içeriğinden BİLE önce boyanan) sabit BEYAZ bir arkaplan demekti.
  // ORTAK_STIL.ekran şeffaf yapılınca (global NeonParilti'nin görünmesi
  // için) bu beyaz taban ortaya çıktı — özellikle iç içe Stack
  // navigator'lardaki (Forum detay sayfaları) push
  // edilen ekranlarda net şekilde görüldü. Çözüm: navigasyon temasının
  // `colors.background`'unu buradan RENKLER.bg'ye sabitlemek — artık en
  // altta hiçbir zaman beyaz yok, olsa olsa koyu lacivert taban var.
  const navTemasi = { ...DarkTheme, colors: { ...DarkTheme.colors, background: RENKLER.bg, card: RENKLER.bg } };

  return (
    <ThemeProvider value={navTemasi}>
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
        <Tabs.Screen name="index" options={{ href: null }} />
        <Tabs.Screen name="forum" options={{ tabBarIcon: ({ focused }) => <TabIcon Ikon={ForumIkonu} label="Forum" focused={focused} RENKLER={RENKLER} /> }} />
        <Tabs.Screen name="content" options={{ tabBarIcon: ({ focused }) => <TabIcon Ikon={ContentIkonu} label="Content" focused={focused} RENKLER={RENKLER} /> }} />
        <Tabs.Screen name="bildirimler" options={{ tabBarIcon: ({ focused }) => <TabIcon Ikon={BildirimIkonu} label="Bildirimler" focused={focused} RENKLER={RENKLER} rozet={okunmamis} /> }} />
        <Tabs.Screen name="profil" options={{ tabBarIcon: ({ focused }) => <TabIcon Ikon={ProfilIkonu} label="Profil" focused={focused} RENKLER={RENKLER} /> }} />
        <Tabs.Screen name="sbc" options={{ href: null }} />
        <Tabs.Screen name="evrimler" options={{ href: null }} />
        <Tabs.Screen name="oyuncular" options={{ href: null }} />
      </Tabs>
    </View>
    </ThemeProvider>
  );
}
