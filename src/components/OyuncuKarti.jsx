import { View, Text, StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, RadialGradient, Stop, Path, Circle } from 'react-native-svg';

// FutChat'in kendi kartı: köşeleri kesik altıgen plaka, çift kenarlık ve
// stilize oyuncu silüeti. Hiçbir üçüncü taraf görseli (yüz, bayrak, lig/kulüp
// logosu) kullanılmaz; karttaki her şey burada çizilir, dışarıdan yalnız metin
// veri (isim, reyting, pozisyon, statlar) gelir.
const KART_ORAN = 100 / 140;
const PLAKA = 'M12 2H88L98 12V124L86 138H14L2 124V12Z';
const IC_KENAR = 'M14 6H86L94 14V122L84 134H16L6 122V14Z';

// Baş, boyun ve omuzlardan oluşan sade oyuncu silüeti (viewBox 100x140).
const SILUET = 'M57 22C64.5 22 69 28 69 36C69 43 65.5 49 61 51.5V55L76 60C83 62.5 87 67 88 74V82H26V74C27 67 31 62.5 38 60L53 55V51.5C48.5 49 45 43 45 36C45 28 49.5 22 57 22Z';

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
/** "Kylian Mbappé" → "KM": silüetin göğsündeki monogram. */
function basHarfler(isim) {
  const p = String(isim || '').trim().split(/\s+/).filter(Boolean);
  if (!p.length) return '';
  const h = p.length === 1 ? p[0].slice(0, 2) : p[0][0] + p[p.length - 1][0];
  return h.toLocaleUpperCase('tr-TR');
}

/** Ülke/lig adından kısa etiket: "Brazil" → "BRA". */
function kisaKod(ad) {
  return String(ad || '').replace(/[^\p{L}]/gu, '').slice(0, 3).toLocaleUpperCase('tr-TR');
}

function kartAdi(isim) {
  const ad = String(isim || '');
  return ad.length > 13 ? ad.split(' ').pop() : ad;
}

export default function OyuncuKarti({
  rating, pozisyon, attrs, isim, nadirlik, ulke, weakFoot, skillMoves, genislik, style,
}) {
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
          <RadialGradient id="hale" cx="0.5" cy="0.4" r="0.5">
            <Stop offset="0" stopColor={palet.isik} stopOpacity={0.35} />
            <Stop offset="1" stopColor={palet.isik} stopOpacity={0} />
          </RadialGradient>
          <LinearGradient id="silu" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={palet.isik} stopOpacity={0.75} />
            <Stop offset="1" stopColor={palet.kenar} stopOpacity={0.15} />
          </LinearGradient>
        </Defs>
        <Path d={PLAKA} fill="url(#zemin)" stroke="url(#kenar)" strokeWidth={2.4} />
        <Path d="M66 6L94 6V34Z" fill={palet.kenar} opacity={0.3} />
        <Path d="M6 92L52 6H72L6 118Z" fill={palet.isik} opacity={0.08} />
        <Path d={IC_KENAR} fill="none" stroke={palet.kenar} strokeWidth={0.6} opacity={0.65} />
        <Circle cx={57} cy={statGoster ? 40 : 46} r={30} fill="url(#hale)" />
        <Path transform={statGoster ? 'translate(0,-6)' : undefined} d={SILUET} fill="url(#silu)" />
      </Svg>

      <Text style={{ position: 'absolute', top: statGoster ? '40%' : '47%', left: '26%', right: '14%', textAlign: 'center', color: palet.alt, opacity: 0.85, fontSize: 9 * o, fontWeight: '900', letterSpacing: 0.5 * o }}>
        {basHarfler(isim)}
      </Text>

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

      {ulke && !statGoster ? (
        <Text style={{ position: 'absolute', bottom: '6.5%', alignSelf: 'center', color: palet.metin, opacity: 0.8, fontSize: 6 * o, fontWeight: '800', letterSpacing: 1 * o }}>
          {kisaKod(ulke)}
        </Text>
      ) : null}
    </View>
  );
}
