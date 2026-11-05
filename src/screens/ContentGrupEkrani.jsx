import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Rect, Circle, Line } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import NeonParilti from '../components/NeonParilti';
import OyuncuKarti from '../components/OyuncuKarti';
import { api } from '../services/api';
import { useRenkler, useOrtakStil } from '../constants/theme';
import { zamanFormatla } from '../constants/forum';

const ONE_CIKAN = 3;

/** One TOTW or promo title: its best cards, the pitch for a TOTW, and every card on demand. */
export default function ContentGrupEkrani() {
  const RENKLER = useRenkler();
  const ORTAK_STIL = useOrtakStil();
  const styles = olusturStyles(RENKLER);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { key } = useLocalSearchParams();
  const [grup, setGrup] = useState(null);
  const [hata, setHata] = useState(null);
  const [tumuAcik, setTumuAcik] = useState(false);

  useEffect(() => {
    api.contentGroup(key).then((data) => setGrup(data.group)).catch((err) => setHata(err.message || 'İçerik yüklenemedi'));
  }, [key]);

  const kart = (p, genislik) => (
    <Pressable key={p.futggId} onPress={() => router.push(`/oyuncular/${p.futggId}`)} accessibilityRole="button" accessibilityLabel={p.name}>
      <OyuncuKarti duzGorselUrl={p.flatCardUrl} yuzUrl={p.imageUrl} cerceveUrl={p.cardFrameUrl} rating={p.rating} pozisyon={p.position} genislik={genislik} />
    </Pressable>
  );

  const ilk11 = grup?.rows?.flat() ?? [];
  const tumKartlar = grup?.kind === 'totw' ? [...ilk11, ...grup.bench] : grup?.cards ?? [];
  const oneCikanlar = [...tumKartlar].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)).slice(0, ONE_CIKAN);
  // En yüksek kart ortada ve büyük dursun.
  const vitrin = oneCikanlar.length === ONE_CIKAN ? [oneCikanlar[1], oneCikanlar[0], oneCikanlar[2]] : oneCikanlar;

  return (
    <View style={ORTAK_STIL.ekran}>
      <NeonParilti />
      <View style={[styles.ustBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.geriButon} accessibilityRole="button" accessibilityLabel="Geri">
          <Text style={styles.geriMetin}>‹</Text>
        </Pressable>
        <Text style={styles.ustBaslik} numberOfLines={1}>{grup?.title || ''}</Text>
        <View style={styles.geriButon} />
      </View>

      {!grup ? (
        hata ? <Text style={styles.bos}>{hata}</Text> : <ActivityIndicator style={{ marginTop: 40 }} color={RENKLER.vurgu} />
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
          <LinearGradient colors={['#1d1708', RENKLER.bg]} style={styles.vitrin}>
            <Text style={styles.baslik}>{grup.title}</Text>
            <Text style={styles.altBaslik}>{grup.subtitle}</Text>
            <View style={styles.vitrinKartlar}>
              {vitrin.map((p, i) => kart(p, vitrin.length === ONE_CIKAN && i === 1 ? 138 : 104))}
            </View>
          </LinearGradient>

          {grup.kind === 'totw' ? (
            <View style={styles.saha}>
              <Svg style={StyleSheet.absoluteFill} viewBox="0 0 100 130" preserveAspectRatio="none">
                <Rect x="3" y="2" width="94" height="126" stroke="#ffffff55" strokeWidth="0.5" fill="none" />
                <Line x1="3" y1="65" x2="97" y2="65" stroke="#ffffff55" strokeWidth="0.5" />
                <Circle cx="50" cy="65" r="11" stroke="#ffffff55" strokeWidth="0.5" fill="none" />
                <Rect x="27" y="2" width="46" height="17" stroke="#ffffff55" strokeWidth="0.5" fill="none" />
                <Rect x="27" y="111" width="46" height="17" stroke="#ffffff55" strokeWidth="0.5" fill="none" />
              </Svg>
              {grup.rows.map((satir, i) => (
                <View key={i} style={styles.sahaSatir}>{satir.map((p) => kart(p, 76))}</View>
              ))}
            </View>
          ) : (
            <View style={styles.detay}>
              <Text style={styles.bolum}>Promo Detayları</Text>
              <View style={styles.detaySatir}>
                <Text style={styles.detayAd}>Son eklenen</Text>
                <Text style={styles.detayDeger}>{zamanFormatla(grup.date)}</Text>
              </View>
              <View style={styles.detaySatir}>
                <Text style={styles.detayAd}>Kart sayısı</Text>
                <Text style={styles.detayDeger}>{grup.count}</Text>
              </View>
            </View>
          )}

          <Pressable onPress={() => setTumuAcik((v) => !v)} style={styles.tumuButon}>
            <Text style={styles.tumuMetin}>{tumuAcik ? 'Kartları Gizle' : `Tüm Kartları Gör (${tumKartlar.length})`}</Text>
          </Pressable>
          {tumuAcik ? <View style={styles.izgara}>{tumKartlar.map((p) => kart(p, 104))}</View> : null}

          <Pressable
            onPress={() => router.push(`/forum/yeni?kategori=sbc-evo&baslikMetni=${encodeURIComponent(`${grup.title} hakkında ne düşünüyorsunuz?`)}`)}
            style={styles.tartisButon}
          >
            <Text style={styles.tartisMetin}>💬 Forumda Tartış</Text>
          </Pressable>
        </ScrollView>
      )}
    </View>
  );
}

