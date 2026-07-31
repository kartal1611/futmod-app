import { useEffect } from 'react';
import { View, Text, ScrollView, Pressable, ImageBackground, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useContentStore } from '../store/contentStore';
import { RENKLER } from '../constants/theme';

const KATEGORILER = [
  {
    key: 'sbc',
    baslik: 'SBC Merkezi',
    aciklama: 'Şartları, kadroları ve coin maliyetiyle güncel SBC\'ler',
    emoji: '📋',
    route: '/sbc',
    renk: RENKLER.vurgu,
  },
  {
    key: 'coin',
    baslik: 'Toruncoin',
    aciklama: 'Güncel coin fiyatı ve piyasa bilgisi',
    emoji: '🪙',
    route: '/toruncoin',
    renk: RENKLER.vurgu2,
  },
  {
    key: 'trade',
    baslik: 'Trade',
    aciklama: 'Trader kartlar hakkında bilgi (detaylar VIP üyelere özel)',
    emoji: '📈',
    route: '/trade',
    renk: RENKLER.basari,
  },
];

export default function AnaSayfaEkrani() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { items, fetchFeed } = useContentStore();

  useEffect(() => { fetchFeed('sbc'); }, []);

  const sbcSayisi = items.filter((i) => i.type === 'sbc').length;

  return (
    <ImageBackground
      source={require('../../assets/ana-sayfa-saha.jpg')}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <View style={styles.karartma} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingTop: insets.top + 24, paddingBottom: 40 }}>
        <View style={{ paddingHorizontal: 20 }}>
          <Text style={styles.heroUst}>HOŞ GELDİN</Text>
          <Text style={styles.heroBaslik}>Sahaya çık, {'\n'}fırsatları kaçırma ⚽</Text>
          <Text style={styles.heroAlt}>Güncel SBC'ler ve coin fiyatları burada</Text>
        </View>

        <View style={{ padding: 16, paddingTop: 28, gap: 12 }}>
          {KATEGORILER.map((k) => (
            <Pressable
              key={k.key}
              onPress={() => router.push(k.route)}
              style={({ pressed }) => [styles.kart, { borderLeftColor: k.renk }, pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] }]}
            >
              <View style={[styles.emojiRozet, { backgroundColor: `${k.renk}22` }]}>
                <Text style={styles.kartEmoji}>{k.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.kartBaslik}>{k.baslik}</Text>
                <Text style={styles.kartAciklama}>{k.aciklama}</Text>
                {k.key === 'sbc' && sbcSayisi > 0 ? (
                  <Text style={[styles.kartSayac, { color: k.renk }]}>{sbcSayisi} aktif SBC seni bekliyor</Text>
                ) : null}
              </View>
              <Text style={[styles.ok, { color: k.renk }]}>›</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  karartma: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: RENKLER.bg,
    opacity: 0.5,
  },
  heroUst: {
    fontSize: 11,
    fontWeight: '800',
    color: RENKLER.vurgu2,
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  heroBaslik: {
    fontSize: 28,
    fontWeight: '900',
    color: RENKLER.metin,
    lineHeight: 34,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  heroAlt: {
    fontSize: 13,
    color: RENKLER.metinIkincil,
    marginTop: 8,
  },
  kart: {
    backgroundColor: RENKLER.bg2,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: RENKLER.ayrici,
    borderLeftWidth: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  emojiRozet: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kartEmoji: { fontSize: 26 },
  kartBaslik: { fontSize: 17, fontWeight: '800', color: RENKLER.metin },
  kartAciklama: { fontSize: 12.5, color: RENKLER.metinIkincil, marginTop: 3 },
  kartSayac: { fontSize: 11.5, marginTop: 6, fontWeight: '700' },
  ok: { fontSize: 26, fontWeight: '300' },
});
