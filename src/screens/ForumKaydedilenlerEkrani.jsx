import { useCallback, useState } from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBaslikIslemleri } from '../hooks/useBaslikIslemleri';
import BaslikKarti from '../components/forum/BaslikKarti';
import NeonParilti from '../components/NeonParilti';
import { api } from '../services/api';
import { useRenkler, useOrtakStil } from '../constants/theme';

export default function ForumKaydedilenlerEkrani() {
  const RENKLER = useRenkler();
  const ORTAK_STIL = useOrtakStil();
  const styles = olusturStyles(RENKLER);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [basliklar, setBasliklar] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState(null);
  const islemler = useBaslikIslemleri(setBasliklar);

  useFocusEffect(useCallback(() => {
    api.forumThreads({ saved: 1, sort: 'new', limit: 50 })
      .then((data) => { setBasliklar(data.items || []); setHata(null); })
      .catch((err) => setHata(err.message || 'Kaydedilenler yüklenemedi'))
      .finally(() => setYukleniyor(false));
  }, []));

  return (
    <View style={ORTAK_STIL.ekran}>
      <NeonParilti />
      <View style={[styles.ustBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.geriButon} accessibilityRole="button" accessibilityLabel="Geri">
          <Text style={styles.geriMetin}>‹</Text>
        </Pressable>
        <Text style={styles.baslik}>Kaydedilenler</Text>
      </View>
      {yukleniyor ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={RENKLER.vurgu} />
      ) : (
        <FlatList
          data={basliklar}
          keyExtractor={(b) => String(b.id)}
          contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 32 }}
          ListEmptyComponent={<Text style={styles.bos}>{hata || 'Kaydettiğin başlıklar burada görünür.'}</Text>}
          renderItem={({ item }) => <BaslikKarti baslik={item} islemler={islemler} />}
        />
      )}
    </View>
  );
}

function olusturStyles(RENKLER) {
  return StyleSheet.create({
    ustBar: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: RENKLER.ayrici },
    geriButon: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
    geriMetin: { fontSize: 32, lineHeight: 34, color: RENKLER.metin },
    baslik: { fontSize: 18, fontWeight: '900', color: RENKLER.metin },
    bos: { color: RENKLER.metinIkincil, textAlign: 'center', marginTop: 40 },
  });
}
