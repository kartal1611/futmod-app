import { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore';
import { useRenkler, FONT } from '../constants/theme';
import NeonParilti from '../components/NeonParilti';
import AdminBildirimSekmesi from '../components/admin/AdminBildirimSekmesi';
import AdminGenelSekmesi from '../components/admin/AdminGenelSekmesi';
import AdminForumSekmesi from '../components/admin/AdminForumSekmesi';
import AdminIcerikSekmesi from '../components/admin/AdminIcerikSekmesi';
import AdminKartlarSekmesi from '../components/admin/AdminKartlarSekmesi';
import AdminKullanicilarSekmesi from '../components/admin/AdminKullanicilarSekmesi';
import AdminSikayetlerSekmesi from '../components/admin/AdminSikayetlerSekmesi';

const SEKMELER = [
  { key: 'genel', baslik: 'Genel', emoji: '📊' },
  { key: 'forum', baslik: 'Forum', emoji: '💬' },
  { key: 'icerik', baslik: 'SBC / Evrim', emoji: '🧩' },
  { key: 'kartlar', baslik: 'Kartlar', emoji: '🃏' },
  { key: 'kullanicilar', baslik: 'Kullanıcılar', emoji: '👥' },
  { key: 'sikayetler', baslik: 'Şikayetler', emoji: '🚩' },
  { key: 'bildirim', baslik: 'Duyuru', emoji: '🔔' },
];

export default function AdminPanelEkrani() {
  const RENKLER = useRenkler();
  const styles = olusturStyles(RENKLER);
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuthStore();
  const [aktifSekme, setAktifSekme] = useState('genel');

  return (
    <View style={{ flex: 1, backgroundColor: RENKLER.bg }}>
      <NeonParilti />
      <View style={[styles.ustBar, { paddingTop: insets.top + 12 }]}>
        <View>
          <Text style={styles.baslik}>YÖNETİM <Text style={{ color: RENKLER.vurgu }}>PANELİ</Text></Text>
          <Text style={styles.altBaslik}>{user?.email}</Text>
        </View>
        <Pressable onPress={logout}>
          <Text style={styles.cikis}>Çıkış</Text>
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, flexShrink: 0 }} contentContainerStyle={styles.sekmeSatiri}>
        {SEKMELER.map((s) => (
          <Pressable key={s.key} onPress={() => setAktifSekme(s.key)} style={[styles.sekme, aktifSekme === s.key && styles.sekmeSecili]}>
            <Text style={styles.sekmeEmoji}>{s.emoji}</Text>
            <Text style={[styles.sekmeMetin, aktifSekme === s.key && styles.sekmeMetinSecili]}>{s.baslik}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={{ flex: 1 }}>
        {aktifSekme === 'genel' ? <AdminGenelSekmesi /> : null}
        {aktifSekme === 'forum' ? <AdminForumSekmesi /> : null}
        {aktifSekme === 'icerik' ? <AdminIcerikSekmesi /> : null}
        {aktifSekme === 'kartlar' ? <AdminKartlarSekmesi /> : null}
        {aktifSekme === 'bildirim' ? <AdminBildirimSekmesi /> : null}
        {aktifSekme === 'sikayetler' ? <AdminSikayetlerSekmesi /> : null}
        {aktifSekme === 'kullanicilar' ? <AdminKullanicilarSekmesi /> : null}
      </View>
    </View>
  );
}

function olusturStyles(RENKLER) {
  return StyleSheet.create({
  ustBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 12,
  },
  baslik: { fontFamily: FONT.dev, fontSize: 28, color: RENKLER.metin },
  altBaslik: { fontSize: 11.5, color: RENKLER.metinUcuncul, marginTop: 2 },
  cikis: { color: RENKLER.hata, fontWeight: '700', fontSize: 13 },
  sekmeSatiri: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 12 },
  sekme: {
    alignItems: 'center', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 3,
    backgroundColor: RENKLER.bg2, borderWidth: 1, borderColor: RENKLER.ayrici,
  },
  sekmeSecili: { backgroundColor: RENKLER.vurgu, borderColor: RENKLER.vurgu },
  sekmeEmoji: { fontSize: 18 },
  sekmeMetin: { fontSize: 11, fontWeight: '700', color: RENKLER.metinIkincil, marginTop: 2 },
  sekmeMetinSecili: { color: RENKLER.vurguUstu },
  });
}
