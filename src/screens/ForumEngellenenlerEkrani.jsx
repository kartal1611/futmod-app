import { useCallback, useState } from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useModerationStore } from '../store/moderationStore';
import NeonParilti from '../components/NeonParilti';
import { api } from '../services/api';
import { useRenkler, useOrtakStil } from '../constants/theme';

export default function ForumEngellenenlerEkrani() {
  const RENKLER = useRenkler();
  const ORTAK_STIL = useOrtakStil();
  const styles = olusturStyles(RENKLER);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const yenileStore = useModerationStore((s) => s.load);
  const [liste, setListe] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState(null);

  useFocusEffect(useCallback(() => {
    api.blockedUsers()
      .then((data) => { setListe(data.users || []); setHata(null); })
      .catch((err) => setHata(err.message || 'Liste yüklenemedi'))
      .finally(() => setYukleniyor(false));
  }, []));

  const kaldir = (kisi) => {
    Alert.alert('Engeli Kaldır', `${kisi.name} kullanıcısının engelini kaldırmak istiyor musun?`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Kaldır', onPress: async () => {
          try {
            await api.unblockUser(kisi.id);
            setListe((prev) => prev.filter((k) => k.id !== kisi.id));
            yenileStore();
          } catch (err) {
            Alert.alert('Hata', err.message || 'Engel kaldırılamadı');
          }
        },
      },
    ]);
  };

  return (
    <View style={ORTAK_STIL.ekran}>
      <NeonParilti />
      <View style={[styles.ustBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.geriButon} accessibilityRole="button" accessibilityLabel="Geri">
          <Text style={styles.geriMetin}>‹</Text>
        </Pressable>
        <Text style={styles.baslik}>Engellenenler</Text>
      </View>
      {yukleniyor ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={RENKLER.vurgu} />
      ) : (
        <FlatList
          data={liste}
          keyExtractor={(k) => String(k.id)}
          contentContainerStyle={{ padding: 16, gap: 8 }}
          ListEmptyComponent={<Text style={styles.bos}>{hata || 'Engellediğin kimse yok.'}</Text>}
          renderItem={({ item }) => (
            <View style={styles.satir}>
              <Text style={styles.ad} numberOfLines={1}>{item.name}</Text>
              <Pressable onPress={() => kaldir(item)} style={styles.kaldirButon}>
                <Text style={[styles.kaldirMetin, { color: RENKLER.vurgu }]}>Engeli kaldır</Text>
              </Pressable>
            </View>
          )}
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
    satir: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: RENKLER.bg2, borderRadius: 12, borderWidth: 1, borderColor: RENKLER.ayrici, paddingHorizontal: 12, minHeight: 54 },
    ad: { flex: 1, fontSize: 14, fontWeight: '700', color: RENKLER.metin },
    kaldirButon: { paddingVertical: 10 },
    kaldirMetin: { fontSize: 12.5, fontWeight: '700' },
  });
}
