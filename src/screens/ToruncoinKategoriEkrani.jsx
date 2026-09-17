import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import NeonParilti from '../components/NeonParilti';
import { useRenkler, useOrtakStil } from '../constants/theme';

const KATEGORILER = [
  { key: 'pc', baslik: 'PC Coin', aciklama: 'Origin / PC platformu için coin paketleri', emoji: '🖥️' },
  { key: 'ps-xbox', baslik: 'PS - Xbox Coin', aciklama: 'PlayStation ve Xbox platformu için coin paketleri', emoji: '🎮' },
];

export default function ToruncoinKategoriEkrani() {
  const RENKLER = useRenkler();
  const ORTAK_STIL = useOrtakStil();
  const styles = olusturStyles(RENKLER);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={ORTAK_STIL.ekran}>
      <NeonParilti />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingTop: insets.top + 24, paddingBottom: 40 }}>
      <Text style={styles.baslik}>Toruncoin 🪙</Text>
      <Text style={styles.altBaslik}>Platformunu seç, güncel fiyatları gör</Text>

      <View style={{ marginTop: 20, gap: 12 }}>
        {KATEGORILER.map((k) => (
          <Pressable
            key={k.key}
            onPress={() => router.push(`/toruncoin/${k.key}`)}
            style={({ pressed }) => [ORTAK_STIL.kart, pressed && { opacity: 0.85 }]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <Text style={styles.emoji}>{k.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.kartBaslik}>{k.baslik}</Text>
                <Text style={styles.kartAciklama}>{k.aciklama}</Text>
              </View>
              <Text style={styles.ok}>›</Text>
            </View>
          </Pressable>
        ))}
      </View>

      <Text style={styles.uyari}>Fiyatlar toruncoin.com'dan otomatik güncellenir. Alım işlemi Telegram üzerinden manuel yapılır.</Text>
      </ScrollView>
    </View>
  );
}

function olusturStyles(RENKLER) {
  return StyleSheet.create({
  baslik: { fontSize: 24, fontWeight: '800', color: RENKLER.metin },
  altBaslik: { fontSize: 13, color: RENKLER.metinIkincil, marginTop: 4 },
  emoji: { fontSize: 30 },
  kartBaslik: { fontSize: 17, fontWeight: '800', color: RENKLER.metin },
  kartAciklama: { fontSize: 12.5, color: RENKLER.metinIkincil, marginTop: 3 },
  ok: { fontSize: 26, color: RENKLER.vurgu, fontWeight: '300' },
  uyari: { fontSize: 11.5, color: RENKLER.metinUcuncul, textAlign: 'center', marginTop: 24, paddingHorizontal: 12 },
  });
}
