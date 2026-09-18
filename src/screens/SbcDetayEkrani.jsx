import { useEffect, useRef, useState } from 'react';
import { View, Text, FlatList, Image, Pressable, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform, Alert, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useRenkler, useOrtakStil } from '../constants/theme';
import { usePaylasAkisi } from '../hooks/usePaylasAkisi';
import PaylasButonu from '../components/share/PaylasButonu';
import PaylasAkisiModal from '../components/share/PaylasAkisiModal';
import PaylasimKarti from '../components/share/PaylasimKarti';
import NeonParilti from '../components/NeonParilti';

function zamanFormatla(iso) {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso.replace(' ', 'T') + 'Z').getTime();
  const dk = Math.floor(ms / 60000);
  if (dk < 1) return 'az önce';
  if (dk < 60) return `${dk} dk önce`;
  const saat = Math.floor(dk / 60);
  if (saat < 24) return `${saat} sa önce`;
  return `${Math.floor(saat / 24)} gün önce`;
}

export default function SbcDetayEkrani() {
  const RENKLER = useRenkler();
  const ORTAK_STIL = useOrtakStil();
  const styles = olusturStyles(RENKLER);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { id } = useLocalSearchParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [yorumlar, setYorumlar] = useState([]);
  const [yorumMetni, setYorumMetni] = useState('');
  const [yorumGonderiliyor, setYorumGonderiliyor] = useState(false);
  const sbcRef = useRef(null);
  const paylasAkisi = usePaylasAkisi({
    sbc: { baslik: 'SBC Kartı', ref: sbcRef },
  });

  const yorumlariGetir = () => {
    api.comments(id).then((data) => setYorumlar(data.comments)).catch(() => {});
  };

  useEffect(() => {
    let iptal = false;
    setLoading(true);
    api.contentItem(id)
      .then((data) => { if (!iptal) setItem(data.item); })
      .catch((err) => { if (!iptal) setError(err.message); })
      .finally(() => { if (!iptal) setLoading(false); });
    yorumlariGetir();
    return () => { iptal = true; };
  }, [id]);

  const yorumGonder = async () => {
    const body = yorumMetni.trim();
    if (!body) return;
    setYorumGonderiliyor(true);
    try {
      const data = await api.addComment(id, body);
      setYorumlar((onceki) => [data.comment, ...onceki]);
      setYorumMetni('');
    } catch (err) {
      Alert.alert('Hata', err.message || 'Yorum gönderilemedi');
    } finally {
      setYorumGonderiliyor(false);
    }
  };

  const yorumSil = (yorumId) => {
    Alert.alert('Yorumu sil', 'Bu yorumu silmek istediğine emin misin?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.deleteComment(yorumId);
            setYorumlar((onceki) => onceki.filter((y) => y.id !== yorumId));
          } catch (err) {
            Alert.alert('Hata', err.message || 'Yorum silinemedi');
          }
        },
      },
    ]);
  };

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
          <Text style={styles.baslik}>SBC</Text>
          <View style={{ width: 24 }} />
        </View>
        <Text style={styles.bos}>{error || 'İçerik bulunamadı.'}</Text>
      </View>
    );
  }

  const challenges = item.payload?.challenges || [];

  return (
    <KeyboardAvoidingView style={ORTAK_STIL.ekran} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={insets.top}>
      <NeonParilti />
      <View style={[styles.ustBar, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={styles.geriOk}>‹</Text>
        </Pressable>
        <Text style={styles.baslik} numberOfLines={1}>{item.title}</Text>
        <PaylasButonu onPress={paylasAkisi.ac} calisiyor={paylasAkisi.yukleniyor} />
      </View>
      <PaylasAkisiModal akis={paylasAkisi} />

      {/* Görünmez, ekran dışı — sadece "paylaş" tıklandığında görsel olarak yakalanır. */}
      <View style={{ position: 'absolute', left: -9999, top: 0 }} collapsable={false}>
        <View ref={sbcRef} collapsable={false}>
          <PaylasimKarti baslik="SBC" vurguRenk={RENKLER.vurgu}>
            <View style={{ alignItems: 'center' }}>
              {item.imageUrl ? <Image source={{ uri: item.imageUrl }} style={styles.paylasGorsel} resizeMode="contain" /> : null}
              <Text style={styles.paylasBaslik} numberOfLines={2}>{item.title}</Text>
              {item.payload?.description ? <Text style={styles.paylasAciklama}>{item.payload.description}</Text> : null}
            </View>

            <View style={styles.paylasIstatistikSatiri}>
              <PaylasIstatistik etiket="Kadro" deger={item.payload?.challengeCount ?? '-'} RENKLER={RENKLER} />
              <PaylasIstatistik etiket="Bitiş" deger={item.payload?.expires || '-'} RENKLER={RENKLER} />
              <PaylasIstatistik etiket="Tekrar" deger={item.payload?.repeatable || '-'} RENKLER={RENKLER} />
              <PaylasIstatistik etiket="Yenilenme" deger={item.payload?.refreshesEvery || '-'} RENKLER={RENKLER} />
            </View>

            {(item.payload?.priceCoins || item.payload?.totalCoinsCost) ? (
              <View style={styles.paylasFiyatSatiri}>
                {item.payload?.priceCoins ? (
                  <View style={styles.paylasFiyatKutu}>
                    <Text style={styles.paylasFiyatEtiket}>LİSTE FİYATI</Text>
                    <Text style={[styles.paylasFiyatDeger, { color: RENKLER.vurgu }]}>{item.payload.priceCoins.toLocaleString('tr-TR')} points</Text>
                  </View>
                ) : null}
                {item.payload?.totalCoinsCost ? (
                  <View style={styles.paylasFiyatKutu}>
                    <Text style={styles.paylasFiyatEtiket}>ŞARTLAR TOPLAMI</Text>
                    <Text style={[styles.paylasFiyatDeger, { color: RENKLER.vurgu }]}>{item.payload.totalCoinsCost.toLocaleString('tr-TR')} points</Text>
                  </View>
                ) : null}
              </View>
            ) : null}

            {challenges.length > 0 ? (
              <View style={{ marginTop: 18, gap: 10 }}>
                {challenges.map((c, i) => (
                  <View key={i} style={styles.paylasKadroKart}>
                    <View style={styles.paylasKadroBaslikSatiri}>
                      <Text style={styles.paylasKadroBaslik}>{c.title || `Kadro ${i + 1}`}</Text>
                      {c.costCoins ? <Text style={[styles.paylasKadroMaliyet, { color: RENKLER.vurgu }]}>{c.costCoins.toLocaleString('tr-TR')} points</Text> : null}
                    </View>
                    {(c.requirements || []).map((req, j) => (
                      <Text key={j} style={styles.paylasSartMetin}>• {req}</Text>
                    ))}
                  </View>
                ))}
              </View>
            ) : null}
          </PaylasimKarti>
        </View>
      </View>

      <FlatList
        data={challenges}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        ListHeaderComponent={
          <View style={{ marginBottom: 16, alignItems: 'center' }}>
            {item.imageUrl ? (
              <Image source={{ uri: item.imageUrl }} style={styles.detayGorsel} resizeMode="contain" />
            ) : null}
            {item.payload?.isNew ? <Text style={styles.yeniEtiket}>YENİ</Text> : null}
            {item.payload?.description ? (
              <Text style={styles.detayAciklama}>{item.payload.description}</Text>
            ) : null}

            <View style={styles.istatistikSatiri}>
              <Istatistik etiket="Kadro" deger={item.payload?.challengeCount ?? '-'} />
              <Istatistik etiket="Bitiş" deger={item.payload?.expires || '-'} />
              <Istatistik etiket="Tekrar" deger={item.payload?.repeatable || '-'} />
              <Istatistik etiket="Yenilenme" deger={item.payload?.refreshesEvery || '-'} />
            </View>

            {(item.payload?.communityUpvotePct != null) ? (
              <View style={styles.oySatiri}>
                <View style={styles.oyBar}>
                  <View style={[styles.oyDoluBar, { width: `${item.payload.communityUpvotePct}%` }]} />
                </View>
                <Text style={styles.oyMetin}>👍 %{item.payload.communityUpvotePct} · 👎 %{item.payload.communityDownvotePct}</Text>
              </View>
            ) : null}

            {item.payload?.priceCoins ? (
              <View style={styles.toplamMaliyetKutu}>
                <Text style={styles.toplamMaliyetEtiket}>Liste Fiyatı</Text>
                <Text style={styles.toplamMaliyetDeger}>{item.payload.priceCoins.toLocaleString('tr-TR')} points</Text>
              </View>
            ) : null}
            {item.payload?.totalCoinsCost ? (
              <View style={[styles.toplamMaliyetKutu, { marginTop: 8 }]}>
                <Text style={styles.toplamMaliyetEtiket}>Kadro Şartlarının Toplamı</Text>
                <Text style={styles.toplamMaliyetDeger}>{item.payload.totalCoinsCost.toLocaleString('tr-TR')} points</Text>
              </View>
            ) : null}

            {item.payload?.rewardPlayerFuttgId ? (
              <Pressable
                onPress={() => router.push({
                  pathname: `/oyuncular/${item.payload.rewardPlayerFuttgId}`,
                  params: item.payload.rewardPlayerSourceUrl ? { src: item.payload.rewardPlayerSourceUrl } : {},
                })}
                style={({ pressed }) => [styles.oyuncuKartiButon, pressed && { opacity: 0.85 }]}
              >
                <Text style={styles.oyuncuKartiMetin}>👤 Ödül Oyuncusunun Profilini Gör</Text>
                <Text style={styles.oyuncuKartiOk}>›</Text>
              </Pressable>
            ) : null}

          </View>
        }
        ListEmptyComponent={
          <Text style={styles.bos}>Bu SBC için şart detayı henüz alınamadı.</Text>
        }
        renderItem={({ item: c, index }) => (
          <View style={[ORTAK_STIL.kart, { marginBottom: 12 }]}>
            <View style={styles.kadroBaslikSatiri}>
              <Text style={styles.kadroBaslik}>{c.title || `Kadro ${index + 1}`}</Text>
              {c.costCoins ? <Text style={styles.kadroMaliyet}>{c.costCoins.toLocaleString('tr-TR')} points</Text> : null}
            </View>
            {(c.requirements || []).map((req, i) => (
              <View key={i} style={styles.sartSatiri}>
                <Text style={styles.sartNokta}>•</Text>
                <Text style={styles.sartMetin}>{req}</Text>
              </View>
            ))}
          </View>
        )}
        ListFooterComponent={
          <View style={{ marginTop: 8 }}>
            <Text style={styles.yorumBaslik}>Yorumlar 💬 {yorumlar.length > 0 ? `(${yorumlar.length})` : ''}</Text>
            <View style={styles.yorumYazmaKutusu}>
              <TextInput
                style={styles.yorumInput}
                placeholder="Bu SBC hakkında ne düşünüyorsun?"
                placeholderTextColor={RENKLER.metinUcuncul}
                value={yorumMetni}
                onChangeText={setYorumMetni}
                multiline
                maxLength={500}
              />
              <Pressable onPress={yorumGonder} disabled={yorumGonderiliyor || !yorumMetni.trim()} style={[styles.yorumGonderButon, (!yorumMetni.trim() || yorumGonderiliyor) && { opacity: 0.5 }]}>
                {yorumGonderiliyor ? <ActivityIndicator size="small" color={RENKLER.bg} /> : <Text style={styles.yorumGonderMetin}>Gönder</Text>}
              </Pressable>
            </View>

            {yorumlar.length === 0 ? (
              <Text style={styles.yorumBos}>Henüz yorum yok. İlk yorumu sen yaz!</Text>
            ) : (
              yorumlar.map((y) => (
                <View key={y.id} style={styles.yorumKarti}>
                  <View style={styles.yorumUstSatir}>
                    <Text style={styles.yorumYazar}>{y.authorName}</Text>
                    <Text style={styles.yorumZaman}>{zamanFormatla(y.createdAt)}</Text>
                  </View>
                  <Text style={styles.yorumMetinGovde}>{y.body}</Text>
                  {(y.userId === user?.id || user?.isAdmin) ? (
                    <Pressable onPress={() => yorumSil(y.id)} style={{ alignSelf: 'flex-end', marginTop: 4 }}>
                      <Text style={styles.yorumSilMetin}>Sil</Text>
                    </Pressable>
                  ) : null}
                </View>
              ))
            )}
          </View>
        }
      />
    </KeyboardAvoidingView>
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

function PaylasIstatistik({ etiket, deger, RENKLER }) {
  const styles = olusturStyles(RENKLER);
  return (
    <View style={styles.paylasIstatistikKutu}>
      <Text style={styles.paylasIstatistikEtiket}>{etiket}</Text>
      <Text style={styles.paylasIstatistikDeger} numberOfLines={1}>{String(deger)}</Text>
    </View>
  );
}

function olusturStyles(RENKLER) {
  return StyleSheet.create({
  ustBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 12,
  },
  geriOk: { fontSize: 28, color: RENKLER.metin, fontWeight: '300', width: 24 },
  baslik: { fontSize: 18, fontWeight: '800', color: RENKLER.metin, flex: 1, textAlign: 'center' },
  bos: { color: RENKLER.metinIkincil, textAlign: 'center', marginTop: 40, paddingHorizontal: 24 },
  detayGorsel: { width: 120, height: 120 },
  detayAciklama: { fontSize: 13, color: RENKLER.metinIkincil, textAlign: 'center', marginTop: 10, paddingHorizontal: 12 },
  toplamMaliyetKutu: { marginTop: 14, alignItems: 'center', backgroundColor: RENKLER.bg2, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 20, borderWidth: 1, borderColor: RENKLER.ayrici },
  toplamMaliyetEtiket: { fontSize: 10, color: RENKLER.metinUcuncul, textTransform: 'uppercase', letterSpacing: 0.5 },
  toplamMaliyetDeger: { fontSize: 18, color: RENKLER.uyari, fontWeight: '800', marginTop: 2 },
  kadroBaslikSatiri: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  kadroBaslik: { fontSize: 15, fontWeight: '700', color: RENKLER.metin, flex: 1 },
  kadroMaliyet: { fontSize: 12.5, color: RENKLER.uyari, fontWeight: '700' },
  sartSatiri: { flexDirection: 'row', gap: 6, marginTop: 3 },
  sartNokta: { color: RENKLER.vurgu, fontSize: 13 },
  sartMetin: { color: RENKLER.metinIkincil, fontSize: 12.5, flex: 1 },
  yeniEtiket: { fontSize: 10, fontWeight: '800', color: RENKLER.bg, backgroundColor: RENKLER.vurgu, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5, marginTop: 8 },
  istatistikSatiri: { flexDirection: 'row', gap: 8, marginTop: 14, width: '100%' },
  istatistikKutu: { flex: 1, backgroundColor: RENKLER.bg3, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  istatistikEtiket: { fontSize: 9, fontWeight: '700', color: RENKLER.metinUcuncul, textTransform: 'uppercase' },
  istatistikDeger: { fontSize: 12.5, fontWeight: '700', color: RENKLER.metin, marginTop: 2 },
  oySatiri: { marginTop: 12, width: '100%', gap: 5 },
  oyBar: { height: 5, borderRadius: 3, backgroundColor: RENKLER.hata, overflow: 'hidden' },
  oyDoluBar: { height: 5, backgroundColor: RENKLER.basari },
  oyMetin: { fontSize: 11, color: RENKLER.metinUcuncul, textAlign: 'center' },
  kaynakLink: { fontSize: 11.5, color: RENKLER.vurgu2, marginTop: 12, fontWeight: '600' },
  oyuncuKartiButon: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 14,
    backgroundColor: RENKLER.vurgu, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 20, width: '100%',
  },
  oyuncuKartiMetin: { color: RENKLER.bg, fontWeight: '800', fontSize: 13 },
  oyuncuKartiOk: { color: RENKLER.bg, fontSize: 18, fontWeight: '300' },
  yorumBaslik: { fontSize: 16, fontWeight: '800', color: RENKLER.metin, marginBottom: 10 },
  yorumYazmaKutusu: { flexDirection: 'row', gap: 8, alignItems: 'flex-end', marginBottom: 16 },
  yorumInput: {
    flex: 1, backgroundColor: RENKLER.bg2, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
    color: RENKLER.metin, borderWidth: 1, borderColor: RENKLER.ayrici, maxHeight: 100, fontSize: 13.5,
  },
  yorumGonderButon: { backgroundColor: RENKLER.vurgu, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12 },
  yorumGonderMetin: { color: RENKLER.bg, fontWeight: '800', fontSize: 13 },
  yorumBos: { color: RENKLER.metinIkincil, textAlign: 'center', fontSize: 12.5, marginTop: 8 },
  yorumKarti: { backgroundColor: RENKLER.bg2, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: RENKLER.ayrici, marginBottom: 10 },
  yorumUstSatir: { flexDirection: 'row', justifyContent: 'space-between' },
  yorumYazar: { fontSize: 12.5, fontWeight: '700', color: RENKLER.vurgu2 },
  yorumZaman: { fontSize: 11, color: RENKLER.metinUcuncul },
  yorumMetinGovde: { fontSize: 13, color: RENKLER.metin, marginTop: 4 },
  yorumSilMetin: { fontSize: 11, color: RENKLER.hata, fontWeight: '700' },
  paylasGorsel: { width: 130, height: 130, marginTop: 18 },
  paylasBaslik: { fontSize: 19, fontWeight: '900', color: RENKLER.metin, textAlign: 'center', marginTop: 10 },
  paylasAciklama: { fontSize: 12, color: RENKLER.metinIkincil, textAlign: 'center', marginTop: 6, paddingHorizontal: 8 },
  paylasIstatistikSatiri: { flexDirection: 'row', gap: 8, marginTop: 18 },
  paylasIstatistikKutu: { flex: 1, backgroundColor: RENKLER.bg2, borderRadius: 10, paddingVertical: 9, alignItems: 'center' },
  paylasIstatistikEtiket: { fontSize: 8.5, fontWeight: '700', color: RENKLER.metinUcuncul, textTransform: 'uppercase' },
  paylasIstatistikDeger: { fontSize: 12, fontWeight: '800', color: RENKLER.metin, marginTop: 2 },
  paylasFiyatSatiri: { flexDirection: 'row', gap: 8, marginTop: 12 },
  paylasFiyatKutu: { flex: 1, backgroundColor: RENKLER.bg2, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  paylasFiyatEtiket: { fontSize: 9, fontWeight: '800', color: RENKLER.metinUcuncul, letterSpacing: 0.5 },
  paylasFiyatDeger: { fontSize: 15, fontWeight: '900', marginTop: 3 },
  paylasKadroKart: { backgroundColor: RENKLER.bg2, borderRadius: 12, padding: 12 },
  paylasKadroBaslikSatiri: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  paylasKadroBaslik: { fontSize: 13, fontWeight: '800', color: RENKLER.metin, flex: 1 },
  paylasKadroMaliyet: { fontSize: 11.5, fontWeight: '800' },
  paylasSartMetin: { fontSize: 11, color: RENKLER.metinIkincil, marginTop: 2, lineHeight: 15 },
  });
}
