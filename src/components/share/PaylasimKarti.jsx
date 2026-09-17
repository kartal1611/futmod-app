import { View, Text, StyleSheet } from 'react-native';
import { useRenkler } from '../../constants/theme';

const KART_GENISLIK = 420;

/**
 * Fixed-layout poster frame every shareable card renders inside of — a
 * full dark card with a bold section title + branded footer, so every
 * screen's share image reads as the same "series" regardless of content.
 * Mounted off-screen (see usePaylasAkisi) and only ever captured, never
 * shown directly to the user until the capture preview.
 */
export default function PaylasimKarti({ baslik, vurguRenk, children }) {
  const RENKLER = useRenkler();
  const vurgu = vurguRenk || RENKLER.vurgu;
  return (
    <View style={[styles.kart, { backgroundColor: RENKLER.bg }]}>
      <View style={[styles.ustSerit, { backgroundColor: vurgu }]} />

      <View style={styles.icerik}>
        <View style={styles.markaSatiri}>
          <Text style={[styles.logo, { color: RENKLER.metin }]}>FutMod</Text>
          <Text style={[styles.markaAlt, { color: RENKLER.metinUcuncul }]}>EAFC27 ULTIMATE TEAM</Text>
        </View>

        {baslik ? <Text style={[styles.baslik, { color: vurgu }]}>{baslik}</Text> : null}

        {children}
      </View>

      <View style={[styles.ustSerit, { backgroundColor: vurgu, marginTop: 0 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  kart: { width: KART_GENISLIK, borderRadius: 18, overflow: 'hidden' },
  ustSerit: { height: 5 },
  icerik: { padding: 22 },
  markaSatiri: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  logo: { fontSize: 19, fontWeight: '900', fontStyle: 'italic', letterSpacing: -0.5 },
  markaAlt: { fontSize: 9, fontWeight: '700', letterSpacing: 0.8 },
  baslik: { fontSize: 26, fontWeight: '900', letterSpacing: 1, textAlign: 'center', marginTop: 18, textTransform: 'uppercase' },
});

export { KART_GENISLIK };
