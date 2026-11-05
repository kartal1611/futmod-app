import { useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Path } from 'react-native-svg';

// FutMod'un kendi kartı: köşeleri kesik altıgen plaka ve çift kenarlık. Apple
// 5.2.1 reddi EA'in kalkan şablonuna benzeyen kartlar içindi; bu yüzden
// geometri ve kart görseli bize ait, oyundan yalnızca veri ve yüz gelir.
const KART_ORAN = 100 / 140;
const PLAKA = 'M12 2H88L98 12V124L86 138H14L2 124V12Z';
const IC_KENAR = 'M14 6H86L94 14V122L84 134H16L6 122V14Z';

const STAT_SIRASI = [
  ['pace', 'HIZ'], ['shooting', 'ŞUT'], ['passing', 'PAS'],
  ['dribbling', 'ÇEV'], ['defending', 'DEF'], ['physicality', 'FİZ'],
];

const ALTIN = { ust: '#3a2c0a', alt: '#120e04', kenar: '#FFC61A', isik: '#FFE28A', metin: '#FFE9A8' };
const SIYAH_ALTIN = { ust: '#1d1d22', alt: '#070708', kenar: '#E8B923', isik: '#FFD65C', metin: '#FFD65C' };
const GUMUS = { ust: '#4a4f57', alt: '#191b1f', kenar: '#C9CFD8', isik: '#F1F4F8', metin: '#EEF1F5' };
const BRONZ = { ust: '#4f2f18', alt: '#1b0f07', kenar: '#CD8A52', isik: '#F0B98A', metin: '#F5D2B5' };

// Promo adındaki anahtar kelime kartın rengini belirler.
const NADIRLIK_PALETLERI = [
  { kelime: 'team of the week', palet: SIYAH_ALTIN },
  { kelime: 'scream', palet: { ust: '#3c1660', alt: '#12061f', kenar: '#FF8A2A', isik: '#C77DFF', metin: '#F3E2FF' } },
  { kelime: 'champions', palet: { ust: '#5c1218', alt: '#1c0507', kenar: '#FF5A5F', isik: '#FFB3B5', metin: '#FFE3E3' } },
  { kelime: 'future stars', palet: { ust: '#123f57', alt: '#051722', kenar: '#3FD2FF', isik: '#A5ECFF', metin: '#DFF8FF' } },
  { kelime: 'rttk', palet: { ust: '#14275f', alt: '#060c22', kenar: '#5C8DFF', isik: '#B3CAFF', metin: '#E3ECFF' } },
  { kelime: 'icon', palet: { ust: '#5a4c30', alt: '#1e1a10', kenar: '#F4E7C5', isik: '#FFF8E4', metin: '#FFF5DC' } },
  { kelime: 'hero', palet: { ust: '#3e1a52', alt: '#14081c', kenar: '#E0B0FF', isik: '#F2DCFF', metin: '#F6E9FF' } },
  { kelime: 'potm', palet: { ust: '#0f4a33', alt: '#051a12', kenar: '#3EE39E', isik: '#AFF7D8', metin: '#DFFBEF' } },
];

function paletSec(nadirlik, rating) {
  const ad = String(nadirlik || '').toLowerCase();
  const eslesme = NADIRLIK_PALETLERI.find((n) => ad.includes(n.kelime));
  if (eslesme) return eslesme.palet;
  if (rating != null && rating < 65) return BRONZ;
  if (rating != null && rating < 75) return GUMUS;
  return ALTIN;
}

/** Soyadı karta sığsın diye uzun adlarda yalnız son kelime yazılır. */
function kartAdi(isim) {
  const ad = String(isim || '');
  return ad.length > 13 ? ad.split(' ').pop() : ad;
}

