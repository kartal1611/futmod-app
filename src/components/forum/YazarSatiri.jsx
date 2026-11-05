import { View, Text, StyleSheet } from 'react-native';
import { useRenkler } from '../../constants/theme';

/** Author name with a visible role pill for staff, otherwise the reputation badge. */
export default function YazarSatiri({ ad, isAdmin, isModerator, rozet, boyut = 13 }) {
  const RENKLER = useRenkler();
  const rol = isAdmin ? '👑 ADMİN' : isModerator ? 'MODERATÖR' : null;
  return (
    <View style={styles.satir}>
      <Text style={{ fontSize: boyut, fontWeight: '800', color: RENKLER.metin, flexShrink: 1 }} numberOfLines={1}>{ad}</Text>
      {rol ? (
        <Text style={[styles.pil, { color: RENKLER.bg, backgroundColor: RENKLER.vurgu }]} numberOfLines={1}>{rol}</Text>
      ) : rozet ? (
        <Text style={{ fontSize: boyut - 2, fontWeight: '700', color: RENKLER.metinUcuncul }} numberOfLines={1}>{rozet}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  satir: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  pil: { fontSize: 9.5, fontWeight: '900', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 7, overflow: 'hidden' },
});
