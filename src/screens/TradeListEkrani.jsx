import { useEffect, useState } from 'react';
import { View, Text, Image, Pressable, ActivityIndicator, FlatList, Linking, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api, getServerRootUrl } from '../services/api';
import { TELEGRAM_URL } from '../constants/contact';
import { useRenkler, useOrtakStil } from '../constants/theme';
import NeonParilti from '../components/NeonParilti';
import { useUyelikSatinAlma } from '../hooks/useUyelikSatinAlma';

export default function TradeListEkrani() {
  const RENKLER = useRenkler();
  const ORTAK_STIL = useOrtakStil();
  const styles = olusturStyles(RENKLER);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [trade, setTrade] = useState(null);
  const [loading, setLoading] = useState(true);
  const { urun, satinAl, satinAliniyor, satinAlimlariGeriYukle, geriYukleniyor, hata } = useUyelikSatinAlma();

  const tradeYenile = () => api.trade().then(setTrade).finally(() => setLoading(false));
  useEffect(() => { tradeYenile(); }, []);
  // Satın alma/geri yükleme VIP'i açtıysa listeyi tazele (trade.vip sunucudan tekrar sorulur).
  useEffect(() => { if (!satinAliniyor && !geriYukleniyor) tradeYenile(); }, [satinAliniyor, geriYukleniyor]);

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
        <Text style={styles.baslik}>Trade 📈</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={RENKLER.vurgu} />
      ) : (
        <FlatList
          data={trade?.vip ? trade.items : []}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          ListHeaderComponent={
            !trade?.vip ? (
              <View style={[ORTAK_STIL.kart, { alignItems: 'center', marginBottom: 16 }]}>
                <Text style={styles.kilitEmoji}>🔒</Text>
                <Text style={styles.teaserMetin}>{trade?.teaser}</Text>
                {Platform.OS === 'ios' ? (
                  <>
                    <Pressable
                      style={[styles.satinAlButon, satinAliniyor && { opacity: 0.6 }]}
                      onPress={satinAl}
                      disabled={satinAliniyor}
                    >
                      {satinAliniyor ? (
                        <ActivityIndicator color={RENKLER.bg} />
                      ) : (
                        <Text style={styles.satinAlMetin}>
                          Üyelik Satın Al{urun?.displayPrice ? ` (${urun.displayPrice}/ay)` : ' (399 ₺/ay)'}
                        </Text>
                      )}
                    </Pressable>
                    <Pressable onPress={satinAlimlariGeriYukle} disabled={geriYukleniyor} style={{ marginTop: 10 }}>
                      <Text style={styles.geriYukleMetin}>{geriYukleniyor ? 'Kontrol ediliyor…' : 'Satın Alımları Geri Yükle'}</Text>
                    </Pressable>
                    {hata ? <Text style={styles.hataMetin}>{hata}</Text> : null}
                  </>
                ) : null}
              </View>
            ) : null
          }
          ListEmptyComponent={
            trade?.vip ? <Text style={styles.bos}>Henüz trade kartı eklenmedi.</Text> : null
          }
          renderItem={({ item }) => (
            <Pressable onPress={() => router.push(`/trade/${item.id}`)} style={({ pressed }) => [ORTAK_STIL.kart, { marginBottom: 12, flexDirection: 'row', gap: 12 }, pressed && { opacity: 0.85 }]}>
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl.startsWith('http') ? item.imageUrl : `${getServerRootUrl()}${item.imageUrl}` }} style={styles.gorsel} resizeMode="cover" />
              ) : (
                <View style={[styles.gorsel, { backgroundColor: RENKLER.bg3, alignItems: 'center', justifyContent: 'center' }]}>
                  <Text style={{ fontSize: 22 }}>📈</Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.kartMetin} numberOfLines={3}>{item.body}</Text>
                <Text style={styles.tarih}>{new Date(item.createdAt).toLocaleString('tr-TR')}</Text>
              </View>
            </Pressable>
          )}
        />
      )}

      <Pressable style={styles.sabitButon} onPress={bilgiAl}>
        <Text style={styles.sabitButonMetin}>Trade Hakkında Bilgi Al ↗</Text>
      </Pressable>
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
  kilitEmoji: { fontSize: 36, marginBottom: 8 },
  teaserMetin: { fontSize: 13.5, color: RENKLER.metinIkincil, textAlign: 'center', lineHeight: 20 },
  satinAlButon: {
    marginTop: 14, backgroundColor: RENKLER.vurgu, borderRadius: 12, paddingVertical: 13, paddingHorizontal: 22,
    alignItems: 'center', justifyContent: 'center', minWidth: 220,
  },
  satinAlMetin: { color: RENKLER.bg, fontWeight: '800', fontSize: 14 },
  geriYukleMetin: { color: RENKLER.metinIkincil, fontSize: 12.5, fontWeight: '600', textDecorationLine: 'underline' },
  hataMetin: { color: RENKLER.hata, fontSize: 12, textAlign: 'center', marginTop: 10 },
  bos: { color: RENKLER.metinIkincil, textAlign: 'center', marginTop: 30 },
  gorsel: { width: 64, height: 64, borderRadius: 10 },
  kartMetin: { fontSize: 13.5, color: RENKLER.metin, lineHeight: 19 },
  tarih: { fontSize: 10.5, color: RENKLER.metinUcuncul, marginTop: 6 },
  sabitButon: { margin: 16, backgroundColor: RENKLER.basari, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  sabitButonMetin: { color: '#fff', fontWeight: '800', fontSize: 14.5 },
  });
}
