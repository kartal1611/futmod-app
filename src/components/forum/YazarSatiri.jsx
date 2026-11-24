import { View, Text, StyleSheet } from 'react-native';
import { useRenkler, FONT } from '../../constants/theme';

const VIP_RENGI = '#B07CFF';
const PARTNER_RENGI = '#3FD2FF';

/** Author name with staff role, VIP and partner pills, and the activity rank. */
export default function YazarSatiri({ ad, isAdmin, isModerator, isVip, isAffiliate, rozet, boyut = 13 }) {
  const RENKLER = useRenkler();
  const rol = isAdmin ? '👑 ADMİN' : isModerator ? '🛡️ MOD' : null;
  const pil = (metin, zemin, yazi) => (
    <View style={[styles.pil, { backgroundColor: zemin }]}>
      <Text style={{ fontFamily: FONT.etiketItalik, fontSize: Math.max(boyut - 1.5, 10.5), letterSpacing: 0.6, color: yazi }} numberOfLines={1}>{metin}</Text>
    </View>
  );
  return (
    <View style={styles.satir}>
      <Text style={{ fontSize: boyut, fontWeight: '800', color: RENKLER.metin, flexShrink: 1 }} numberOfLines={1}>{ad}</Text>
      {rol ? pil(rol, RENKLER.vurgu, RENKLER.bg) : null}
      {isVip ? pil('💎 VIP', VIP_RENGI, '#fff') : null}
      {isAffiliate ? pil('PARTNER', PARTNER_RENGI, '#06202a') : null}
      {rozet ? (
        <Text style={{ fontFamily: FONT.etiketItalik, fontSize: boyut - 0.5, letterSpacing: 0.5, color: RENKLER.metinUcuncul }} numberOfLines={1}>{rozet.toLocaleUpperCase('tr-TR')}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  satir: { flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 1 },
  pil: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 2, transform: [{ skewX: '-12deg' }] },
});
