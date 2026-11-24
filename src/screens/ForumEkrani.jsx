import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, FlatList, Pressable, ScrollView, ActivityIndicator, RefreshControl, useWindowDimensions, StyleSheet } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useModerationStore } from '../store/moderationStore';
import { useBildirimStore } from '../store/bildirimStore';
import { useBaslikIslemleri } from '../hooks/useBaslikIslemleri';
import BaslikKarti from '../components/forum/BaslikKarti';
import MarkaLogo from '../components/MarkaLogo';
import OyuncuKarti from '../components/OyuncuKarti';
import NeonParilti from '../components/NeonParilti';
import { AraIkonu, BildirimIkonu } from '../components/nav/TabIkonlari';
import { api } from '../services/api';
import { useRenkler, useOrtakStil, FONT } from '../constants/theme';
import KesikPanel from '../components/KesikPanel';
import { FORUM_KATEGORILERI } from '../constants/forum';

const SAYFA_BOYUTU = 30;
const TAKIP = 'takip';
const GUNDEM_SAYISI = 3;
const TREND_SAYISI = 3;
// Gündem bandı haber siteleri gibi kendi kendine döner.
const GUNDEM_SURE_MS = 5000;
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
  const { width } = useWindowDimensions();
  const blockedIds = useModerationStore((s) => s.blockedIds);
  const okunmamis = useBildirimStore((s) => s.okunmamis);
  const [kategori, setKategori] = useState(null);
  const [siralama, setSiralama] = useState('hot');
  const [basliklar, setBasliklar] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [yenileniyor, setYenileniyor] = useState(false);
  const [hata, setHata] = useState(null);
  const [dahaVar, setDahaVar] = useState(false);
  const [gundemSayfa, setGundemSayfa] = useState(0);
  const [guncelTotw, setGuncelTotw] = useState(null);
  const gundemRef = useRef(null);
  const sayfaRef = useRef(0);
  const kaydiriliyor = useRef(false);
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

  useFocusEffect(useCallback(() => {
    api.contentCenter().then((data) => setGuncelTotw(data.totw?.[0] ?? null)).catch(() => {});
  }, []));

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

  const kategoriler = [{ key: null, label: 'Tümü', emoji: '🏠' }, { key: TAKIP, label: 'Takip', emoji: '⭐' }, ...FORUM_KATEGORILERI];
  const gorunenler = basliklar.filter((b) => !blockedIds.includes(b.userId));
  // Gündem ve trend yalnız ana akışta anlamlı, filtre seçilince araya girmesin.
  const anaAkis = !kategori && siralama === 'hot';
  const gundem = anaAkis ? gorunenler.slice(0, GUNDEM_SAYISI) : [];
  const trend = anaAkis
    ? [...gorunenler].filter((b) => b.commentCount > 0).sort((a, b) => b.commentCount - a.commentCount).slice(0, TREND_SAYISI)
    : [];
  const gundemGenislik = width - 32;
  const slaytlar = [
    ...gundem.map((b) => ({ anahtar: `b-${b.id}`, baslik: b })),
    ...(anaAkis && guncelTotw ? [{ anahtar: guncelTotw.key, totw: guncelTotw }] : []),
  ];
  const slaytSayisi = slaytlar.length;

  const sayfaGit = (i) => {
    sayfaRef.current = i;
    setGundemSayfa(i);
    gundemRef.current?.scrollTo({ x: i * gundemGenislik, animated: true });
  };

  useEffect(() => {
    if (slaytSayisi < 2) return undefined;
    const zamanlayici = setInterval(() => {
      if (!kaydiriliyor.current) sayfaGit((sayfaRef.current + 1) % slaytSayisi);
    }, GUNDEM_SURE_MS);
    return () => clearInterval(zamanlayici);
  }, [slaytSayisi, gundemGenislik]);

  return (
    <View style={ORTAK_STIL.ekran}>
      <NeonParilti />
      <View style={[styles.ustBar, { paddingTop: insets.top + 10 }]}>
        <View style={styles.logoSatiri}>
          <MarkaLogo />
          <View style={styles.ikonlar}>
            <Pressable onPress={() => router.push('/forum/ara')} style={styles.ikonButon} accessibilityRole="button" accessibilityLabel="Ara">
              <AraIkonu renk={RENKLER.metin} boyut={25} />
            </Pressable>
            <Pressable onPress={() => router.push('/bildirimler')} style={styles.ikonButon} accessibilityRole="button" accessibilityLabel="Bildirimler">
              <BildirimIkonu renk={RENKLER.metin} boyut={25} />
              {okunmamis > 0 ? <View style={styles.nokta} /> : null}
            </Pressable>
          </View>
        </View>
        <View style={styles.siralamaSatiri}>
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
              style={[styles.kategoriButon, kategori === k.key && { borderColor: RENKLER.vurgu }]}
            >
              <Text style={[styles.kategoriMetin, kategori === k.key && { color: RENKLER.vurgu }]}>{k.emoji} {k.label}</Text>
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
          contentContainerStyle={{ padding: 16, paddingTop: 12, gap: 10, paddingBottom: 96 }}
          refreshControl={<RefreshControl refreshing={yenileniyor} onRefresh={yenile} tintColor={RENKLER.vurgu} />}
          onEndReached={dahaYukle}
          onEndReachedThreshold={0.4}
          ListHeaderComponent={slaytSayisi > 0 ? (
            <View style={{ gap: 12, marginBottom: 2 }}>
              <View>
                <Text style={styles.heroBeyaz}>TOPLULUK</Text>
                <Text style={styles.heroAltin}>GÜNDEMİ</Text>
                <View style={styles.heroCizgi} />
              </View>
              <ScrollView
                ref={gundemRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScrollBeginDrag={() => { kaydiriliyor.current = true; }}
                onMomentumScrollEnd={(e) => {
                  kaydiriliyor.current = false;
                  sayfaRef.current = Math.round(e.nativeEvent.contentOffset.x / gundemGenislik);
                  setGundemSayfa(sayfaRef.current);
                }}
              >
                {slaytlar.map((sl) => (
                  <Pressable
                    key={sl.anahtar}
                    onPress={() => router.push(sl.totw ? `/content/${sl.totw.key}` : `/forum/${sl.baslik.id}`)}
                    style={{ width: gundemGenislik }}
                  >
                    <KesikPanel kesik={18} vurgulu parilti style={styles.gundem}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.gundemUst}>{sl.totw ? 'HAFTANIN TAKIMI' : 'TOPLULUK GÜNDEMİ'}</Text>
                        <Text style={styles.gundemBaslik} numberOfLines={3}>{sl.totw ? sl.totw.title : sl.baslik.title}</Text>
                        <View style={styles.gundemButon}>
                          <Text style={styles.gundemButonMetin}>{sl.totw ? 'KADROYU GÖR ›' : 'TARTIŞMAYA KATIL ›'}</Text>
                        </View>
                      </View>
                      {sl.baslik?.players[0] ? (
                        <OyuncuKarti yuzUrl={sl.baslik.players[0].imageUrl} isim={sl.baslik.players[0].name} nadirlik={sl.baslik.players[0].rarity} rating={sl.baslik.players[0].rating} pozisyon={sl.baslik.players[0].position} genislik={92} />
                      ) : null}
                      {sl.totw ? <Text style={styles.gundemPuan}>{sl.totw.topRating}</Text> : null}
                    </KesikPanel>
                  </Pressable>
                ))}
              </ScrollView>
              {slaytSayisi > 1 ? (
                <View style={styles.noktalar}>
                  {slaytlar.map((sl, i) => (
                    <Pressable
                      key={sl.anahtar}
                      onPress={() => sayfaGit(i)}
                      style={[styles.sayfaNo, i === gundemSayfa && { backgroundColor: RENKLER.vurgu, borderColor: RENKLER.vurgu }]}
                      accessibilityRole="button"
                      accessibilityLabel={`${i + 1}. sayfa`}
                    >
                      <Text style={[styles.sayfaNoMetin, i === gundemSayfa && { color: RENKLER.bg }]}>{i + 1}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
              {trend.length > 0 ? (
                <View>
                  <Text style={styles.trendBaslik}>TREND KONULAR</Text>
                  <KesikPanel style={styles.trendKutu}>
                    {trend.map((b, i) => (
                      <Pressable key={b.id} onPress={() => router.push(`/forum/${b.id}`)} style={[styles.trendSatir, i > 0 && styles.trendAyrac]}>
                        <Text style={styles.trendNo}>{String(i + 1).padStart(2, '0')}</Text>
                        <Text style={styles.trendMetin} numberOfLines={1}>{b.title}</Text>
                        <Text style={styles.trendSayi}>{b.commentCount} YORUM</Text>
                      </Pressable>
                    ))}
                  </KesikPanel>
                </View>
              ) : null}
            </View>
          ) : null}
          ListEmptyComponent={<Text style={styles.bos}>{hata || (kategori === TAKIP ? 'Takip ettiğin başlıklar ve kişilerin başlıkları burada görünür.' : 'Henüz başlık yok. İlk başlığı sen aç!')}</Text>}
          renderItem={({ item }) => <BaslikKarti baslik={item} islemler={islemler} />}
        />
      )}

      <Pressable
        onPress={() => router.push(kategori && kategori !== TAKIP ? `/forum/yeni?kategori=${kategori}` : '/forum/yeni')}
        style={[styles.yeniButon, { backgroundColor: RENKLER.vurgu }]}
        accessibilityRole="button"
        accessibilityLabel="Başlık aç"
      >
        <Text style={[styles.yeniButonMetin, { color: RENKLER.bg }]}>+</Text>
      </Pressable>
    </View>
  );
}

function olusturStyles(RENKLER) {
  return StyleSheet.create({
    ustBar: { paddingBottom: 10 },
    logoSatiri: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14 },
    ikonlar: { flexDirection: 'row' },
    ikonButon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    nokta: { position: 'absolute', top: 8, right: 8, width: 9, height: 9, borderRadius: 5, backgroundColor: RENKLER.vurgu },
    siralamaSatiri: { alignItems: 'flex-end', paddingHorizontal: 16, marginTop: 4 },
    siralamaKutu: { flexDirection: 'row', backgroundColor: RENKLER.bg2, borderRadius: 10, borderWidth: 1, borderColor: RENKLER.ayrici, padding: 3 },
    siralamaButon: { paddingHorizontal: 15, paddingVertical: 7, borderRadius: 8 },
    siralamaMetin: { fontSize: 13, fontWeight: '700', color: RENKLER.metinIkincil },
    kategoriSatiri: { flexDirection: 'row', gap: 8, marginTop: 10, paddingHorizontal: 16 },
    kategoriButon: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 3, borderWidth: 1, borderColor: RENKLER.ayrici, backgroundColor: RENKLER.bg2, transform: [{ skewX: '-8deg' }] },
    kategoriMetin: { fontSize: 12.5, fontWeight: '700', color: RENKLER.metin },
    heroBeyaz: { fontFamily: FONT.dev, fontSize: 34, lineHeight: 34, color: RENKLER.metin, letterSpacing: 0.5 },
    heroAltin: { fontFamily: FONT.dev, fontSize: 34, lineHeight: 36, color: RENKLER.vurgu, letterSpacing: 0.5 },
    heroCizgi: { width: 46, height: 4, backgroundColor: RENKLER.vurgu, marginTop: 4, transform: [{ skewX: '-30deg' }] },
    gundem: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 150, padding: 16 },
    gundemUst: { fontFamily: FONT.etiket, fontSize: 13, letterSpacing: 1.5, color: RENKLER.vurgu },
    gundemBaslik: { fontFamily: FONT.baslik, fontSize: 25, color: RENKLER.metin, marginTop: 4, lineHeight: 27 },
    gundemButon: { alignSelf: 'flex-start', backgroundColor: RENKLER.vurgu, borderRadius: 2, paddingHorizontal: 14, paddingVertical: 8, marginTop: 12, transform: [{ skewX: '-12deg' }] },
    gundemButonMetin: { fontFamily: FONT.etiketItalik, fontSize: 14, letterSpacing: 1, color: RENKLER.bg },
    noktalar: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
    sayfaNo: { minWidth: 30, height: 28, borderRadius: 2, borderWidth: 1, borderColor: RENKLER.ayrici, backgroundColor: RENKLER.bg2, alignItems: 'center', justifyContent: 'center', transform: [{ skewX: '-12deg' }] },
    sayfaNoMetin: { fontFamily: FONT.etiketItalik, fontSize: 14, color: RENKLER.metinIkincil },
    gundemPuan: { fontFamily: FONT.dev, fontSize: 58, color: RENKLER.vurgu },
    trendBaslik: { fontFamily: FONT.etiket, fontSize: 14, letterSpacing: 1.5, color: RENKLER.metinIkincil, marginBottom: 8 },
    trendKutu: { paddingHorizontal: 12 },
    trendNo: { fontFamily: FONT.dev, fontSize: 20, color: RENKLER.vurgu, width: 26 },
    trendSatir: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 },
    trendAyrac: { borderTopWidth: 1, borderTopColor: RENKLER.ayrici },
    trendMetin: { flex: 1, fontSize: 13.5, fontWeight: '600', color: RENKLER.metin },
    trendSayi: { fontFamily: FONT.etiket, fontSize: 13, color: RENKLER.basari },
    bos: { color: RENKLER.metinIkincil, textAlign: 'center', marginTop: 40 },
    yeniButon: { position: 'absolute', right: 18, bottom: 18, width: 58, height: 54, borderRadius: 4, alignItems: 'center', justifyContent: 'center', transform: [{ skewX: '-10deg' }] },
    yeniButonMetin: { fontWeight: '500', fontSize: 34, lineHeight: 38 },
  });
}
