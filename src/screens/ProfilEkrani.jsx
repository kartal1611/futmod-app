import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Pressable, ScrollView, StyleSheet, Switch, Alert, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { api } from '../services/api';
import { useRenkler, useOrtakStil, TEMALAR } from '../constants/theme';

const KATEGORILER = [
  { key: 'trade', label: 'Trade Bildirimi', aciklama: 'Sadece VIP üyelere anlamlıdır' },
  { key: 'sbc', label: 'SBC Bildirimi', aciklama: 'Yeni içerik geldiğinde haber ver' },
  { key: 'yayin', label: 'Yayın Bildirimi', aciklama: 'Canlı yayın duyuruları' },
  { key: 'haberler', label: 'Haberler Bildirimi', aciklama: 'Genel duyuru ve haberler' },
];

export default function ProfilEkrani() {
  const RENKLER = useRenkler();
  const ORTAK_STIL = useOrtakStil();
  const styles = olusturStyles(RENKLER);
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuthStore();
  const { temaAdi, temaSec } = useThemeStore();
  const [bildirimAcik, setBildirimAcik] = useState(false);
  const [islemde, setIslemde] = useState(false);
  const [tercihler, setTercihler] = useState(null);

  useEffect(() => {
    api.notificationPreferences().then((data) => setTercihler(data.preferences)).catch(() => {});
    // The switch must reflect reality on every app open — if the OS already
    // granted permission (from a previous session), show it as ON instead
    // of resetting to a fresh, unrelated local default. Re-registering the
    // token here too keeps the backend copy fresh in case it ever rotates.
    Notifications.getPermissionsAsync().then(async ({ status }) => {
      if (status !== 'granted') return;
      setBildirimAcik(true);
      try {
        const tokenResp = await Notifications.getExpoPushTokenAsync();
        await api.registerPushToken(tokenResp.data, Platform.OS);
      } catch { /* best-effort refresh, ignore failures */ }
    });
  }, []);

  const bildirimAyarla = async (value) => {
    if (!value) { setBildirimAcik(false); return; }
    setIslemde(true);
    try {
      const { status: mevcut } = await Notifications.getPermissionsAsync();
      let status = mevcut;
      if (status !== 'granted') {
        const req = await Notifications.requestPermissionsAsync();
        status = req.status;
      }
      if (status !== 'granted') {
        Alert.alert('İzin gerekli', 'Bildirim gönderebilmemiz için izin vermelisin.');
        setIslemde(false);
        return;
      }
      const tokenResp = await Notifications.getExpoPushTokenAsync();
      await api.registerPushToken(tokenResp.data, Platform.OS);
      setBildirimAcik(true);
    } catch (err) {
      Alert.alert('Hata', err.message || 'Bildirim izni ayarlanamadı (fiziksel cihaz/Expo Go gerekebilir).');
    } finally {
      setIslemde(false);
    }
  };

  const kategoriDegistir = async (key, value) => {
    setTercihler((onceki) => ({ ...onceki, [key]: value }));
    try {
      await api.updateNotificationPreferences({ [key]: value });
    } catch {
      setTercihler((onceki) => ({ ...onceki, [key]: !value }));
    }
  };

  return (
    <View style={ORTAK_STIL.ekran}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingTop: insets.top + 16, paddingBottom: 40 }}>
      <Text style={styles.baslik}>Profil 👤</Text>

      <View style={[ORTAK_STIL.kart, { marginTop: 16 }]}>
        <Text style={styles.etiket}>E-posta</Text>
        <Text style={styles.deger}>{user?.email}</Text>
        {user?.displayName ? (
          <>
            <Text style={[styles.etiket, { marginTop: 12 }]}>İsim</Text>
            <Text style={styles.deger}>{user.displayName}</Text>
          </>
        ) : null}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
          {user?.isAdmin ? <Text style={styles.adminRozet}>Yönetici</Text> : null}
          {user?.isVip ? <Text style={styles.vipRozet}>⭐ VIP{user.vipUntil ? ` · ${new Date(user.vipUntil).toLocaleDateString('tr-TR')}'e kadar` : ' · Sınırsız'}</Text> : null}
        </View>
      </View>

      {user?.isVip ? (
        <View style={[ORTAK_STIL.kart, { marginTop: 16 }]}>
          <Text style={styles.bolumBaslik}>⭐ VIP Ayrıcalıkların</Text>
          <Text style={styles.aciklama}>Coin alımlarında otomatik %{user.vipDiscountPercent} indirim</Text>
        </View>
      ) : null}

      <View style={[ORTAK_STIL.kart, { marginTop: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.bolumBaslik}>Push Bildirimleri</Text>
          <Text style={styles.aciklama}>Bildirim almak için aç</Text>
        </View>
        <Switch value={bildirimAcik} onValueChange={bildirimAyarla} disabled={islemde} />
      </View>

      {tercihler ? (
        <View style={[ORTAK_STIL.kart, { marginTop: 16 }]}>
          <Text style={styles.bolumBaslik}>Bildirim Türleri</Text>
          {KATEGORILER.map((k) => (
            <View key={k.key} style={styles.kategoriSatiri}>
              <View style={{ flex: 1 }}>
                <Text style={styles.kategoriBaslik}>{k.label}</Text>
                <Text style={styles.aciklama}>{k.aciklama}</Text>
              </View>
              <Switch value={!!tercihler[k.key]} onValueChange={(v) => kategoriDegistir(k.key, v)} />
            </View>
          ))}
        </View>
      ) : null}

      <View style={[ORTAK_STIL.kart, { marginTop: 16 }]}>
        <Text style={styles.bolumBaslik}>🎨 Tema</Text>
        <Text style={styles.aciklama}>Uygulamanın vurgu rengini seç</Text>
        <View style={styles.temaSatiri}>
          {Object.entries(TEMALAR).map(([key, t]) => (
            <Pressable key={key} onPress={() => temaSec(key)} style={styles.temaSecenek}>
              <View style={[
                styles.temaDaire,
                { backgroundColor: t.ornekRenk },
                temaAdi === key && styles.temaDaireSecili,
              ]}>
                {temaAdi === key ? <Text style={styles.temaTik}>✓</Text> : null}
              </View>
              <Text style={[styles.temaAd, temaAdi === key && { color: RENKLER.metin, fontWeight: '800' }]}>{t.ad}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <TouchableOpacity style={[styles.cikisButon, { marginTop: 24 }]} onPress={logout}>
        <Text style={styles.cikisMetin}>Çıkış Yap</Text>
      </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function olusturStyles(RENKLER) {
  return StyleSheet.create({
  baslik: { fontSize: 24, fontWeight: '800', color: RENKLER.metin },
  bolumBaslik: { fontSize: 15, fontWeight: '700', color: RENKLER.metin },
  etiket: { fontSize: 12, color: RENKLER.metinUcuncul },
  deger: { fontSize: 16, color: RENKLER.metin, marginTop: 2, fontWeight: '600' },
  aciklama: { fontSize: 12, color: RENKLER.metinIkincil, marginTop: 2 },
  adminRozet: {
    alignSelf: 'flex-start', backgroundColor: RENKLER.vurgu,
    color: '#fff', fontWeight: '700', fontSize: 11, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
  },
  vipRozet: {
    alignSelf: 'flex-start', backgroundColor: RENKLER.vurgu2,
    color: RENKLER.bg, fontWeight: '800', fontSize: 11, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
  },
  kategoriSatiri: { flexDirection: 'row', alignItems: 'center', marginTop: 14 },
  kategoriBaslik: { fontSize: 13.5, fontWeight: '700', color: RENKLER.metin },
  cikisButon: { backgroundColor: RENKLER.hata, borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  cikisMetin: { color: '#fff', fontWeight: '700', fontSize: 16 },
  temaSatiri: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 14 },
  temaSecenek: { alignItems: 'center', gap: 6 },
  temaDaire: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent' },
  temaDaireSecili: { borderColor: RENKLER.metin },
  temaTik: { color: RENKLER.bg, fontWeight: '900', fontSize: 16 },
  temaAd: { fontSize: 11, color: RENKLER.metinIkincil, fontWeight: '600' },
  });
}
