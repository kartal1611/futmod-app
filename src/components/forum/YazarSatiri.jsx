import { View, Text, StyleSheet } from 'react-native';
import { useRenkler } from '../../constants/theme';

/** Author name with role and reputation badge; used on threads, comments and profiles. */
export default function YazarSatiri({ ad, isAdmin, isModerator, rozet, boyut = 12 }) {
  const RENKLER = useRenkler();
  const rol = isAdmin ? 'Yönetici' : isModerator ? 'Moderatör' : null;
  return (
    <View style={styles.satir}>
      <Text style={{ fontSize: boyut, fontWeight: '800', color: rol ? RENKLER.uyari : RENKLER.vurgu2, flexShrink: 1 }} numberOfLines={1}>{ad}</Text>
      {rol || rozet ? (
        <Text style={{ fontSize: boyut - 2, fontWeight: '700', color: RENKLER.metinIkincil }} numberOfLines={1}>{rol || rozet}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  satir: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
});
