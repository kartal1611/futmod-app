import { useCallback, useRef, useState } from 'react';
import { View, Text, FlatList, Pressable, ScrollView, ActivityIndicator, RefreshControl, StyleSheet } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useModerationStore } from '../store/moderationStore';
import { useBaslikIslemleri } from '../hooks/useBaslikIslemleri';
import BaslikKarti from '../components/forum/BaslikKarti';
import NeonParilti from '../components/NeonParilti';
import { api } from '../services/api';
import { useRenkler, useOrtakStil } from '../constants/theme';
import { FORUM_KATEGORILERI } from '../constants/forum';

const SAYFA_BOYUTU = 30;
const TAKIP = 'takip';
const SIRALAMALAR = [
  { key: 'hot', label: 'Sıcak' },
  { key: 'new', label: 'Yeni' },
  { key: 'top', label: 'En İyi' },
];

export default function ForumEkrani() {
  const RENKLER = useRenkler();
  const ORTAK_STIL = useOrtakStil();
  const styles = olusturStyles(RENKLER);
  const insets = useSafeAreaInsets();
  const router = useRouter();
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
  const islemler = useBaslikIslemleri(setBasliklar);

  const parametreler = useCallback((offset) => ({
    sort: siralama,
    limit: SAYFA_BOYUTU,
    offset,
    ...(kategori === TAKIP ? { followed: 1 } : kategori ? { category: kategori } : {}),
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
    } finally {
      if (no === istekNo.current) setYukleniyor(false);
    }
  }, [parametreler]);

  // Yeni başlık açıp, oylayıp veya yorum yazıp dönünce liste güncel görünsün.
  useFocusEffect(useCallback(() => { yukle(); }, [yukle]));

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

  const secenekDegistir = (ayarla) => {
    setYukleniyor(true);
    setBasliklar([]);
    ayarla();
  };

  const kategoriler = [{ key: null, label: 'Tümü' }, { key: TAKIP, label: 'Takip' }, ...FORUM_KATEGORILERI];
  const gorunenler = basliklar.filter((b) => !blockedIds.includes(b.userId));

  return (
    <View style={ORTAK_STIL.ekran}>
      <NeonParilti />
      <View style={[styles.ustBar, { paddingTop: insets.top + 12 }]}>
        <View style={styles.baslikSatiri}>
          <Text style={styles.baslik}>FutMod</Text>
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
          ListEmptyComponent={<Text style={styles.bos}>{hata || (kategori === TAKIP ? 'Takip ettiğin kişilerin başlıkları burada görünür.' : 'Henüz başlık yok. İlk başlığı sen aç!')}</Text>}
          renderItem={({ item }) => <BaslikKarti baslik={item} islemler={islemler} />}
        />
      )}

      <Pressable
        onPress={() => router.push(kategori && kategori !== TAKIP ? `/forum/yeni?kategori=${kategori}` : '/forum/yeni')}
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
    baslikSatiri: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingHorizontal: 16 },
    baslik: { fontSize: 24, fontWeight: '900', color: RENKLER.metin },
    siralamaKutu: { flexDirection: 'row', backgroundColor: RENKLER.bg2, borderRadius: 12, borderWidth: 1, borderColor: RENKLER.ayrici, padding: 3 },
    siralamaButon: { paddingHorizontal: 11, paddingVertical: 8, borderRadius: 9 },
    siralamaMetin: { fontSize: 12.5, fontWeight: '700', color: RENKLER.metinIkincil },
    kategoriSatiri: { flexDirection: 'row', gap: 8, marginTop: 12, paddingHorizontal: 16 },
    kategoriButon: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: RENKLER.ayrici, backgroundColor: RENKLER.bg2 },
    kategoriMetin: { fontSize: 12.5, fontWeight: '700', color: RENKLER.metinIkincil },
    bos: { color: RENKLER.metinIkincil, textAlign: 'center', marginTop: 40 },
    yeniButon: { position: 'absolute', right: 16, bottom: 16, borderRadius: 16, paddingHorizontal: 18, paddingVertical: 14 },
    yeniButonMetin: { fontWeight: '800', fontSize: 14 },
  });
}
