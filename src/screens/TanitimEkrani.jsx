import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import NeonParilti from '../components/NeonParilti';
import { useRenkler, useOrtakStil } from '../constants/theme';

const SAYFALAR = [
  { emoji: '💬', baslik: 'Oyuncuların forumu', metin: 'Kadro, taktik, market ve daha fazlasını kategorilere ayrılmış başlıklarda tartış.' },
  { emoji: '📊', baslik: 'Sor, oyla, anket aç', metin: 'İyi cevapları öne çıkar, kararsız kaldığında toplulukla anket yap.' },
  { emoji: '🔔', baslik: 'Hiçbir yanıtı kaçırma', metin: 'Başlıkları ve kullanıcıları takip et, sana yanıt gelince bildirim al.' },
];

export default function TanitimEkrani({ onBitti }) {
  const RENKLER = useRenkler();
  const ORTAK_STIL = useOrtakStil();
  const styles = olusturStyles(RENKLER);
  const insets = useSafeAreaInsets();
  const [sayfa, setSayfa] = useState(0);
  const son = sayfa === SAYFALAR.length - 1;
  const s = SAYFALAR[sayfa];

  return (
    <View style={[ORTAK_STIL.ekran, { backgroundColor: RENKLER.bg, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 20 }]}>
      <NeonParilti />
      <View style={styles.ust}>
        {!son ? (
          <Pressable onPress={onBitti} hitSlop={12}>
            <Text style={styles.gec}>Geç</Text>
          </Pressable>
        ) : null}
      </View>
      <View style={styles.icerik}>
        <Text style={styles.emoji}>{s.emoji}</Text>
        <Text style={styles.baslik}>{s.baslik}</Text>
        <Text style={styles.metin}>{s.metin}</Text>
      </View>
      <View style={styles.noktalar}>
        {SAYFALAR.map((_, i) => (
          <View key={i} style={[styles.nokta, i === sayfa && { backgroundColor: RENKLER.vurgu }]} />
        ))}
      </View>
      <Pressable onPress={() => (son ? onBitti() : setSayfa(sayfa + 1))} style={[ORTAK_STIL.buyukButon, { marginHorizontal: 24 }]}>
        <Text style={styles.buton}>{son ? 'Başla' : 'Devam'}</Text>
      </Pressable>
    </View>
  );
}

function olusturStyles(RENKLER) {
  return StyleSheet.create({
    ust: { height: 32, alignItems: 'flex-end', paddingHorizontal: 24 },
    gec: { fontSize: 14, fontWeight: '700', color: RENKLER.metinIkincil },
    icerik: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
    emoji: { fontSize: 64 },
    baslik: { fontSize: 25, fontWeight: '900', color: RENKLER.metin, textAlign: 'center', marginTop: 22 },
    metin: { fontSize: 15.5, color: RENKLER.metinIkincil, textAlign: 'center', lineHeight: 22, marginTop: 12 },
    noktalar: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 22 },
    nokta: { width: 8, height: 8, borderRadius: 4, backgroundColor: RENKLER.ayrici },
    buton: { color: RENKLER.bg, fontWeight: '800', fontSize: 15 },
  });
}
