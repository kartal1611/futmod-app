import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useRenkler, FONT } from '../constants/theme';

/** Şimşek işareti, FUTCHAT yazısı (Torunbot tarzı dar italik) ve topluluk satırı. */
export default function MarkaLogo({ boyut = 1, altMetin = 'Oyuncu Topluluğu' }) {
  const RENKLER = useRenkler();
  return (
    <View style={styles.satir}>
      <Svg width={40 * boyut} height={32 * boyut} viewBox="0 0 46 36">
        <Path d="M2 2h42L33 11H19l-2 5h15L6 34l6-14H4l6-9H0z" fill={RENKLER.vurgu} />
      </Svg>
      <View>
        <Text style={[styles.ad, { fontSize: 27 * boyut, lineHeight: 28 * boyut }]}>
          <Text style={{ color: RENKLER.metin }}>FUT</Text>
          <Text style={{ color: RENKLER.vurgu }}>CHAT</Text>
        </Text>
        {altMetin ? <Text style={[styles.alt, { color: RENKLER.metinIkincil, fontSize: 11 * boyut }]}>{altMetin.toLocaleUpperCase('tr-TR')}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  satir: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ad: { fontFamily: FONT.dev, letterSpacing: 0.8 },
  alt: { fontFamily: FONT.etiket, letterSpacing: 1.6 },
});
