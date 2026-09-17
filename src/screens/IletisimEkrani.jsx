import { View, Text, ScrollView, Pressable, Linking, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TELEGRAM_URL } from '../constants/contact';
import NeonParilti from '../components/NeonParilti';
import { useRenkler, useOrtakStil } from '../constants/theme';

const KANALLAR = [
  { etiket: 'Telegram', deger: '@haintorun', link: TELEGRAM_URL, tiklanabilir: true },
  { etiket: 'E-posta', deger: 'Yakında eklenecek', tiklanabilir: false },
  { etiket: 'Instagram', deger: 'Yakında eklenecek', tiklanabilir: false },
];

export default function IletisimEkrani() {
  const RENKLER = useRenkler();
  const ORTAK_STIL = useOrtakStil();
  const styles = olusturStyles(RENKLER);
  const insets = useSafeAreaInsets();
  return (
    <View style={ORTAK_STIL.ekran}>
      <NeonParilti />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingTop: insets.top + 16, paddingBottom: 40 }}>
      <Text style={styles.baslik}>İletişim ✉️</Text>
      <Text style={styles.altBaslik}>Aklında ne varsa bize ulaştır, seni dinliyoruz</Text>

      <View style={{ marginTop: 20, gap: 12 }}>
        {KANALLAR.map((k) => {
          const Kapsayici = k.tiklanabilir ? Pressable : View;
          return (
            <Kapsayici
              key={k.etiket}
              style={ORTAK_STIL.kart}
              {...(k.tiklanabilir ? { onPress: () => Linking.openURL(k.link) } : {})}
            >
              <Text style={styles.etiket}>{k.etiket}</Text>
              <Text style={[styles.deger, k.tiklanabilir && { color: RENKLER.vurgu2 }]}>{k.deger}</Text>
            </Kapsayici>
          );
        })}
      </View>
      </ScrollView>
    </View>
  );
}

function olusturStyles(RENKLER) {
  return StyleSheet.create({
  baslik: { fontSize: 24, fontWeight: '800', color: RENKLER.metin },
  altBaslik: { fontSize: 13, color: RENKLER.metinIkincil, marginTop: 4 },
  etiket: { fontSize: 11, fontWeight: '700', color: RENKLER.vurgu, textTransform: 'uppercase', letterSpacing: 0.4 },
  deger: { fontSize: 15, color: RENKLER.metin, marginTop: 4, fontWeight: '600' },
  });
}
