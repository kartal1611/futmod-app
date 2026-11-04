import { useCallback, useState } from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator, RefreshControl, StyleSheet } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBildirimStore } from '../store/bildirimStore';
import NeonParilti from '../components/NeonParilti';
import { api } from '../services/api';
import { useRenkler, useOrtakStil } from '../constants/theme';
import { zamanFormatla } from '../constants/forum';

const TUR_METNI = {
  reply: ' yorumuna yanıt verdi: ',
  mention: ' senden bahsetti: ',
  thread: ' yeni başlık açtı: ',
  comment: ' yorum yaptı: ',
};

export default function ForumBildirimlerEkrani() {
  const RENKLER = useRenkler();
  const ORTAK_STIL = useOrtakStil();
  const styles = olusturStyles(RENKLER);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const ayarla = useBildirimStore((s) => s.ayarla);
  const okunmamis = useBildirimStore((s) => s.okunmamis);
  const [liste, setListe] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [yenileniyor, setYenileniyor] = useState(false);
  const [hata, setHata] = useState(null);

  const yukle = useCallback(async () => {
    try {
      const data = await api.forumNotifications();
      setListe(data.items || []);
      ayarla(data.unread);
      setHata(null);
    } catch (err) {
      setHata(err.message || 'Bildirimler yüklenemedi');
    } finally {
      setYukleniyor(false);
    }
  }, [ayarla]);

  useFocusEffect(useCallback(() => { yukle(); }, [yukle]));

  const yenile = async () => {
    setYenileniyor(true);
    await yukle();
    setYenileniyor(false);
  };

  const tumunuOku = async () => {
    try {
      const data = await api.forumMarkNotificationsRead();
      ayarla(data.unread);
      setListe((prev) => prev.map((b) => ({ ...b, read: true })));
    } catch { /* bir sonraki açılışta tekrar denenebilir */ }
  };

  return (
    <View style={ORTAK_STIL.ekran}>
      <NeonParilti />
      <View style={[styles.ustBar, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.baslik}>Bildirimler</Text>
        {okunmamis > 0 ? (
          <Pressable onPress={tumunuOku} hitSlop={8} style={styles.okuButon}>
            <Text style={[styles.okuMetin, { color: RENKLER.vurgu }]}>Tümünü okundu say</Text>
          </Pressable>
        ) : null}
      </View>
      {yukleniyor ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={RENKLER.vurgu} />
      ) : (
        <FlatList
          data={liste}
          keyExtractor={(b) => String(b.id)}
          contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: 32 }}
          refreshControl={<RefreshControl refreshing={yenileniyor} onRefresh={yenile} tintColor={RENKLER.vurgu} />}
          ListEmptyComponent={<Text style={styles.bos}>{hata || 'Henüz bildirim yok. Yanıtlar, bahsetmeler ve takip ettiklerin burada görünür.'}</Text>}
          renderItem={({ item: b }) => (
            <Pressable onPress={() => router.push(`/forum/${b.threadId}`)} style={[styles.kart, !b.read && { borderColor: RENKLER.vurgu }]}>
              <Text style={styles.metin} numberOfLines={2}>
                <Text style={styles.ad}>{b.actorName}</Text>
                {TUR_METNI[b.kind] || TUR_METNI.comment}
                <Text style={styles.ad}>{b.threadTitle}</Text>
              </Text>
              {b.commentBody ? <Text style={styles.yorum} numberOfLines={2}>{b.commentBody}</Text> : null}
              <Text style={styles.zaman}>{zamanFormatla(b.createdAt)}</Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

function olusturStyles(RENKLER) {
  return StyleSheet.create({
    ustBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: RENKLER.ayrici },
    baslik: { fontSize: 24, fontWeight: '900', color: RENKLER.metin },
    okuButon: { paddingVertical: 8 },
    okuMetin: { fontSize: 12.5, fontWeight: '700' },
    bos: { color: RENKLER.metinIkincil, textAlign: 'center', marginTop: 40, paddingHorizontal: 16 },
    kart: { backgroundColor: RENKLER.bg2, borderRadius: 12, borderWidth: 1, borderColor: RENKLER.ayrici, padding: 12 },
    metin: { fontSize: 13.5, color: RENKLER.metinIkincil, lineHeight: 19 },
    ad: { fontWeight: '800', color: RENKLER.metin },
    yorum: { fontSize: 13, color: RENKLER.metin, marginTop: 5, lineHeight: 18 },
    zaman: { fontSize: 11, color: RENKLER.metinUcuncul, marginTop: 6 },
  });
}
