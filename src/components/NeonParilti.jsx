import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';

// Koyu zemin, ince çapraz çizgi dokusu ve sol üstte sıcak altın ışık (Torunbot paneli tarzı).
// Çizgiler tek bir Path olarak sabit piksel boyutunda çizilir: SVG Pattern ve yüzde
// boyut iOS'ta güvenilir değil (build 49'da ekran boş kaldı).
const ALTIN = 'rgba(244,194,77,0.14)';
const SEFFAF = 'rgba(244,194,77,0)';
const ARALIK = 14;

function cizgiYolu(w, h) {
  let d = '';
  for (let x = -h; x < w; x += ARALIK) d += `M${x} ${h}L${x + h} 0`;
  return d;
}

export default function NeonParilti() {
  const { width, height } = useWindowDimensions();
  const w = Math.ceil(width);
  const h = Math.ceil(height);
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {w > 0 && h > 0 ? (
        <Svg width={w} height={h} style={styles.cizgiler}>
          <Path d={cizgiYolu(w, h)} stroke="#ffffff" strokeOpacity={0.028} strokeWidth={1.2} />
        </Svg>
      ) : null}
      <LinearGradient colors={[ALTIN, SEFFAF]} start={{ x: 0, y: 0 }} end={{ x: 0.6, y: 0.32 }} style={StyleSheet.absoluteFillObject} />
    </View>
  );
}

const styles = StyleSheet.create({
  cizgiler: { position: 'absolute', top: 0, left: 0 },
});
