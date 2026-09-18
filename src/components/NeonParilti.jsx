import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';

// FutMod'un yeşil-beyaz-siyah marka kimliğine göre: üstte parlak neon yeşil,
// altta koyu zümrüt/teal tonu — logoya birebir uyumlu. Eskiden mor/pembe
// çiftiydi (kullanıcının ilk referans görseline göre); marka logosu
// netleşince (yeşil "F" amblemi) buna geçildi.
const YESIL = '#39FF6E'; // vurgu rengiyle birebir aynı (themeStore.js)
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

/**
 * Ekranın tamamını (görünen viewport) kaplayan iki dikey LinearGradient:
 * üstte parlak yeşil, aşağı indikçe soluklaşıyor ama HİÇBİR NOKTADA
 * tamamen şeffaflaşmıyor (min ~%10-12 opaklık) — önceki denemede orta
 * bölüm neredeyse %0'a inip "simsiyah" izlenimi veriyordu, kullanıcı
 * defalarca bunu bildirdi. Alttan da simetrik olarak koyu yeşil/teal bir
 * ikinci katman geliyor, ortada ikisi üst üste binip her zaman hafif bir
 * renk tonu kalıyor.
 */
export default function NeonParilti() {
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <LinearGradient
        colors={[`${YESIL}75`, `${YESIL}35`, `${YESIL}18`]}
        locations={[0, 0.5, 1]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <LinearGradient
        colors={[`${KOYU_YESIL}18`, `${KOYU_YESIL}35`, `${KOYU_YESIL}70`]}
        locations={[0, 0.5, 1]}
        start={{ x: 0.5, y: 0 }}
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