function olusturStyles(RENKLER) {
  return StyleSheet.create({
    ustBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingBottom: 8 },
    geriButon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    geriMetin: { fontSize: 32, lineHeight: 34, color: RENKLER.metin },
    ustBaslik: { flex: 1, fontSize: 17, fontWeight: '800', color: RENKLER.metin, textAlign: 'center' },
    bos: { color: RENKLER.metinIkincil, textAlign: 'center', marginTop: 40 },
    vitrin: { alignItems: 'center', paddingVertical: 14 },
    baslik: { fontSize: 34, fontWeight: '900', fontStyle: 'italic', color: RENKLER.vurgu, textAlign: 'center', paddingHorizontal: 16 },
    altBaslik: { fontSize: 14, color: RENKLER.metin, marginTop: 2 },
    vitrinKartlar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 14 },
    saha: { marginHorizontal: 12, marginTop: 8, paddingVertical: 14, gap: 8, borderRadius: 14, overflow: 'hidden', backgroundColor: '#0f5a25' },
    sahaSatir: { flexDirection: 'row', justifyContent: 'space-evenly' },
    detay: { marginHorizontal: 16, marginTop: 12 },
    bolum: { fontSize: 17, fontWeight: '900', color: RENKLER.metin, marginBottom: 8 },
    detaySatir: { flexDirection: 'row', justifyContent: 'space-between', minHeight: 42, alignItems: 'center', paddingHorizontal: 12, borderWidth: 1, borderColor: RENKLER.ayrici, backgroundColor: RENKLER.bg2 },
    detayAd: { fontSize: 13.5, color: RENKLER.metinIkincil },
    detayDeger: { fontSize: 13.5, fontWeight: '700', color: RENKLER.metin },
    tumuButon: { marginHorizontal: 16, marginTop: 14, minHeight: 48, borderRadius: 24, borderWidth: 1.5, borderColor: RENKLER.vurgu, alignItems: 'center', justifyContent: 'center' },
    tumuMetin: { fontSize: 14.5, fontWeight: '800', color: RENKLER.metin },
    izgara: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 14, paddingHorizontal: 12 },
    tartisButon: { marginHorizontal: 16, marginTop: 12, minHeight: 50, borderRadius: 14, backgroundColor: RENKLER.vurgu, alignItems: 'center', justifyContent: 'center' },
    tartisMetin: { fontSize: 15, fontWeight: '800', color: RENKLER.bg },
  });
}
