import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRenkler } from '../../constants/theme';

/** Like and dislike arrows around the net score. */
export default function OyGrubu({ sayi, oyum = 0, onOy, kapali = false, cerceveli = false }) {
  const RENKLER = useRenkler();
  const renk = oyum === 1 ? RENKLER.vurgu : oyum === -1 ? RENKLER.hata : RENKLER.metinIkincil;
  return (
    <View style={[styles.grup, cerceveli && { borderWidth: 1, borderColor: RENKLER.ayrici, backgroundColor: RENKLER.bg2, borderRadius: 11 }]}>
      <Pressable onPress={() => onOy(1)} disabled={kapali} hitSlop={8} style={styles.ok} accessibilityRole="button" accessibilityLabel="Beğen">
        <Text style={{ fontSize: 15, color: oyum === 1 ? RENKLER.vurgu : RENKLER.metinIkincil }}>▲</Text>
      </Pressable>
      <Text style={[styles.sayi, { color: renk }]}>{sayi}</Text>
      <Pressable onPress={() => onOy(-1)} disabled={kapali} hitSlop={8} style={styles.ok} accessibilityRole="button" accessibilityLabel="Beğenme">
        <Text style={{ fontSize: 15, color: oyum === -1 ? RENKLER.hata : RENKLER.metinIkincil }}>▼</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  grup: { flexDirection: 'row', alignItems: 'center' },
  ok: { minWidth: 34, minHeight: 36, alignItems: 'center', justifyContent: 'center' },
  sayi: { fontSize: 13.5, fontWeight: '800', minWidth: 20, textAlign: 'center' },
});
