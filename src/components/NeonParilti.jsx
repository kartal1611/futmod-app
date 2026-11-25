import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { useRenkler } from '../constants/theme';

// Zemin üstü ince çapraz çizgi dokusu ve sol üstte vurgu renginde ışık (Torunbot paneli tarzı).
// Çizgiler tek bir Path olarak sabit piksel boyutunda çizilir: SVG Pattern ve yüzde
// boyut iOS'ta güvenilir değil (build 49'da ekran boş kaldı).
function saydam(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
const ARALIK = 14;

function cizgiYolu(w, h) {
  let d = '';
  for (let x = -h; x < w; x += ARALIK) d += `M${x} ${h}L${x + h} 0`;
  return d;
}

export default function NeonParilti() {
  const RENKLER = useRenkler();
  const { width, height } = useWindowDimensions();
  const isik = saydam(RENKLER.vurgu, RENKLER.mod === 'acik' ? 0.1 : 0.14);
  const w = Math.ceil(width);
  const h = Math.ceil(height);
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {w > 0 && h > 0 ? (
        <Svg width={w} height={h} style={styles.cizgiler}>
          <Path d={cizgiYolu(w, h)} stroke={RENKLER.cizgi} strokeOpacity={RENKLER.mod === 'acik' ? 0.035 : 0.028} strokeWidth={1.2} />
        </Svg>
      ) : null}
      <LinearGradient colors={[isik, saydam(RENKLER.vurgu, 0)]} start={{ x: 0, y: 0 }} end={{ x: 0.6, y: 0.32 }} style={StyleSheet.absoluteFillObject} />
    </View>
  );
}

const styles = StyleSheet.create({
  cizgiler: { position: 'absolute', top: 0, left: 0 },
});
