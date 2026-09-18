import { useEffect } from 'react';
import { View, Text, FlatList, Image, Pressable, ActivityIndicator, RefreshControl, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useContentStore, useContentItems } from '../store/contentStore';
import { useRenkler, useOrtakStil } from '../constants/theme';

export default function EvoListEkrani() {
  const RENKLER = useRenkler();
  const ORTAK_STIL = useOrtakStil();
  const styles = olusturStyles(RENKLER);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { loading, fetchFeed } = useContentStore();
  const items = useContentItems('evolution');

  useEffect(() => { fetchFeed('evolution'); }, []);

  return (
    <View style={ORTAK_STIL.ekran}>
      <View style={[styles.ustBar, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={styles.geriOk}>‹</Text>
        </Pressable>
        <Text style={styles.baslik}>Evrimler 🧬</Text>
        <View style={{ width: 24 }} />
      </View>
      {items.length > 0 ? <Text style={styles.sayac}>{items.length} Evrim · canlı veri</Text> : null}

      {loading && items.length === 0 ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={RENKLER.vurgu} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 16, paddingTop: 8, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={() => fetchFeed('evolution')} tintColor={RENKLER.vurgu} />}
          ListEmptyComponent={<Text style={styles.bos}>Henüz evrim yok.</Text>}
          renderItem={({ item }) => {
            const p = item.payload || {};
            return (
              <Pressable onPress={() => router.push(`/evrimler/${item.id}`)} style={({ pressed }) => [ORTAK_STIL.kart, { marginBottom: 14 }, pressed && { opacity: 0.85 }]}>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  {item.imageUrl ? (
                    <Image source={{ uri: item.imageUrl }} style={styles.gorsel} resizeMode="contain" />
                  ) : (
                    <View style={[styles.gorsel, { backgroundColor: RENKLER.bg3 }]} />
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.kartBaslik} numberOfLines={2}>{item.title}</Text>
                    {p.description ? <Text style={styles.aciklama} numberOfLines={2}>{p.description}</Text> : null}
                    <View style={styles.istatistikSatiri}>
                      {p.completionDifficulty ? <Etiket etiket="Zorluk" deger={p.completionDifficulty} /> : null}
                      {p.expiry ? <Etiket etiket="Bitiş" deger={p.expiry} /> : null}
                      {p.tokenCost ? <Etiket etiket="Token" deger={p.tokenCost} /> : null}
                    </View>
                  </View>
                  <Text style={styles.ok}>›</Text>
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}

function Etiket({ etiket, deger }) {
  const RENKLER = useRenkler();
  const styles = olusturStyles(RENKLER);
  return (
    <View style={styles.etiketKutu}>
      <Text style={styles.etiketEtiket}>{etiket}</Text>
      <Text style={styles.etiketDeger} numberOfLines={1}>{String(deger)}</Text>
    </View>
  );
}

function olusturStyles(RENKLER) {
  return StyleSheet.create({
  ustBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 24, paddingBottom: 4 },
  sayac: { textAlign: 'center', color: RENKLER.metinUcuncul, fontSize: 11.5, marginBottom: 10 },
  geriOk: { fontSize: 28, color: RENKLER.metin, fontWeight: '300', width: 24 },
  baslik: { fontSize: 18, fontWeight: '800', color: RENKLER.metin, flex: 1, textAlign: 'center' },
  gorsel: { width: 56, height: 56, borderRadius: 8 },
  kartBaslik: { fontSize: 14.5, fontWeight: '700', color: RENKLER.metin },
  aciklama: { fontSize: 11.5, color: RENKLER.metinIkincil, marginTop: 2 },
  ok: { fontSize: 24, color: RENKLER.metinUcuncul, fontWeight: '300' },
  bos: { color: RENKLER.metinIkincil, textAlign: 'center', marginTop: 40, paddingHorizontal: 24 },
  istatistikSatiri: { flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap' },
  etiketKutu: { backgroundColor: RENKLER.bg3, borderRadius: 8, paddingVertical: 4, paddingHorizontal: 8 },
  etiketEtiket: { fontSize: 8.5, fontWeight: '700', color: RENKLER.metinUcuncul, textTransform: 'uppercase' },
  etiketDeger: { fontSize: 11, fontWeight: '700', color: RENKLER.metin, marginTop: 1 },
  });
}
