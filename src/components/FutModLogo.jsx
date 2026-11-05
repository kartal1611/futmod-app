import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useRenkler } from '../constants/theme';

/** Lightning mark with the wordmark and community line. */
export default function FutModLogo({ boyut = 1, altMetin = 'Oyuncu Topluluğu' }) {
  const RENKLER = useRenkler();
  return (
    <View style={styles.satir}>
      <Svg width={46 * boyut} height={36 * boyut} viewBox="0 0 46 36">
        <Path d="M2 2h42L33 11H19l-2 5h15L6 34l6-14H4l6-9H0z" fill={RENKLER.vurgu} />
      </Svg>
      <View>
        <Text style={[styles.ad, { color: RENKLER.metin, fontSize: 24 * boyut, lineHeight: 27 * boyut }]}>FutMod</Text>
        {altMetin ? <Text style={[styles.alt, { color: RENKLER.metinIkincil, fontSize: 10.5 * boyut }]}>{altMetin}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  satir: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  ad: { fontWeight: '900', fontStyle: 'italic' },
  alt: { fontWeight: '500' },
});
