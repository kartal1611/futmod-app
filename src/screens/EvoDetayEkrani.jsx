import { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../services/api';
import { useRenkler, useOrtakStil } from '../constants/theme';

export default function EvoDetayEkrani() {
  const RENKLER = useRenkler();
  const ORTAK_STIL = useOrtakStil();
  const styles = olusturStyles(RENKLER);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let iptal = false;
    setLoading(true);
    api.contentItem(id)
      .then((data) => { if (!iptal) setItem(data.item); })
      .catch((err) => { if (!iptal) setError(err.message); })
      .finally(() => { if (!iptal) setLoading(false); });
    return () => { iptal = true; };
  }, [id]);

  if (loading) {
    return (
      <View style={[ORTAK_STIL.ekran, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={RENKLER.vurgu} />
      </View>
    );
  }

  if (error || !item) {
    return (
      <View style={ORTAK_STIL.ekran}>
        <View style={[styles.ustBar, { paddingTop: insets.top + 12 }]}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Text style={styles.geriOk}>‹</Text>
          </Pressable>
          <Text style={styles.baslik}>Evrim</Text>
          <View style={{ width: 24 }} />
        </View>
        <Text style={styles.bos}>{error || 'İçerik bulunamadı.'}</Text>
      </View>
    );
  }

  const p = item.payload || {};
  const req = p.playerRequirements || {};
  const levels = p.levels || [];

  return (
    <View style={ORTAK_STIL.ekran}>
      <View style={[styles.ustBar, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={styles.geriOk}>‹</Text>
        </Pressable>
        <Text style={styles.baslik} numberOfLines={1}>{item.title}</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={levels}
        keyExtractor={(l) => String(l.level)}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        ListHeaderComponent={
          <View style={{ marginBottom: 16, alignItems: 'center' }}>
            {item.imageUrl ? <Image source={{ uri: item.imageUrl }} style={styles.detayGorsel} resizeMode="contain" /> : null}
            {p.description ? <Text style={styles.detayAciklama}>{p.description}</Text> : null}

            <View style={styles.istatistikSatiri}>
              <Istatistik etiket="Zorluk" deger={p.completionDifficulty || '-'} />
              <Istatistik etiket="Süre" deger={p.expiry || '-'} />
              <Istatistik etiket="Token" deger={p.tokenCost ?? '-'} />
            </View>

            <View style={[ORTAK_STIL.kart, { width: '100%', marginTop: 14 }]}>
              <Text style={styles.bolumBaslik}>Oyuncu Şartları</Text>
              <Satir etiket="Reyting" deger={req.overall} />
              <Satir etiket="Pozisyon" deger={req.position} />
              <Satir etiket="Hariç Pozisyon" deger={req.excludedPosition} />
              <Satir etiket="Max PlayStyle" deger={req.maxPlaystyles} />
              <Satir etiket="Max PlayStyle+" deger={req.maxPlaystylesPlus} />
              <Satir etiket="Gönderim" deger={p.submitBy} />
            </View>

            <Text style={[styles.bolumBaslik, { marginTop: 18, alignSelf: 'flex-start' }]}>Seviyeler ({levels.length})</Text>
          </View>
        }
        ListEmptyComponent={<Text style={styles.bos}>Bu evrim için seviye detayı henüz alınamadı.</Text>}
        renderItem={({ item: lvl }) => (
          <View style={[ORTAK_STIL.kart, { marginBottom: 12 }]}>
            <Text style={styles.seviyeBaslik}>Seviye {lvl.level}</Text>
            {(lvl.upgrades || []).length > 0 ? (
              <View style={styles.chipSatiri}>
                {lvl.upgrades.map((u, i) => <Text key={i} style={styles.upgradeChip}>{u}</Text>)}
              </View>
            ) : null}
            {(lvl.challenges || []).length > 0 ? (
              <View style={{ marginTop: 8 }}>
                {lvl.challenges.map((c, i) => (
                  <View key={i} style={styles.sartSatiri}>
                    <Text style={styles.sartNokta}>•</Text>
                    <Text style={styles.sartMetin}>{c}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.gorevYok}>Görev şartı yok (otomatik seviye)</Text>
            )}
          </View>
        )}
      />
    </View>
  );
}

function Istatistik({ etiket, deger }) {
  const RENKLER = useRenkler();
  const styles = olusturStyles(RENKLER);
  return (
    <View style={styles.istatistikKutu}>
      <Text style={styles.istatistikEtiket}>{etiket}</Text>
      <Text style={styles.istatistikDeger} numberOfLines={1}>{String(deger)}</Text>
    </View>
  );
}

function Satir({ etiket, deger }) {
  const RENKLER = useRenkler();
  const styles = olusturStyles(RENKLER);
  if (!deger) return null;
  return (
    <View style={styles.satir}>
      <Text style={styles.satirEtiket}>{etiket}</Text>
      <Text style={styles.satirDeger}>{deger}</Text>
    </View>
  );
}

function olusturStyles(RENKLER) {
  return StyleSheet.create({
  ustBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 24, paddingBottom: 12 },
  geriOk: { fontSize: 28, color: RENKLER.metin, fontWeight: '300', width: 24 },
  baslik: { fontSize: 18, fontWeight: '800', color: RENKLER.metin, flex: 1, textAlign: 'center' },
  bos: { color: RENKLER.metinIkincil, textAlign: 'center', marginTop: 40, paddingHorizontal: 24 },
  detayGorsel: { width: 120, height: 120 },
  detayAciklama: { fontSize: 13, color: RENKLER.metinIkincil, textAlign: 'center', marginTop: 10, paddingHorizontal: 12 },
  istatistikSatiri: { flexDirection: 'row', gap: 8, marginTop: 14, width: '100%' },
  istatistikKutu: { flex: 1, backgroundColor: RENKLER.bg3, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  istatistikEtiket: { fontSize: 9, fontWeight: '700', color: RENKLER.metinUcuncul, textTransform: 'uppercase' },
  istatistikDeger: { fontSize: 12.5, fontWeight: '700', color: RENKLER.metin, marginTop: 2 },
  bolumBaslik: { fontSize: 15, fontWeight: '800', color: RENKLER.metin, marginBottom: 6 },
  satir: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: RENKLER.ayrici },
  satirEtiket: { fontSize: 12.5, color: RENKLER.metinIkincil },
  satirDeger: { fontSize: 12.5, color: RENKLER.metin, fontWeight: '700' },
  seviyeBaslik: { fontSize: 15, fontWeight: '800', color: RENKLER.vurgu2, marginBottom: 8 },
  chipSatiri: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  upgradeChip: { backgroundColor: RENKLER.bg3, color: RENKLER.metin, fontSize: 11, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  sartSatiri: { flexDirection: 'row', gap: 6, marginTop: 4 },
  sartNokta: { color: RENKLER.vurgu, fontSize: 13 },
  sartMetin: { color: RENKLER.metinIkincil, fontSize: 12.5, flex: 1 },
  gorevYok: { color: RENKLER.metinUcuncul, fontSize: 11.5, marginTop: 6, fontStyle: 'italic' },
  });
}