export default function OyuncuKarti({
  yuzUrl, rating, pozisyon, attrs, isim, nadirlik, nationIconUrl, leagueIconUrl, weakFoot, skillMoves, genislik, style,
}) {
  const [yuzHata, setYuzHata] = useState(false);
  const palet = paletSec(nadirlik, rating);
  const o = genislik / 100;
  const statGoster = genislik >= 100 && !!attrs;

  return (
    <View style={[{ width: genislik, aspectRatio: KART_ORAN }, style]}>
      <Svg style={StyleSheet.absoluteFill} viewBox="0 0 100 140">
        <Defs>
          <LinearGradient id="zemin" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={palet.ust} />
            <Stop offset="1" stopColor={palet.alt} />
          </LinearGradient>
          <LinearGradient id="kenar" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={palet.isik} />
            <Stop offset="0.5" stopColor={palet.kenar} />
            <Stop offset="1" stopColor={palet.isik} />
          </LinearGradient>
        </Defs>
        <Path d={PLAKA} fill="url(#zemin)" stroke="url(#kenar)" strokeWidth={2.4} />
        <Path d="M66 6L94 6V34Z" fill={palet.kenar} opacity={0.3} />
        <Path d="M6 92L52 6H72L6 118Z" fill={palet.isik} opacity={0.08} />
        <Path d={IC_KENAR} fill="none" stroke={palet.kenar} strokeWidth={0.6} opacity={0.65} />
      </Svg>

      {yuzUrl && !yuzHata ? (
        <Image
          source={{ uri: yuzUrl }}
          onError={() => setYuzHata(true)}
          resizeMode="contain"
          style={{ position: 'absolute', top: '11%', left: '19%', width: '74%', height: statGoster ? '48%' : '56%' }}
        />
      ) : (
        <Text style={{ position: 'absolute', top: '26%', alignSelf: 'center', fontSize: 34 * o }}>⚽</Text>
      )}

      <View style={{ position: 'absolute', top: '8%', left: '10%', alignItems: 'center' }}>
        {rating != null ? <Text style={{ color: palet.metin, fontSize: 21 * o, lineHeight: 23 * o, fontWeight: '900' }}>{rating}</Text> : null}
        {pozisyon ? <Text style={{ color: palet.metin, fontSize: 9.5 * o, lineHeight: 11 * o, fontWeight: '800' }}>{pozisyon}</Text> : null}
      </View>

      {skillMoves || weakFoot ? (
        <Text style={{ position: 'absolute', top: '8%', right: '9%', color: palet.metin, fontSize: 6.5 * o, fontWeight: '700' }}>
          {skillMoves ? `${skillMoves}★` : ''}{weakFoot ? ` ${weakFoot}★` : ''}
        </Text>
      ) : null}

      <View style={{ position: 'absolute', left: '7%', right: '7%', top: statGoster ? '59%' : '68%', alignItems: 'center' }}>
        {isim ? (
          <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} style={{ color: '#fff', fontSize: 10.5 * o, fontWeight: '900' }}>
            {kartAdi(isim)}
          </Text>
        ) : null}
        <View style={{ width: '70%', height: Math.max(1, 0.8 * o), backgroundColor: palet.kenar, marginTop: 2 * o, opacity: 0.8 }} />
      </View>

      {statGoster ? (
        <View style={{ position: 'absolute', left: '11%', right: '11%', top: '69%', flexDirection: 'row', flexWrap: 'wrap' }}>
          {STAT_SIRASI.map(([anahtar, kisa]) => (
            <View key={anahtar} style={{ width: '33.33%', alignItems: 'center', marginTop: 1.5 * o }}>
              <Text style={{ color: palet.metin, fontSize: 5.5 * o, fontWeight: '700' }}>{kisa}</Text>
              <Text style={{ color: '#fff', fontSize: 8.5 * o, fontWeight: '900' }}>{attrs[anahtar]?.value ?? '-'}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {nationIconUrl || leagueIconUrl ? (
        <View style={{ position: 'absolute', bottom: '4.5%', alignSelf: 'center', flexDirection: 'row', gap: 4 * o }}>
          {nationIconUrl ? <Image source={{ uri: nationIconUrl }} style={{ width: 10 * o, height: 7 * o }} resizeMode="contain" /> : null}
          {leagueIconUrl ? <Image source={{ uri: leagueIconUrl }} style={{ width: 7 * o, height: 7 * o }} resizeMode="contain" /> : null}
        </View>
      ) : null}
    </View>
  );
}
