import { useCallback, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl, StyleSheet } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import KesikPanel from '../components/KesikPanel';
import MarkaLogo from '../components/MarkaLogo';
import IcerikIkon from '../components/IcerikIkon';
import NeonParilti from '../components/NeonParilti';
import OyuncuKarti from '../components/OyuncuKarti';
import { api } from '../services/api';
import { useRenkler, useOrtakStil, FONT } from '../constants/theme';
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
    <KesikPanel key={item.id} kesik={11} onPress={() => router.push(`${yol}/${item.id}`)} style={styles.satir}>
      <IcerikIkon kategori={kategori} boyut={44} />
      <View style={{ flex: 1 }}>
        <Text style={styles.satirTur}>{tur}</Text>
        <Text style={styles.satirBaslik} numberOfLines={1}>{item.title}</Text>
        {item.payload?.expires || item.payload?.expiry ? (
          <Text style={styles.satirAlt} numberOfLines={1}>🕒 {item.payload.expires || item.payload.expiry}</Text>
        ) : null}
      </View>
      <Text style={styles.ok}>›</Text>
    </KesikPanel>
  );

  const grupSatiri = (g, guncel) => (
    <KesikPanel key={g.key} kesik={11} vurgulu={guncel} parilti={guncel} onPress={() => router.push(`/content/${g.key}`)} style={styles.satir}>
      <View style={styles.grupIkon}>
        <Text style={styles.grupPuan}>{g.topRating}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.satirBaslik} numberOfLines={1}>{g.title}</Text>
        <Text style={styles.satirAlt} numberOfLines={1}>{g.subtitle} · {g.count} kart · {zamanFormatla(g.date)}</Text>
      </View>
      {guncel ? <View style={styles.guncel}><Text style={styles.guncelMetin}>GÜNCEL</Text></View> : null}
      <Text style={styles.ok}>›</Text>
    </KesikPanel>
  );

  return (
    <View style={ORTAK_STIL.ekran}>
      <NeonParilti />
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 10, paddingHorizontal: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={yenileniyor} onRefresh={yenile} tintColor={RENKLER.vurgu} />}
      >
        <MarkaLogo altMetin="Content" />

        <View style={styles.hero}>
          <Text style={styles.heroBaslik}>İÇERİK</Text>
          <Text style={[styles.heroBaslik, { color: RENKLER.vurgu }]}>MERKEZİ</Text>
          <View style={styles.heroCizgi} />
          <Text style={styles.heroAlt}>Tüm yeni içerikler, TOTW'ler ve promosyonlar tek yerde.</Text>
        </View>

        <View style={styles.sekmeler}>
          {SEKMELER.map((s) => (
            <Pressable key={s.key} onPress={() => setSekme(s.key)} style={[styles.sekme, sekme === s.key && { borderColor: RENKLER.vurgu, backgroundColor: RENKLER.vurgu }]}>
              <Text style={[styles.sekmeMetin, sekme === s.key && { color: RENKLER.vurguUstu }]}>{s.label.toLocaleUpperCase('tr-TR')}</Text>
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
                <Text style={styles.bolum}>YENİ KARTLAR</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {veri.newCards.map((k) => (
                    <Pressable key={k.futggId} onPress={() => router.push(`/oyuncular/${k.futggId}`)}>
                      <OyuncuKarti yuzUrl={k.imageUrl} isim={k.name} nadirlik={k.rarity} rating={k.rating} pozisyon={k.position} genislik={104} />
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
            <View style={styles.liste}>{veri.sbcs.map((s) => icerikSatiri(s, 'challenges', '/sbc', 'YENİ SBC'))}</View>
            <View style={styles.bolumSatir}>
              <Text style={styles.bolum}>EVRİM</Text>
              <Pressable onPress={() => router.push('/evrimler')} hitSlop={10}><Text style={styles.tumu}>Tümü ›</Text></Pressable>
            </View>
            <View style={styles.liste}>{veri.evolutions.map((e) => icerikSatiri(e, 'evo', '/evrimler', 'EVRİM'))}</View>
          </>
        ) : null}

        {veri && sekme === 'totw' ? (
          <>
            <Text style={styles.bolum}>HAFTANIN TAKIMLARI</Text>
            <View style={styles.liste}>{veri.totw.map((g, i) => grupSatiri(g, i === 0))}</View>
          </>
        ) : null}

        {veri && sekme === 'promo' ? (
          <>
            <Text style={styles.bolum}>PROMOSYONLAR</Text>
            <View style={styles.liste}>{veri.promos.map((g, i) => grupSatiri(g, i === 0))}</View>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

function olusturStyles(RENKLER) {
  return StyleSheet.create({
    hero: { marginTop: 18 },
    heroCizgi: { width: 46, height: 4, backgroundColor: RENKLER.vurgu, marginTop: 4, transform: [{ skewX: '-30deg' }] },
    heroBaslik: { fontFamily: FONT.dev, fontSize: 38, lineHeight: 38, color: RENKLER.metin, letterSpacing: 0.5 },
    heroAlt: { fontSize: 13, color: RENKLER.metinIkincil, marginTop: 10, lineHeight: 18 },
    sekmeler: { flexDirection: 'row', gap: 8, marginTop: 12 },
    sekme: { flex: 1, alignItems: 'center', gap: 2, paddingVertical: 9, borderRadius: 3, borderWidth: 1, borderColor: RENKLER.ayrici, backgroundColor: RENKLER.bg2, transform: [{ skewX: '-8deg' }] },
    sekmeMetin: { fontFamily: FONT.etiketItalik, fontSize: 14, letterSpacing: 0.8, color: RENKLER.metin, textAlign: 'center' },
    bolum: { fontFamily: FONT.etiket, fontSize: 15, letterSpacing: 1.6, color: RENKLER.metinIkincil, marginTop: 22, marginBottom: 10 },
    bolumSatir: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    tumu: { fontFamily: FONT.etiketItalik, fontSize: 14, letterSpacing: 0.8, color: RENKLER.vurgu, marginTop: 12 },
    liste: { gap: 8 },
    satir: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 66, padding: 11 },
    satirTur: { fontFamily: FONT.etiket, fontSize: 12, letterSpacing: 1, color: RENKLER.vurgu },
    satirBaslik: { fontFamily: FONT.baslik, fontSize: 19, color: RENKLER.metin },
    satirAlt: { fontSize: 12, color: RENKLER.metinIkincil, marginTop: 2 },
    ok: { fontSize: 24, color: RENKLER.metinIkincil },
    grupIkon: { width: 44, height: 44, borderRadius: 3, borderWidth: 1, borderColor: RENKLER.vurgu, alignItems: 'center', justifyContent: 'center', backgroundColor: RENKLER.bg3 },
    grupPuan: { fontFamily: FONT.dev, fontSize: 24, color: RENKLER.vurgu },
    guncel: { backgroundColor: RENKLER.vurgu, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 2, transform: [{ skewX: '-12deg' }] },
    guncelMetin: { fontFamily: FONT.etiketItalik, fontSize: 12, letterSpacing: 0.8, color: RENKLER.vurguUstu },
    kartFiyat: { fontSize: 11.5, fontWeight: '700', color: RENKLER.metinIkincil, textAlign: 'center', marginTop: 3 },
    bos: { color: RENKLER.metinIkincil, textAlign: 'center', marginTop: 32 },
  });
}
