import { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore';
import { useRenkler } from '../constants/theme';
import AdminVipSekmesi from '../components/admin/AdminVipSekmesi';
import AdminTradeSekmesi from '../components/admin/AdminTradeSekmesi';
import AdminBildirimSekmesi from '../components/admin/AdminBildirimSekmesi';
import AdminHizmetlerSekmesi from '../components/admin/AdminHizmetlerSekmesi';
import AdminOdemelerSekmesi from '../components/admin/AdminOdemelerSekmesi';

const SEKMELER = [
  { key: 'vip', baslik: 'VIP', emoji: '⭐' },
  { key: 'trade', baslik: 'Trade', emoji: '📈' },
  { key: 'hizmetler', baslik: 'Hizmetler', emoji: '🧰' },
  { key: 'odemeler', baslik: 'Ödemeler', emoji: '💳' },
  { key: 'bildirim', baslik: 'Bildirim', emoji: '🔔' },
];

export default function AdminPanelEkrani() {
  const RENKLER = useRenkler();
  const styles = olusturStyles(RENKLER);
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuthStore();
  const [aktifSekme, setAktifSekme] = useState('vip');

  return (
    <View style={{ flex: 1, backgroundColor: RENKLER.bg }}>
      <View style={[styles.ustBar, { paddingTop: insets.top + 12 }]}>
        <View>
          <Text style={styles.baslik}>🛠️ Yönetim Paneli</Text>
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
        {aktifSekme === 'vip' ? <AdminVipSekmesi /> : null}
        {aktifSekme === 'trade' ? <AdminTradeSekmesi /> : null}
        {aktifSekme === 'hizmetler' ? <AdminHizmetlerSekmesi /> : null}
        {aktifSekme === 'odemeler' ? <AdminOdemelerSekmesi /> : null}
        {aktifSekme === 'bildirim' ? <AdminBildirimSekmesi /> : null}
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
  baslik: { fontSize: 18, fontWeight: '800', color: RENKLER.metin },
  altBaslik: { fontSize: 11.5, color: RENKLER.metinUcuncul, marginTop: 2 },
  cikis: { color: RENKLER.hata, fontWeight: '700', fontSize: 13 },
  sekmeSatiri: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 12 },
  sekme: {
    alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12,
    backgroundColor: RENKLER.bg2, borderWidth: 1, borderColor: RENKLER.ayrici,
  },
  sekmeSecili: { backgroundColor: RENKLER.vurgu, borderColor: RENKLER.vurgu },
  sekmeEmoji: { fontSize: 18 },
  sekmeMetin: { fontSize: 11, fontWeight: '700', color: RENKLER.metinIkincil, marginTop: 2 },
  sekmeMetinSecili: { color: RENKLER.bg },
  });
}
