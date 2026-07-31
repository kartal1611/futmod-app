import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Switch, Alert, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';
import { RENKLER, ORTAK_STIL } from '../constants/theme';

const KATEGORILER = [
  { key: 'trade', label: 'Trade Bildirimi', aciklama: 'Sadece VIP üyelere anlamlıdır' },
  { key: 'sbc', label: 'SBC Bildirimi', aciklama: 'fut.gg\'den yeni içerik geldiğinde haber ver' },
  { key: 'yayin', label: 'Yayın Bildirimi', aciklama: 'Canlı yayın duyuruları' },
  { key: 'haberler', label: 'Haberler Bildirimi', aciklama: 'Genel duyuru ve haberler' },
];

export default function ProfilEkrani() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuthStore();
  const [bildirimAcik, setBildirimAcik] = useState(false);
  const [islemde, setIslemde] = useState(false);
  const [tercihler, setTercihler] = useState(null);

  useEffect(() => {
    api.notificationPreferences().then((data) => setTercihler(data.preferences)).catch(() => {});
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
    <View style={[ORTAK_STIL.ekran, { padding: 16, paddingTop: insets.top + 16 }]}>
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
          <Text style={styles.aciklama}>Günde 2 kez çark çevirebilirsin</Text>
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

      <TouchableOpacity style={[styles.cikisButon, { marginTop: 24 }]} onPress={logout}>
        <Text style={styles.cikisMetin}>Çıkış Yap</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
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
});
