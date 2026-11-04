import { useCallback, useRef, useState } from 'react';
import { View, Text, FlatList, Image, Pressable, ScrollView, ActivityIndicator, RefreshControl, Alert, StyleSheet } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore';
import { useModerationStore } from '../store/moderationStore';
import { icerikMenusuAc } from '../components/moderation/moderasyonYardimci';
import NeonParilti from '../components/NeonParilti';
import { api } from '../services/api';
import { useRenkler, useOrtakStil } from '../constants/theme';
import { FORUM_KATEGORILERI, kategoriAdi, tamGorselUrl, zamanFormatla } from '../constants/forum';

const SAYFA_BOYUTU = 30;
const SIRALAMALAR = [
  { key: 'hot', label: 'Sıcak' },
  { key: 'new', label: 'Yeni' },
];

export default function ForumEkrani() {
  const RENKLER = useRenkler();
  const ORTAK_STIL = useOrtakStil();
  const styles = olusturStyles(RENKLER);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuthStore();
  const blockedIds = useModerationStore((s) => s.blockedIds);
  const [kategori, setKategori] = useState(null);
  const [siralama, setSiralama] = useState('hot');
  const [basliklar, setBasliklar] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [yenileniyor, setYenileniyor] = useState(false);
  const [hata, setHata] = useState(null);
  const [dahaVar, setDahaVar] = useState(false);
  // Hızlı filtre değişiminde geç gelen eski yanıt yeni listenin üstüne yazmasın.
  const istekNo = useRef(0);

  const parametreler = useCallback((offset) => ({
    sort: siralama,
    limit: SAYFA_BOYUTU,
    offset,
    ...(kategori ? { category: kategori } : {}),
  }), [kategori, siralama]);

  const yukle = useCallback(async () => {
    const no = ++istekNo.current;
    try {
      const data = await api.forumThreads(parametreler(0));
      if (no !== istekNo.current) return;
      setBasliklar(data.items || []);
      setDahaVar((data.items || []).length === SAYFA_BOYUTU);
      setHata(null);
    } catch (err) {
      if (no === istekNo.current) setHata(err.message || 'Başlıklar yüklenemedi');
    }
  }, [parametreler]);

  // Yeni başlık açıp, oylayıp veya yorum yazıp dönünce liste güncel görünsün.
  useFocusEffect(useCallback(() => {
    yukle().finally(() => setYukleniyor(false));
  }, [yukle]));

  const yenile = async () => {
    setYenileniyor(true);
    await yukle();
    setYenileniyor(false);
  };

  const dahaYukle = async () => {
    if (!dahaVar) return;
    const no = istekNo.current;
    try {
      const data = await api.forumThreads(parametreler(basliklar.length));
      if (no !== istekNo.current) return;
      const yeniler = data.items || [];
      setBasliklar((prev) => [...prev, ...yeniler.filter((y) => !prev.some((p) => p.id === y.id))]);
      setDahaVar(yeniler.length === SAYFA_BOYUTU);
    } catch { /* sonraki kaydırmada tekrar denenir */ }
  };

  const oyla = async (baslik) => {
    try {
      const data = await api.forumVote(baslik.id);
      setBasliklar((prev) => prev.map((b) => (b.id === baslik.id ? data.item : b)));
    } catch (err) {
      Alert.alert('Hata', err.message || 'Oy verilemedi');
    }
  };

  const menuAc = (baslik) => {
    icerikMenusuAc({
      hedefUserId: baslik.userId,
      hedefAd: baslik.authorName,
      contentType: 'forum_thread',
      contentId: baslik.id,
      benimUserId: user?.id,
      afterBlock: () => setBasliklar((prev) => prev.filter((b) => b.userId !== baslik.userId)),
    });
  };

  const secenekDegistir = (ayarla) => {
    setYukleniyor(true);
    setBasliklar([]);
    ayarla();
  };

  const kategoriler = [{ key: null, label: 'Tümü' }, ...FORUM_KATEGORILERI];
  const gorunenler = basliklar.filter((b) => !blockedIds.includes(b.userId));

  return (
    <View style={ORTAK_STIL.ekran}>
      <NeonParilti />
      <View style={[styles.ustBar, { paddingTop: insets.top + 12 }]}>
        <View style={styles.baslikSatiri}>
          <Text style={styles.baslik}>Forum</Text>
          <View style={styles.siralamaKutu}>
            {SIRALAMALAR.map((s) => (
              <Pressable
                key={s.key}
                onPress={() => { if (s.key !== siralama) secenekDegistir(() => setSiralama(s.key)); }}
                style={[styles.siralamaButon, siralama === s.key && { backgroundColor: RENKLER.vurgu }]}
              >
                <Text style={[styles.siralamaMetin, siralama === s.key && { color: RENKLER.bg }]}>{s.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, flexShrink: 0 }} contentContainerStyle={styles.kategoriSatiri}>
          {kategoriler.map((k) => (
            <Pressable
              key={k.label}
              onPress={() => { if (k.key !== kategori) secenekDegistir(() => setKategori(k.key)); }}
              style={[styles.kategoriButon, kategori === k.key && { backgroundColor: RENKLER.vurgu, borderColor: RENKLER.vurgu }]}
            >
              <Text style={[styles.kategoriMetin, kategori === k.key && { color: RENKLER.bg }]}>{k.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {yukleniyor ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={RENKLER.vurgu} />
      ) : (
        <FlatList
          data={gorunenler}
          keyExtractor={(b) => String(b.id)}
          contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 96 }}
          refreshControl={<RefreshControl refreshing={yenileniyor} onRefresh={yenile} tintColor={RENKLER.vurgu} />}
          onEndReached={dahaYukle}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={<Text style={styles.bos}>{hata || 'Henüz başlık yok. İlk başlığı sen aç!'}</Text>}
          renderItem={({ item: b }) => (
            <View style={styles.kart}>
              <Pressable onPress={() => oyla(b)} hitSlop={6} style={styles.oySutunu} accessibilityRole="button" accessibilityLabel="Yukarı oyla">
                <Text style={[styles.oyOk, b.voted && { color: RENKLER.vurgu }]}>▲</Text>
                <Text style={[styles.oySayi, b.voted && { color: RENKLER.vurgu }]}>{b.voteCount}</Text>
              </Pressable>
              <Pressable onPress={() => router.push(`/forum/${b.id}`)} onLongPress={() => menuAc(b)} style={styles.kartIcerik}>
                <Text style={styles.kartKategori}>{kategoriAdi(b.category)}</Text>
                <Text style={styles.kartBaslik} numberOfLines={3}>{b.title}</Text>
                {b.imageUrl ? <Image source={{ uri: tamGorselUrl(b.imageUrl) }} style={styles.kartGorsel} resizeMode="cover" /> : null}
                <View style={styles.kartAltSatir}>
                  <Text style={[styles.kartYazar, b.isAdmin && { color: RENKLER.uyari }]} numberOfLines={1}>
                    {b.isAdmin ? '🛡️ ' : ''}{b.authorName} · {zamanFormatla(b.createdAt)}
                  </Text>
                  <Text style={styles.kartYorum}>💬 {b.commentCount}</Text>
                  {b.userId !== user?.id ? (
                    <Pressable onPress={() => menuAc(b)} hitSlop={10} accessibilityRole="button" accessibilityLabel="Şikayet et veya engelle">
                      <Text style={styles.kartMenu}>•••</Text>
                    </Pressable>
                  ) : null}
                </View>
              </Pressable>
            </View>
          )}
        />
      )}

      <Pressable
        onPress={() => router.push(kategori ? `/forum/yeni?kategori=${kategori}` : '/forum/yeni')}
        style={[styles.yeniButon, { backgroundColor: RENKLER.vurgu }]}
        accessibilityRole="button"
      >
        <Text style={[styles.yeniButonMetin, { color: RENKLER.bg }]}>+ Başlık Aç</Text>
      </Pressable>
    </View>
  );
}

function olusturStyles(RENKLER) {
  return StyleSheet.create({
    ustBar: { paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: RENKLER.ayrici },
    baslikSatiri: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
    baslik: { fontSize: 24, fontWeight: '900', color: RENKLER.metin },
    siralamaKutu: { flexDirection: 'row', backgroundColor: RENKLER.bg2, borderRadius: 12, borderWidth: 1, borderColor: RENKLER.ayrici, padding: 3 },
    siralamaButon: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 9 },
    siralamaMetin: { fontSize: 12.5, fontWeight: '700', color: RENKLER.metinIkincil },
    kategoriSatiri: { flexDirection: 'row', gap: 8, marginTop: 12, paddingHorizontal: 16 },
    kategoriButon: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: RENKLER.ayrici, backgroundColor: RENKLER.bg2 },
    kategoriMetin: { fontSize: 12.5, fontWeight: '700', color: RENKLER.metinIkincil },
    bos: { color: RENKLER.metinIkincil, textAlign: 'center', marginTop: 40 },
    kart: { flexDirection: 'row', backgroundColor: RENKLER.bg2, borderRadius: 14, borderWidth: 1, borderColor: RENKLER.ayrici, overflow: 'hidden' },
    oySutunu: { width: 48, alignItems: 'center', paddingTop: 14, backgroundColor: RENKLER.bg3 },
    oyOk: { fontSize: 15, color: RENKLER.metinIkincil },
    oySayi: { fontSize: 14, fontWeight: '800', color: RENKLER.metinIkincil, marginTop: 4 },
    kartIcerik: { flex: 1, padding: 12 },
    kartKategori: { fontSize: 11, fontWeight: '700', color: RENKLER.vurgu2 },
    kartBaslik: { fontSize: 15.5, fontWeight: '800', color: RENKLER.metin, marginTop: 4, lineHeight: 20 },
    kartGorsel: { width: '100%', height: 150, borderRadius: 10, marginTop: 10, backgroundColor: RENKLER.bg3 },
    kartAltSatir: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
    kartYazar: { flex: 1, fontSize: 11.5, color: RENKLER.metinIkincil },
    kartYorum: { fontSize: 12, fontWeight: '700', color: RENKLER.metinIkincil },
    kartMenu: { fontSize: 11, color: RENKLER.metinIkincil, letterSpacing: 1 },
    yeniButon: { position: 'absolute', right: 16, bottom: 16, borderRadius: 16, paddingHorizontal: 18, paddingVertical: 14 },
    yeniButonMetin: { fontWeight: '800', fontSize: 14 },
  });
}
