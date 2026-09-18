import { useEffect, useState } from 'react';
import { View, Text, Image, Pressable, ActivityIndicator, ScrollView, Linking, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api, getServerRootUrl } from '../services/api';
import { TELEGRAM_URL } from '../constants/contact';
import { useRenkler, useOrtakStil } from '../constants/theme';
import NeonParilti from '../components/NeonParilti';

export default function TradeDetayEkrani() {
  const RENKLER = useRenkler();
  const ORTAK_STIL = useOrtakStil();
  const styles = olusturStyles(RENKLER);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();
  const [item, setItem] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.tradeItem(id)
      .then((data) => setItem(data.item))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const bilgiAl = () => {
    const mesaj = encodeURIComponent('Trade hakkında bilgi almak istiyorum');
    Linking.openURL(`${TELEGRAM_URL}?text=${mesaj}`);
  };

  return (
    <View style={ORTAK_STIL.ekran}>
      <NeonParilti />
      <View style={[styles.ustBar, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={styles.geriOk}>‹</Text>
        </Pressable>
        <Text style={styles.baslik}>Trade Kartı</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={RENKLER.vurgu} />
      ) : error || !item ? (
        <Text style={styles.bos}>{error || 'Bu kart artık mevcut değil.'}</Text>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          {item.imageUrl ? (
            <Image
              source={{ uri: item.imageUrl.startsWith('http') ? item.imageUrl : `${getServerRootUrl()}${item.imageUrl}` }}
              style={styles.gorsel}
              resizeMode="contain"
            />
          ) : null}
          <View style={[ORTAK_STIL.kart, { marginTop: 16 }]}>
            <Text style={styles.metin}>{item.body}</Text>
            <Text style={styles.tarih}>{new Date(item.createdAt).toLocaleString('tr-TR')}</Text>
          </View>
          <Pressable style={[ORTAK_STIL.buyukButon, { marginTop: 20, backgroundColor: RENKLER.basari }]} onPress={bilgiAl}>
            <Text style={styles.butonMetin}>Bu Kart Hakkında Bilgi Al ↗</Text>
          </Pressable>
        </ScrollView>
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
  bos: { color: RENKLER.metinIkincil, textAlign: 'center', marginTop: 40, paddingHorizontal: 24 },
  gorsel: { width: '100%', height: 240, borderRadius: 16, backgroundColor: RENKLER.bg3 },
  metin: { fontSize: 14.5, color: RENKLER.metin, lineHeight: 21 },
  tarih: { fontSize: 11, color: RENKLER.metinUcuncul, marginTop: 12 },
  butonMetin: { color: '#fff', fontWeight: '800', fontSize: 15 },
  });
}
