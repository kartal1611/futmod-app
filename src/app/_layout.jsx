import { useEffect, useState } from 'react';
import { Tabs, useRouter, ThemeProvider, DarkTheme, DefaultTheme } from 'expo-router';
import { View, Text, ActivityIndicator, StatusBar, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';
import { useThemeStore } from '../store/themeStore';
import { useRenkler } from '../constants/theme';
import NeonParilti from '../components/NeonParilti';
import AltSekmeCubugu from '../components/nav/AltSekmeCubugu';
import HataSiniri from '../components/HataSiniri';
import { useFonts, BarlowCondensed_700Bold, BarlowCondensed_700Bold_Italic, BarlowCondensed_800ExtraBold_Italic, BarlowCondensed_900Black_Italic } from '@expo-google-fonts/barlow-condensed';
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

// expo-router bir rota çizilirken hata olursa bunu gösterir (boş ekran yerine).
export function ErrorBoundary({ error, retry }) {
  return (
    <View style={{ flex: 1, backgroundColor: '#0c0d10', paddingTop: 70, paddingHorizontal: 20 }}>
      <Text style={{ color: '#F4C24D', fontSize: 20, fontWeight: '900' }}>Bir hata oluştu</Text>
      <Text selectable style={{ color: '#f5f5f2', fontSize: 12, marginTop: 12 }}>{String(error?.message || error)}</Text>
      <Text selectable style={{ color: '#767c88', fontSize: 10.5, marginTop: 8 }}>{String(error?.stack || '').split('\n').slice(0, 12).join('\n')}</Text>
      <Text onPress={retry} style={{ color: '#F4C24D', fontWeight: '900', marginTop: 20 }}>Tekrar dene</Text>
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
  // Font yüklenemezse sistem fontuyla devam edilir; açılışı asla bekletmez.
  const [fontlarHazir, fontHatasi] = useFonts({ BarlowCondensed_700Bold, BarlowCondensed_700Bold_Italic, BarlowCondensed_800ExtraBold_Italic, BarlowCondensed_900Black_Italic });

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

  if (!ready || (!fontlarHazir && !fontHatasi)) {
    return (
      <View style={{ flex: 1, backgroundColor: RENKLER.bg, alignItems: 'center', justifyContent: 'center' }}>
        <StatusBar barStyle={RENKLER.durumCubugu} />
        <ActivityIndicator size="large" color={RENKLER.vurgu} />
        <Text style={{ color: RENKLER.metinIkincil, marginTop: 12 }}>FutChat yükleniyor...</Text>
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
        <StatusBar barStyle={RENKLER.durumCubugu} />
        <KurallarOnayEkrani />
      </>
    );
  }

  if (panelMode === 'admin' && user.isAdmin) {
    return (
      <>
        <StatusBar barStyle={RENKLER.durumCubugu} />
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
  const navTaban = RENKLER.mod === 'acik' ? DefaultTheme : DarkTheme;
  const navTemasi = { ...navTaban, colors: { ...navTaban.colors, background: RENKLER.bg, card: RENKLER.bg, text: RENKLER.metin, border: RENKLER.ayrici, primary: RENKLER.vurgu } };

  return (
    <ThemeProvider value={navTemasi}>
    <View style={{ flex: 1, backgroundColor: RENKLER.bg }}>
      <StatusBar barStyle={RENKLER.durumCubugu} />
      {/* Sekmelerin (Tabs) DIŞINDA, en üst seviyede TEK bir sabit katman —
          önceki tasarımda her ekranın kendi ScrollView'ından önce ayrı ayrı
          eklenmişti, ama gerçek cihazda içerikle birlikte kayıyordu
          (ekran görüntüsüyle doğrulandı: sayfa aşağı kaydırılınca köşe
          süsü de aşağı inip HIZLI ERİŞİM bölümünün üstünde kalıyordu).
          Burada, Tabs navigator'ının render ettiği hiçbir iç ScrollView'a
          hiç girmediği için artık kesinlikle sabit kalır. */}
      <NeonParilti />
      <HataSiniri>
      <Tabs
        style={{ flex: 1 }}
        tabBar={(props) => <AltSekmeCubugu {...props} rozet={okunmamis} />}
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: 'transparent' },
        }}
      >
        <Tabs.Screen name="index" options={{ href: null }} />
        <Tabs.Screen name="forum" />
        <Tabs.Screen name="content" />
        <Tabs.Screen name="bildirimler" />
        <Tabs.Screen name="profil" />
        <Tabs.Screen name="sbc" options={{ href: null }} />
        <Tabs.Screen name="evrimler" options={{ href: null }} />
        <Tabs.Screen name="oyuncular" options={{ href: null }} />
      </Tabs>
      </HataSiniri>
    </View>
    </ThemeProvider>
  );
}
