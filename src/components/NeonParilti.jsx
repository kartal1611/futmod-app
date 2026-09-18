import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';

// FutMod'un yeşil-beyaz-siyah marka kimliği. Kullanıcı, aynı ekranın
// üzerine güçlü bir yeşil filtre bindirilmiş bir referans görseli
// paylaştı ("2. görseldeki gibi olacak") — o görselde arkaplan sadece
// köşelerde değil, TÜM sayfada belirgin, doygun bir yeşil ton taşıyor.
// Önceki versiyon (köşelerden başlayıp ortada neredeyse sıfırlanan iki
// gradyan) hâlâ çok soluktu; burada tüm viewport'u kaplayan SABİT,
// yüksek-opaklıklı bir taban katman + üstte/altta biraz daha da
// yoğunlaşan iki gradyan var, böylece hiçbir nokta "düz siyah" kalmıyor.
const YESIL = '#39FF6E';
const KOYU_YESIL = '#0d8a4a';
const KOSE_BOYUT = 220;

function KoseCizgiler({ renk, ayna }) {
  return (
    <Svg width={KOSE_BOYUT} height={KOSE_BOYUT} viewBox="0 0 220 220" style={ayna ? { transform: [{ scaleX: -1 }, { scaleY: -1 }] } : undefined}>
      <Path d="M-10,50 L50,50 L78,78 L138,78 L165,105" stroke={renk} strokeWidth={16} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={0.4} />
      <Path d="M-10,50 L50,50 L78,78 L138,78 L165,105" stroke="#f3fff5" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={0.95} />
      <Path d="M-10,110 L22,110 L38,126 L38,175" stroke={renk} strokeWidth={13} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={0.35} />
      <Path d="M-10,110 L22,110 L38,126 L38,175" stroke="#f3fff5" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={0.85} />
      <Circle cx={165} cy={105} r={7} fill={renk} opacity={1} />
      <Circle cx={38} cy={175} r={5} fill={renk} opacity={0.85} />
      <Circle cx={138} cy={78} r={4} fill={renk} opacity={0.7} />
    </Svg>
  );
}

export default function NeonParilti() {
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {/* Taban katman: tüm viewport'u sabit, güçlü bir yeşille kaplar — bu sayede
          hiçbir bölge (üst/alt gradyanların değmediği orta kesim dahil) düz
          siyaha dönmez. */}
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: `${YESIL}30` }]} />
      <LinearGradient
        colors={[`${YESIL}80`, `${YESIL}45`, `${YESIL}20`]}
        locations={[0, 0.5, 1]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.5, y: 0.65 }}
        style={StyleSheet.absoluteFillObject}
      />
      <LinearGradient
        colors={[`${KOYU_YESIL}20`, `${KOYU_YESIL}45`, `${KOYU_YESIL}80`]}
        locations={[0, 0.5, 1]}
        start={{ x: 0.5, y: 0.35 }}
        end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={{ position: 'absolute', top: -10, left: -10 }}>
        <KoseCizgiler renk={YESIL} />
      </View>
      <View style={{ position: 'absolute', bottom: -10, right: -10 }}>
        <KoseCizgiler renk={KOYU_YESIL} ayna />
      </View>
    </View>
  );
}
