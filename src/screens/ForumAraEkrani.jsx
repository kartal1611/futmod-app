import { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBaslikIslemleri } from '../hooks/useBaslikIslemleri';
import BaslikKarti from '../components/forum/BaslikKarti';
import NeonParilti from '../components/NeonParilti';
import { api } from '../services/api';
import { useRenkler, useOrtakStil } from '../constants/theme';

const MIN_ARAMA = 2;
const BEKLEME_MS = 350;

export default function ForumAraEkrani() {
  const RENKLER = useRenkler();
  const ORTAK_STIL = useOrtakStil();
  const styles = olusturStyles(RENKLER);
  const insets = useSafeAreaInsets();
  const [metin, setMetin] = useState('');
  const [sonuclar, setSonuclar] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState(null);
  const istekNo = useRef(0);
  const islemler = useBaslikIslemleri(setSonuclar);
  const aranan = metin.trim();

  useEffect(() => {
    const no = ++istekNo.current;
    if (aranan.length < MIN_ARAMA) {
      setSonuclar([]);
      setYukleniyor(false);
      setHata(null);
      return undefined;
    }
    setYukleniyor(true);
    const zamanlayici = setTimeout(async () => {
      try {
        const data = await api.forumThreads({ q: aranan, sort: 'new', limit: 50 });
        if (no !== istekNo.current) return;
        setSonuclar(data.items || []);
        setHata(null);
      } catch (err) {
        if (no === istekNo.current) setHata(err.message || 'Arama yapılamadı');
      } finally {
        if (no === istekNo.current) setYukleniyor(false);
      }
    }, BEKLEME_MS);
    return () => clearTimeout(zamanlayici);
  }, [aranan]);

  const bosMetin = hata || (aranan.length < MIN_ARAMA ? 'Başlık ve içeriklerde ara.' : 'Sonuç bulunamadı.');

  return (
    <View style={ORTAK_STIL.ekran}>
      <NeonParilti />
      <View style={[styles.ustBar, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.baslik}>Ara</Text>
        <TextInput
          style={styles.girdi}
          placeholder="Oyuncu, taktik, konu..."
          placeholderTextColor={RENKLER.metinUcuncul}
          value={metin}
          onChangeText={setMetin}
          autoCorrect={false}
          returnKeyType="search"
          accessibilityLabel="Forumda ara"
        />
      </View>
      {yukleniyor ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={RENKLER.vurgu} />
      ) : (
        <FlatList
          data={sonuclar}
          keyExtractor={(b) => String(b.id)}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 32 }}
          ListEmptyComponent={<Text style={styles.bos}>{bosMetin}</Text>}
          renderItem={({ item }) => <BaslikKarti baslik={item} islemler={islemler} />}
        />
      )}
    </View>
  );
}

function olusturStyles(RENKLER) {
  return StyleSheet.create({
    ustBar: { paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: RENKLER.ayrici },
    baslik: { fontSize: 24, fontWeight: '900', color: RENKLER.metin },
    girdi: {
      marginTop: 12, backgroundColor: RENKLER.bg2, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
      color: RENKLER.metin, fontSize: 14.5, borderWidth: 1, borderColor: RENKLER.ayrici,
    },
    bos: { color: RENKLER.metinIkincil, textAlign: 'center', marginTop: 40 },
  });
}
