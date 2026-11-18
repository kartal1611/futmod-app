import { View, Text, StyleSheet } from 'react-native';
import { useRenkler } from '../../constants/theme';

const VIP_RENGI = '#B07CFF';
const PARTNER_RENGI = '#3FD2FF';

/** Author name with staff role, VIP and partner pills, and the activity rank. */
export default function YazarSatiri({ ad, isAdmin, isModerator, isVip, isAffiliate, rozet, boyut = 13 }) {
  const RENKLER = useRenkler();
  const rol = isAdmin ? '👑 ADMİN' : isModerator ? '🛡️ MOD' : null;
  const pil = (metin, zemin, yazi) => (
    <Text style={[styles.pil, { fontSize: Math.max(boyut - 3.5, 9), color: yazi, backgroundColor: zemin }]} numberOfLines={1}>{metin}</Text>
  );
  return (
    <View style={styles.satir}>
      <Text style={{ fontSize: boyut, fontWeight: '800', color: RENKLER.metin, flexShrink: 1 }} numberOfLines={1}>{ad}</Text>
      {rol ? pil(rol, RENKLER.vurgu, RENKLER.bg) : null}
      {isVip ? pil('💎 VIP', VIP_RENGI, '#fff') : null}
      {isAffiliate ? pil('PARTNER', PARTNER_RENGI, '#06202a') : null}
      {rozet ? (
        <Text style={{ fontSize: boyut - 2, fontWeight: '700', color: RENKLER.metinUcuncul }} numberOfLines={1}>{rozet}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  satir: { flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 1 },
  pil: { fontWeight: '900', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 7, overflow: 'hidden' },
});
