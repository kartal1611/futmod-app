import { useCallback, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl, StyleSheet } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import FutModLogo from '../components/FutModLogo';
import IcerikIkon from '../components/IcerikIkon';
import NeonParilti from '../components/NeonParilti';
import OyuncuKarti from '../components/OyuncuKarti';
import { api } from '../services/api';
import { useRenkler, useOrtakStil } from '../constants/theme';
import { zamanFormatla } from '../constants/forum';

const SEKMELER = [
  { key: 'bugun', label: 'Bugün Gelenler', emoji: '📅' },
  { key: 'totw', label: 'TOTW', emoji: '🏆' },
  { key: 'promo', label: 'Promolar', emoji: '⭐' },
];

export default function ContentEkrani() {
  const RENKLER = useRenkler();
  const ORTAK_STIL = useOrtakStil();
  const styles = olusturStyles(RENKLER);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [sekme, setSekme] = useState('bugun');
  const [veri, setVeri] = useState(null);
  const [yenileniyor, setYenileniyor] = useState(false);
  const [hata, setHata] = useState(null);

  const yukle = useCallback(async () => {
    try {
      setVeri(await api.contentCenter());
      setHata(null);
    } catch (err) {
      setHata(err.message || 'İçerik yüklenemedi');
    }
  }, []);

  useFocusEffect(useCallback(() => { yukle(); }, [yukle]));

  const yenile = async () => {
    setYenileniyor(true);
    await yukle();
    setYenileniyor(false);
  };

  const icerikSatiri = (item, kategori, yol, tur) => (
    <Pressable key={item.id} onPress={() => router.push(`${yol}/${item.id}`)} style={styles.satir}>
      <IcerikIkon kategori={kategori} boyut={44} />
      <View style={{ flex: 1 }}>
        <Text style={styles.satirTur}>{tur}</Text>
        <Text style={styles.satirBaslik} numberOfLines={1}>{item.title}</Text>
        {item.payload?.expires || item.payload?.expiry ? (
          <Text style={styles.satirAlt} numberOfLines={1}>🕒 {item.payload.expires || item.payload.expiry}</Text>
        ) : null}
      </View>
      <Text style={styles.ok}>›</Text>
    </Pressable>
  );

  const grupSatiri = (g, guncel) => (
    <Pressable key={g.key} onPress={() => router.push(`/content/${g.key}`)} style={[styles.satir, guncel && { borderColor: RENKLER.vurgu }]}>
      <View style={styles.grupIkon}>
        <Text style={styles.grupPuan}>{g.topRating}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.satirBaslik} numberOfLines={1}>{g.title}</Text>
        <Text style={styles.satirAlt} numberOfLines={1}>{g.subtitle} · {g.count} kart · {zamanFormatla(g.date)}</Text>
      </View>
      {guncel ? <Text style={styles.guncel}>GÜNCEL</Text> : null}
      <Text style={styles.ok}>›</Text>
    </Pressable>
  );

  return (
    <View style={ORTAK_STIL.ekran}>
      <NeonParilti />
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 10, paddingHorizontal: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={yenileniyor} onRefresh={yenile} tintColor={RENKLER.vurgu} />}
      >
        <FutModLogo altMetin="Content" />

        <LinearGradient colors={['#17171c', '#2d230e', '#8a6a08']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <Text style={styles.heroBaslik}>FC27</Text>
          <Text style={[styles.heroBaslik, { color: RENKLER.vurgu }]}>Content Center</Text>
          <Text style={styles.heroAlt}>Tüm yeni içerikler, TOTW'ler ve promosyonlar tek yerde.</Text>
        </LinearGradient>

        <View style={styles.sekmeler}>
          {SEKMELER.map((s) => (
            <Pressable key={s.key} onPress={() => setSekme(s.key)} style={[styles.sekme, sekme === s.key && { borderColor: RENKLER.vurgu }]}>
              <Text style={styles.sekmeEmoji}>{s.emoji}</Text>
              <Text style={[styles.sekmeMetin, sekme === s.key && { color: RENKLER.vurgu }]}>{s.label}</Text>
            </Pressable>
          ))}
        </View>

        {!veri ? (
          hata ? <Text style={styles.bos}>{hata}</Text> : <ActivityIndicator style={{ marginTop: 32 }} color={RENKLER.vurgu} />
        ) : null}

        {veri && sekme === 'bugun' ? (
          <>
            {veri.newCards?.length ? (
              <>
                <Text style={styles.bolum}>Yeni Kartlar</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {veri.newCards.map((k) => (
                    <Pressable key={k.futggId} onPress={() => router.push(`/oyuncular/${k.futggId}`)}>
                      <OyuncuKarti duzGorselUrl={k.flatCardUrl} yuzUrl={k.imageUrl} cerceveUrl={k.cardFrameUrl} rating={k.rating} pozisyon={k.position} genislik={104} />
                      {k.priceCoins ? <Text style={styles.kartFiyat}>{k.priceCoins.toLocaleString('tr-TR')}</Text> : null}
                    </Pressable>
                  ))}
                </ScrollView>
              </>
            ) : null}
            <View style={styles.bolumSatir}>
              <Text style={styles.bolum}>SBC</Text>
              <Pressable onPress={() => router.push('/sbc')} hitSlop={10}><Text style={styles.tumu}>Tümü ›</Text></Pressable>
            </View>
            <View style={styles.liste}>{veri.sbcs.map((s) => icerikSatiri(s, 'challenges', '/sbc', 'Yeni SBC'))}</View>
            <View style={styles.bolumSatir}>
              <Text style={styles.bolum}>Evrim</Text>
              <Pressable onPress={() => router.push('/evrimler')} hitSlop={10}><Text style={styles.tumu}>Tümü ›</Text></Pressable>
            </View>
            <View style={styles.liste}>{veri.evolutions.map((e) => icerikSatiri(e, 'evo', '/evrimler', 'Evrim'))}</View>
          </>
        ) : null}

        {veri && sekme === 'totw' ? (
          <>
            <Text style={styles.bolum}>Haftanın Takımları</Text>
            <View style={styles.liste}>{veri.totw.map((g, i) => grupSatiri(g, i === 0))}</View>
          </>
        ) : null}

        {veri && sekme === 'promo' ? (
          <>
            <Text style={styles.bolum}>Promosyonlar</Text>
            <View style={styles.liste}>{veri.promos.map((g, i) => grupSatiri(g, i === 0))}</View>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

function olusturStyles(RENKLER) {
  return StyleSheet.create({
    hero: { borderRadius: 16, borderWidth: 1, borderColor: RENKLER.ayrici, padding: 18, marginTop: 14 },
    heroBaslik: { fontSize: 25, fontWeight: '900', fontStyle: 'italic', color: RENKLER.metin, lineHeight: 30 },
    heroAlt: { fontSize: 13, color: RENKLER.metin, marginTop: 8, lineHeight: 18, maxWidth: '85%' },
    sekmeler: { flexDirection: 'row', gap: 8, marginTop: 12 },
    sekme: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 11, borderRadius: 12, borderWidth: 1, borderColor: RENKLER.ayrici, backgroundColor: RENKLER.bg2 },
    sekmeEmoji: { fontSize: 18 },
    sekmeMetin: { fontSize: 12, fontWeight: '700', color: RENKLER.metin, textAlign: 'center' },
    bolum: { fontSize: 18, fontWeight: '900', color: RENKLER.metin, marginTop: 20, marginBottom: 10 },
    bolumSatir: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    tumu: { fontSize: 13, fontWeight: '700', color: RENKLER.metinIkincil, marginTop: 10 },
    liste: { gap: 8 },
    satir: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 66, padding: 11, borderRadius: 13, borderWidth: 1, borderColor: RENKLER.ayrici, backgroundColor: RENKLER.bg2 },
    satirTur: { fontSize: 11, color: RENKLER.metinIkincil },
    satirBaslik: { fontSize: 15.5, fontWeight: '800', color: RENKLER.metin },
    satirAlt: { fontSize: 12, color: RENKLER.metinIkincil, marginTop: 2 },
    ok: { fontSize: 24, color: RENKLER.metinIkincil },
    grupIkon: { width: 44, height: 44, borderRadius: 11, borderWidth: 1, borderColor: RENKLER.vurgu, alignItems: 'center', justifyContent: 'center', backgroundColor: RENKLER.bg3 },
    grupPuan: { fontSize: 17, fontWeight: '900', color: RENKLER.vurgu },
    guncel: { fontSize: 9.5, fontWeight: '900', color: RENKLER.bg, backgroundColor: RENKLER.vurgu, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, overflow: 'hidden' },
    kartFiyat: { fontSize: 11.5, fontWeight: '700', color: RENKLER.metinIkincil, textAlign: 'center', marginTop: 3 },
    bos: { color: RENKLER.metinIkincil, textAlign: 'center', marginTop: 32 },
  });
}
