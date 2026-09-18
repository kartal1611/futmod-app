import { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, Pressable, ActivityIndicator, RefreshControl, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../services/api';
import { useRenkler, useOrtakStil } from '../constants/theme';

const PLATFORM_BASLIK = { pc: 'PC Coin', 'ps-xbox': 'PS - Xbox Coin' };

export default function ToruncoinUrunlerEkrani() {
  const RENKLER = useRenkler();
  const ORTAK_STIL = useOrtakStil();
  const styles = olusturStyles(RENKLER);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { platform } = useLocalSearchParams();
  const [urunler, setUrunler] = useState([]);
  const [loading, setLoading] = useState(true);

  const getir = () => {
    setLoading(true);
    api.coins({ platform })
      .then((data) => setUrunler(data.coins))
      .finally(() => setLoading(false));
  };

  useEffect(() => { getir(); }, [platform]);

  return (
    <View style={ORTAK_STIL.ekran}>
      <View style={[styles.ustBar, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={styles.geriOk}>‹</Text>
        </Pressable>
        <Text style={styles.baslik}>{PLATFORM_BASLIK[platform] || 'Toruncoin'}</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading && urunler.length === 0 ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={RENKLER.vurgu} />
      ) : (
        <FlatList
          data={urunler}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={getir} tintColor={RENKLER.vurgu} />}
          ListEmptyComponent={<Text style={styles.bos}>Henüz ürün yok.</Text>}
          renderItem={({ item }) => (
            <Pressable onPress={() => router.push(`/toruncoin/urun/${item.id}`)} style={({ pressed }) => [ORTAK_STIL.kart, { marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }, pressed && { opacity: 0.85 }]}>
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={styles.gorsel} resizeMode="cover" />
              ) : (
                <View style={[styles.gorsel, { backgroundColor: RENKLER.bg3 }]} />
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.kartBaslik}>{item.coinName}</Text>
                <Text style={styles.fiyat}>{item.price.toLocaleString('tr-TR')} {item.currency}</Text>
              </View>
              <Text style={styles.ok}>›</Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

function olusturStyles(RENKLER) {
  return StyleSheet.create({
  ustBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 24, paddingBottom: 12,
  },
  geriOk: { fontSize: 28, color: RENKLER.metin, fontWeight: '300', width: 24 },
  baslik: { fontSize: 18, fontWeight: '800', color: RENKLER.metin, flex: 1, textAlign: 'center' },
  gorsel: { width: 56, height: 56, borderRadius: 10 },
  kartBaslik: { fontSize: 15, fontWeight: '700', color: RENKLER.metin },
  fiyat: { fontSize: 14, color: RENKLER.uyari, fontWeight: '800', marginTop: 4 },
  ok: { fontSize: 24, color: RENKLER.metinUcuncul, fontWeight: '300' },
  bos: { color: RENKLER.metinIkincil, textAlign: 'center', marginTop: 40, paddingHorizontal: 24 },
  });
}
