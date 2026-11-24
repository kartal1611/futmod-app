import { useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useRenkler } from '../constants/theme';

/**
 * Sağ üst ve sol alt köşesi kesik panel (Torunbot paneli tarzı).
 * RN kesik köşe çizemediği için zemin, ölçülen boyuta göre SVG ile çizilir.
 * `vurgulu` kenarı altın yapar, `parilti` sol üstten hafif altın ışık verir.
 */
export default function KesikPanel({ children, style, kesik = 14, dolgu, kenar, vurgulu = false, parilti = false, onPress, onLongPress, ...rest }) {
  const RENKLER = useRenkler();
  const [boyut, setBoyut] = useState(null);
  const k = kesik;
  const kenarRenk = kenar || (vurgulu ? RENKLER.vurgu : RENKLER.ayrici);

  const zemin = boyut ? (() => {
    const { w, h } = boyut;
    const d = `M0.5 0.5H${w - k}L${w - 0.5} ${k}V${h - 0.5}H${k}L0.5 ${h - k}Z`;
    return (
      <Svg width={w} height={h} style={StyleSheet.absoluteFill} pointerEvents="none">
        {parilti ? (
          <Defs>
            <LinearGradient id="kp" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={RENKLER.vurgu} stopOpacity="0.16" />
              <Stop offset="0.55" stopColor={dolgu || RENKLER.bg2} stopOpacity="1" />
            </LinearGradient>
          </Defs>
        ) : null}
        <Path d={d} fill={parilti ? 'url(#kp)' : (dolgu || RENKLER.bg2)} stroke={kenarRenk} strokeWidth={1} />
      </Svg>
    );
  })() : null;

  const ortak = {
    ...rest,
    style: [styles.kap, style],
    onLayout: (e) => {
      const { width: w, height: h } = e.nativeEvent.layout;
      if (!boyut || boyut.w !== w || boyut.h !== h) setBoyut({ w, h });
    },
  };

  if (onPress || onLongPress) {
    return <Pressable {...ortak} onPress={onPress} onLongPress={onLongPress}>{zemin}{children}</Pressable>;
  }
  return <View {...ortak}>{zemin}{children}</View>;
}

const styles = StyleSheet.create({
  kap: { backgroundColor: 'transparent' },
});
