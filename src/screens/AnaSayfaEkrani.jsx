import { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, Pressable, Image, FlatList, Alert, Linking, StyleSheet } from 'react-native';
import NeonParilti from '../components/NeonParilti';
import OyuncuKarti from '../components/OyuncuKarti';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';
import { useRenkler } from '../constants/theme';
import { telegramHizmetLinki } from '../constants/contact';
import { usePaylasAkisi } from '../hooks/usePaylasAkisi';
import PaylasButonu from '../components/share/PaylasButonu';
import PaylasAkisiModal from '../components/share/PaylasAkisiModal';
import PaylasimKarti from '../components/share/PaylasimKarti';

const HIZLI_ERISIM = [
  { key: 'sbc', baslik: 'SBC', aciklama: 'Tüm görevler ve çözümler', emoji: '📋', route: '/sbc', hazir: true },
  { key: 'oyuncular', baslik: 'Oyuncular', aciklama: 'Oyuncu arama ve istatistikler', emoji: '⚽', route: '/oyuncular', hazir: true },
  { key: 'evrimler', baslik: 'Evrimler', aciklama: 'Evrim yolları ve gereksinimler', emoji: '🧬', route: '/evrimler', hazir: true },
  { key: 'trade', baslik: 'Trade', aciklama: 'Trader kartlar — detaylar VIP\'e özel', emoji: '📈', route: '/trade', hazir: true },
];

const SEKMELER = [
  { key: 'sbc', label: 'SBC', route: '/sbc', hazir: true },
  { key: 'oyuncular', label: 'Oyuncular', route: '/oyuncular', hazir: true },
  { key: 'trade', label: 'Trade', route: '/trade', hazir: true },
];

function yakindaUyar() {
  Alert.alert('Yakında', 'Bu özellik yakında eklenecek.');
}

export default function AnaSayfaEkrani() {
  const RENKLER = useRenkler();
  const styles = olusturStyles(RENKLER);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const [trendOyuncular, setTrendOyuncular] = useState([]);
  const [hizmetler, setHizmetler] = useState([]);
  // Everything first captured today (Europe/Istanbul) — fut.gg drops new
  // content at ~20:00, so this is empty most of the day and fills in after
  // that sync runs.
  const [yeniGelenler, setYeniGelenler] = useState({ sbcs: [], evolutions: [], players: [] });

  useEffect(() => {
    api.playerTrend(8).then((data) => {
      setTrendOyuncular(data.items || []);
    }).catch(() => {});
    api.services().then((data) => setHizmetler(data.items || [])).catch(() => {});
    api.contentNewToday().then(setYeniGelenler).catch(() => {});
  }, []);

  const avatarHarf = (user?.displayName || user?.email || 'T').charAt(0).toUpperCase();
  const yeniGelenlerVarMi = yeniGelenler.sbcs.length > 0 || yeniGelenler.evolutions.length > 0 || yeniGelenler.players.length > 0;
  const ozetRef = useRef(null);
  const paylasAkisi = usePaylasAkisi({
    ozet: { baslik: 'Günün Özeti', ref: ozetRef },
  });

  return (
    <View style={{ flex: 1, backgroundColor: RENKLER.bg }}>
      <NeonParilti />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: 40 }}>
      <View style={styles.ustSatir}>
        <Text style={styles.logo}>FutMod</Text>
        <View style={styles.ustIkonlar}>
          <Pressable onPress={yakindaUyar} hitSlop={8} style={styles.ikonButon}>
            <Text style={styles.ikon}>🔍</Text>
          </Pressable>
          <PaylasButonu onPress={paylasAkisi.ac} calisiyor={paylasAkisi.yukleniyor} />
          <Pressable onPress={yakindaUyar} hitSlop={8} style={styles.ikonButon}>
            <Text style={styles.ikon}>🔔</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/profil')} hitSlop={8} style={styles.avatar}>
            <Text style={styles.avatarMetin}>{avatarHarf}</Text>
          </Pressable>
        </View>
      </View>
      <PaylasAkisiModal akis={paylasAkisi} />

      {/* Görünmez, ekran dışı — sadece bir şablon seçildiğinde görsel olarak yakalanır. */}
      <View style={{ position: 'absolute', left: -9999, top: 0 }} collapsable={false}>
        <View ref={ozetRef} collapsable={false}>
          <PaylasimKarti baslik="Yeni Gelenler" vurguRenk={RENKLER.vurgu}>
            {!yeniGelenlerVarMi ? (
              <Text style={styles.paylasBosMetin}>Bugün henüz yeni içerik eklenmedi.</Text>
            ) : (
              <>
                {yeniGelenler.sbcs.length > 0 ? (
                  <PaylasYeniBolum baslik={`🛡️ Yeni SBC'ler (${yeniGelenler.sbcs.length})`} veriler={yeniGelenler.sbcs} baslikAl={(o) => o.title} gorselAl={(o) => o.imageUrl} RENKLER={RENKLER} />
                ) : null}
                {yeniGelenler.evolutions.length > 0 ? (
                  <PaylasYeniBolum baslik={`🧬 Yeni Evrimler (${yeniGelenler.evolutions.length})`} veriler={yeniGelenler.evolutions} baslikAl={(o) => o.title} gorselAl={(o) => o.imageUrl} RENKLER={RENKLER} />
                ) : null}
                {yeniGelenler.players.length > 0 ? (
                  <PaylasYeniBolum baslik={`⚽ Yeni Oyuncular (${yeniGelenler.players.length})`} veriler={yeniGelenler.players} baslikAl={(o) => `${o.name} · ${o.rating} OVR`} gorselAl={(o) => o.imageUrl} RENKLER={RENKLER} />
                ) : null}
              </>
            )}
          </PaylasimKarti>
        </View>
      </View>

      <View style={{ paddingHorizontal: 20, marginTop: 18 }}>
        <Text style={styles.hosgeldinUst}>Hoş geldin,</Text>
        <Text style={styles.hosgeldinBaslik}>{user?.displayName || 'Şampiyon'}!</Text>
        <View style={styles.altCizgiSatiri}>
          <View style={styles.altCizgi} />
          <Text style={styles.altCizgiMetin}>Türkiye'nin EAFC27 Ultimate Team merkezi</Text>
        </View>
      </View>

      <View style={styles.sekmeSatiri}>
        {SEKMELER.map((s, i) => (
          <Pressable
            key={s.key}
            onPress={() => (s.hazir ? router.push(s.route) : yakindaUyar())}
            style={[styles.sekme, i === 0 && styles.sekmeAktif, { flex: 1 }]}
          >
            <Text style={[styles.sekmeMetin, i === 0 && styles.sekmeMetinAktif]}>{s.label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={[styles.yeniKart, { marginHorizontal: 20, marginTop: 18 }]}>
        <View style={styles.ozetBaslikSatiri}>
          <View style={styles.yesilNokta} />
          <Text style={styles.ozetBaslik}>YENİ GELENLER</Text>
        </View>

        {!yeniGelenlerVarMi ? (
          <Text style={styles.yeniBos}>Bugün henüz yeni içerik eklenmedi — genelde 20:00'den sonra güncelleniyor, biraz sonra tekrar bak.</Text>
        ) : (
          <>
            {yeniGelenler.sbcs.length > 0 ? (
              <YeniBolum
                baslik={`🛡️ Yeni SBC'ler (${yeniGelenler.sbcs.length})`}
                veriler={yeniGelenler.sbcs}
                gorselAl={(o) => o.imageUrl}
                baslikAl={(o) => o.title}
                altAl={(o) => o.payload?.expires}
                onPress={(o) => router.push(`/sbc/${o.id}`)}
              />
            ) : null}
            {yeniGelenler.evolutions.length > 0 ? (
              <YeniBolum
                baslik={`🧬 Yeni Evrimler (${yeniGelenler.evolutions.length})`}
                veriler={yeniGelenler.evolutions}
                gorselAl={(o) => o.imageUrl}
                baslikAl={(o) => o.title}
                altAl={(o) => o.payload?.expiry}
                onPress={(o) => router.push(`/evrimler/${o.id}`)}
              />
            ) : null}
            {yeniGelenler.players.length > 0 ? (
              <YeniBolum
                baslik={`⚽ Yeni Oyuncular (${yeniGelenler.players.length})`}
                veriler={yeniGelenler.players}
                gorselAl={(o) => o.imageUrl}
                cerceveAl={(o) => o.cardFrameUrl}
                baslikAl={(o) => o.name}
                altAl={(o) => (o.rating ? `${o.rating} OVR` : null)}
                onPress={(o) => router.push(`/oyuncular/${o.futggId}`)}
              />
            ) : null}
          </>
        )}
      </View>

      <View style={{ marginTop: 24 }}>
        <View style={styles.bolumBaslikSatiri}>
          <Text style={styles.bolumBaslik}>HIZLI ERİŞİM</Text>
        </View>
        <View style={styles.gridKonteyner}>
          {HIZLI_ERISIM.map((k) => (
            <Pressable
              key={k.key}
              onPress={() => (k.hazir ? router.push(k.route) : yakindaUyar())}
              style={({ pressed }) => [styles.gridKart, pressed && { opacity: 0.85 }]}
            >
              {!k.hazir ? <Text style={styles.yakindaRozet}>YAKINDA</Text> : null}
              <Text style={styles.gridEmoji}>{k.emoji}</Text>
              <Text style={styles.gridBaslik}>{k.baslik}</Text>
              <Text style={styles.gridAciklama} numberOfLines={2}>{k.aciklama}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {trendOyuncular.length > 0 ? (
        <View style={{ marginTop: 24 }}>
          <View style={styles.bolumBaslikSatiri}>
            <Text style={styles.bolumBaslik}>TREND OYUNCULAR</Text>
            <Pressable onPress={() => router.push('/oyuncular')}>
              <Text style={styles.tumunuGor}>Tümünü Gör →</Text>
            </Pressable>
          </View>
          <FlatList
            data={trendOyuncular}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}
            keyExtractor={(item) => item.futggId}
            renderItem={({ item }) => (
              <Pressable onPress={() => router.push(`/oyuncular/${item.futggId}`)} style={styles.oyuncuKart}>
                <OyuncuKarti duzGorselUrl={item.cardImageUrl} yuzUrl={item.imageUrl} cerceveUrl={item.cardFrameUrl} genislik={70} />
                <Text style={styles.oyuncuIsim} numberOfLines={1}>{item.name}</Text>
                <View style={{ flexDirection: 'row', gap: 4 }}>
                  {item.position ? <Text style={styles.oyuncuPozisyon}>{item.position}</Text> : null}
                  <Text style={styles.oyuncuRating}>{item.rating} OVR</Text>
                </View>
                {item.priceCoins ? <Text style={styles.oyuncuFiyat}>{item.priceCoins.toLocaleString('tr-TR')} coin</Text> : null}
              </Pressable>
            )}
          />
        </View>
      ) : null}

      {hizmetler.length > 0 ? (
        <View style={{ marginTop: 24 }}>
          <View style={styles.bolumBaslikSatiri}>
            <Text style={styles.bolumBaslik}>DİĞER HİZMETLER</Text>
          </View>
          <View style={styles.gridKonteyner}>
            {hizmetler.map((h) => (
              <Pressable
                key={h.id}
                onPress={() => Linking.openURL(telegramHizmetLinki(h.title))}
                style={({ pressed }) => [styles.gridKart, pressed && { opacity: 0.85 }]}
              >
                <Text style={styles.gridEmoji}>{h.emoji}</Text>
                <Text style={styles.gridBaslik}>{h.title}</Text>
                {h.description ? <Text style={styles.gridAciklama} numberOfLines={2}>{h.description}</Text> : null}
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      <View style={{ paddingHorizontal: 20, marginTop: 24, gap: 12 }}>
        <View style={[styles.altKart, { flex: 1 }]}>
          <View style={styles.altKartBaslikSatiri}>
            <View style={styles.yesilNokta} />
            <Text style={styles.altKartBaslik}>SON HABERLER</Text>
            <Text style={styles.yakindaRozetInline}>YAKINDA</Text>
          </View>
          <Text style={styles.haberYer}>EA FC 27 haber akışı yakında burada olacak.</Text>
        </View>
      </View>
      </ScrollView>
    </View>
  );
}

/** Compact wrap-grid list for the "Yeni Gelenler" share card — no scrolling like the on-screen version, everything fits in one captured image. */
function PaylasYeniBolum({ baslik, veriler, baslikAl, gorselAl, RENKLER }) {
  const styles = olusturStyles(RENKLER);
  const GOSTERILECEK = 6;
  const gosterilenler = veriler.slice(0, GOSTERILECEK);
  const kalan = veriler.length - gosterilenler.length;
  return (
    <View style={{ marginTop: 16 }}>
      <Text style={styles.paylasYeniBolumBaslik}>{baslik}</Text>
      {gosterilenler.map((o, i) => {
        const gorsel = gorselAl ? gorselAl(o) : null;
        return (
          <View key={i} style={styles.paylasYeniSatirKutu}>
            {gorsel ? <Image source={{ uri: gorsel }} style={styles.paylasYeniGorsel} resizeMode="contain" /> : null}
            <Text style={styles.paylasYeniSatir} numberOfLines={1}>{baslikAl(o)}</Text>
          </View>
        );
      })}
      {kalan > 0 ? <Text style={styles.paylasYeniSatir}>+ {kalan} daha</Text> : null}
    </View>
  );
}

function YeniBolum({ baslik, veriler, gorselAl, cerceveAl, baslikAl, altAl, onPress }) {
  const RENKLER = useRenkler();
  const styles = olusturStyles(RENKLER);
  return (
    <View style={{ marginTop: 16 }}>
      <Text style={styles.yeniBolumBaslik}>{baslik}</Text>
      <FlatList
        data={veriler}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8 }}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <Pressable onPress={() => onPress(item)} style={styles.yeniOgeKart}>
            {cerceveAl && cerceveAl(item) ? (
              <OyuncuKarti yuzUrl={gorselAl(item)} cerceveUrl={cerceveAl(item)} genislik={60} />
            ) : gorselAl(item) ? (
              <Image source={{ uri: gorselAl(item) }} style={styles.yeniOgeGorsel} resizeMode="contain" />
            ) : null}
            <Text style={styles.yeniOgeBaslik} numberOfLines={1}>{baslikAl(item)}</Text>
            {altAl(item) ? <Text style={styles.yeniOgeAlt} numberOfLines={1}>{altAl(item)}</Text> : null}
          </Pressable>
        )}
      />
    </View>
  );
}

function olusturStyles(RENKLER) {
  return StyleSheet.create({
  neonParilti: { position: 'absolute', top: 0, left: 0, right: 0, height: 260 },
  ustSatir: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 },
  logo: { fontSize: 24, fontWeight: '900', fontStyle: 'italic', color: RENKLER.metin, letterSpacing: -0.5 },
  ustIkonlar: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  ikonButon: { padding: 4 },
  ikon: { fontSize: 20 },
  avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: RENKLER.vurgu, alignItems: 'center', justifyContent: 'center' },
  avatarMetin: { color: RENKLER.bg, fontWeight: '900', fontSize: 15 },
  hosgeldinUst: { fontSize: 14, color: RENKLER.metinIkincil },
  hosgeldinBaslik: { fontSize: 30, fontWeight: '900', color: RENKLER.metin, marginTop: 2 },
  altCizgiSatiri: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  altCizgi: { width: 18, height: 3, borderRadius: 2, backgroundColor: RENKLER.vurgu },
  altCizgiMetin: { fontSize: 12.5, color: RENKLER.metinIkincil },
  sekmeSatiri: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginTop: 20 },
  sekme: { paddingVertical: 12, borderRadius: 14, alignItems: 'center', backgroundColor: RENKLER.bg2, borderWidth: 1, borderColor: RENKLER.ayrici },
  sekmeAktif: { backgroundColor: `${RENKLER.vurgu}1a`, borderColor: RENKLER.vurgu },
  sekmeMetin: { fontSize: 13, fontWeight: '700', color: RENKLER.metinIkincil },
  sekmeMetinAktif: { color: RENKLER.vurgu },
  yeniKart: {
    backgroundColor: RENKLER.bg2, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: RENKLER.ayrici,
  },
  ozetBaslikSatiri: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  yesilNokta: { width: 6, height: 6, borderRadius: 3, backgroundColor: RENKLER.vurgu },
  ozetBaslik: { fontSize: 11, fontWeight: '800', color: RENKLER.metinIkincil, letterSpacing: 1 },
  yeniBos: { fontSize: 12.5, color: RENKLER.metinIkincil, marginTop: 14, lineHeight: 18 },
  yeniBolumBaslik: { fontSize: 12.5, fontWeight: '800', color: RENKLER.metin, marginBottom: 8 },
  yeniOgeKart: {
    width: 104, backgroundColor: RENKLER.bg, borderRadius: 12, padding: 10, borderWidth: 1, borderColor: RENKLER.ayrici, alignItems: 'center',
  },
  yeniOgeGorsel: { width: 60, height: 60 },
  yeniOgeBaslik: { fontSize: 11, fontWeight: '700', color: RENKLER.metin, marginTop: 4, maxWidth: 92, textAlign: 'center' },
  yeniOgeAlt: { fontSize: 9.5, color: RENKLER.metinUcuncul, marginTop: 2 },
  bolumBaslikSatiri: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 12 },
  bolumBaslik: { fontSize: 12.5, fontWeight: '800', color: RENKLER.metinIkincil, letterSpacing: 1 },
  tumunuGor: { fontSize: 12, fontWeight: '700', color: RENKLER.vurgu },
  gridKonteyner: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 10, rowGap: 10 },
  gridKart: {
    width: '47%', backgroundColor: RENKLER.bg2, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: RENKLER.ayrici,
    minHeight: 100,
  },
  gridEmoji: { fontSize: 22 },
  gridBaslik: { fontSize: 12.5, fontWeight: '800', color: RENKLER.metin, marginTop: 8 },
  gridAciklama: { fontSize: 10, color: RENKLER.metinUcuncul, marginTop: 3, lineHeight: 13 },
  yakindaRozet: {
    position: 'absolute', top: 8, right: 8, fontSize: 7.5, fontWeight: '800', color: RENKLER.bg,
    backgroundColor: RENKLER.uyari, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4,
  },
  yakindaRozetInline: {
    fontSize: 8.5, fontWeight: '800', color: RENKLER.bg, backgroundColor: RENKLER.uyari,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 'auto',
  },
  oyuncuKart: { width: 108, backgroundColor: RENKLER.bg2, borderRadius: 14, padding: 10, borderWidth: 1, borderColor: RENKLER.ayrici, alignItems: 'center' },
  oyuncuGorsel: { width: 70, height: 70 },
  oyuncuIsim: { fontSize: 12, fontWeight: '700', color: RENKLER.metin, marginTop: 4, maxWidth: 96 },
  oyuncuPozisyon: { fontSize: 9.5, fontWeight: '800', color: RENKLER.bg, backgroundColor: RENKLER.vurgu2, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 3, marginTop: 3 },
  oyuncuRating: { fontSize: 10, fontWeight: '700', color: RENKLER.metinIkincil, marginTop: 4 },
  oyuncuFiyat: { fontSize: 9.5, color: RENKLER.uyari, fontWeight: '700', marginTop: 3 },
  altKart: { backgroundColor: RENKLER.bg2, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: RENKLER.ayrici },
  altKartBaslikSatiri: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  altKartBaslik: { fontSize: 11, fontWeight: '800', color: RENKLER.metinIkincil, letterSpacing: 1 },
  haberYer: { fontSize: 12, color: RENKLER.metinUcuncul, marginTop: 10, fontStyle: 'italic' },
  paylasBosMetin: { fontSize: 12.5, color: RENKLER.metinIkincil, marginTop: 18, lineHeight: 18 },
  paylasYeniBolumBaslik: { fontSize: 13, fontWeight: '800', color: RENKLER.metin, marginBottom: 6 },
  paylasYeniSatirKutu: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 5 },
  paylasYeniGorsel: { width: 30, height: 30, borderRadius: 6, backgroundColor: RENKLER.bg3 },
  paylasYeniSatir: { flex: 1, fontSize: 11.5, color: RENKLER.metinIkincil, lineHeight: 16 },
  });
}
