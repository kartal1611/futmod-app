import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, FlatList, Image, TextInput, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore';
import { useModerationStore } from '../store/moderationStore';
import { icerikMenusuAc } from '../components/moderation/moderasyonYardimci';
import NeonParilti from '../components/NeonParilti';
import { usePaylasAkisi } from '../hooks/usePaylasAkisi';
import PaylasButonu from '../components/share/PaylasButonu';
import PaylasAkisiModal from '../components/share/PaylasAkisiModal';
import PaylasimKarti from '../components/share/PaylasimKarti';
import { api } from '../services/api';
import { useRenkler, useOrtakStil } from '../constants/theme';
import { kategoriAdi, tamGorselUrl, zamanFormatla } from '../constants/forum';

export default function ForumBaslikEkrani() {
  const RENKLER = useRenkler();
  const ORTAK_STIL = useOrtakStil();
  const styles = olusturStyles(RENKLER);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuthStore();
  const blockedIds = useModerationStore((s) => s.blockedIds);
  const [baslik, setBaslik] = useState(null);
  const [yorumlar, setYorumlar] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState(null);
  const [metin, setMetin] = useState('');
  const [yanitlanan, setYanitlanan] = useState(null);
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const kartRef = useRef(null);
  const girdiRef = useRef(null);
  const paylasAkisi = usePaylasAkisi({
    baslik: { baslik: 'Başlık', ref: kartRef },
  });

  const yukle = useCallback(async () => {
    try {
      const data = await api.forumThread(id);
      setBaslik(data.item);
      setYorumlar(data.comments || []);
      setHata(null);
    } catch (err) {
      setHata(err.message || 'Başlık yüklenemedi');
    }
  }, [id]);

  useEffect(() => {
    yukle().finally(() => setYukleniyor(false));
  }, [yukle]);

  // Bildirimden soğuk açılışta geri gidilecek ekran olmayabilir.
  const geri = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/forum');
  };

  const oyla = async () => {
    try {
      const data = await api.forumVote(baslik.id);
      setBaslik(data.item);
    } catch (err) {
      Alert.alert('Hata', err.message || 'Oy verilemedi');
    }
  };

  const takipDegistir = async () => {
    try {
      const data = await api.forumFollow(baslik.id, !baslik.following);
      setBaslik(data.item);
    } catch (err) {
      Alert.alert('Hata', err.message || 'Takip güncellenemedi');
    }
  };

  const gonder = async () => {
    const body = metin.trim();
    if (!body || gonderiliyor) return;
    setGonderiliyor(true);
    try {
      await api.forumAddComment(baslik.id, { body, ...(yanitlanan ? { parentId: yanitlanan.id } : {}) });
      setMetin('');
      setYanitlanan(null);
      await yukle();
    } catch (err) {
      Alert.alert('Hata', err.message || 'Yorum gönderilemedi');
    } finally {
      setGonderiliyor(false);
    }
  };

  const baslikSil = () => {
    Alert.alert('Başlığı Sil', 'Bu başlık ve tüm yorumları silinecek. Emin misin?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil', style: 'destructive', onPress: async () => {
          try {
            await api.forumDeleteThread(baslik.id);
            geri();
          } catch (err) {
            Alert.alert('Hata', err.message || 'Silinemedi');
          }
        },
      },
    ]);
  };

  const yorumSil = (yorum) => {
    Alert.alert('Yorumu Sil', 'Bu yorumu ve yanıtlarını silmek istediğine emin misin?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil', style: 'destructive', onPress: async () => {
          try {
            await api.forumDeleteComment(yorum.id);
            await yukle();
          } catch (err) {
            Alert.alert('Hata', err.message || 'Silinemedi');
          }
        },
      },
    ]);
  };

  const baslikMenusu = () => {
    if (baslik.userId === user?.id || user?.isAdmin) { baslikSil(); return; }
    icerikMenusuAc({
      hedefUserId: baslik.userId,
      hedefAd: baslik.authorName,
      contentType: 'forum_thread',
      contentId: baslik.id,
      benimUserId: user?.id,
      afterBlock: geri,
    });
  };

  const yorumMenusu = (yorum) => {
    if (yorum.userId === user?.id || user?.isAdmin) { yorumSil(yorum); return; }
    icerikMenusuAc({
      hedefUserId: yorum.userId,
      hedefAd: yorum.authorName,
      contentType: 'forum_comment',
      contentId: yorum.id,
      benimUserId: user?.id,
      afterBlock: yukle,
    });
  };

  const yanitla = (yorum) => {
    setYanitlanan(yorum);
    girdiRef.current?.focus();
  };

  if (yukleniyor || !baslik) {
    return (
      <View style={ORTAK_STIL.ekran}>
        <NeonParilti />
        <View style={[styles.ustBar, { paddingTop: insets.top + 8 }]}>
          <Pressable onPress={geri} hitSlop={10} style={styles.geriButon} accessibilityRole="button" accessibilityLabel="Geri">
            <Text style={styles.geriMetin}>‹</Text>
          </Pressable>
        </View>
        {yukleniyor ? <ActivityIndicator style={{ marginTop: 40 }} color={RENKLER.vurgu} /> : <Text style={styles.bos}>{hata}</Text>}
      </View>
    );
  }

  const gorunenYorumlar = yorumlar.filter((y) => !blockedIds.includes(y.userId));

  return (
    <KeyboardAvoidingView style={ORTAK_STIL.ekran} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <NeonParilti />
      <View style={[styles.ustBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={geri} hitSlop={10} style={styles.geriButon} accessibilityRole="button" accessibilityLabel="Geri">
          <Text style={styles.geriMetin}>‹</Text>
        </Pressable>
        <Text style={styles.ustKategori}>{kategoriAdi(baslik.category)}</Text>
        <PaylasButonu onPress={paylasAkisi.ac} calisiyor={paylasAkisi.yukleniyor} />
        <Pressable onPress={takipDegistir} style={[styles.takipButon, baslik.following && { borderColor: RENKLER.vurgu }]}>
          <Text style={[styles.takipMetin, baslik.following && { color: RENKLER.vurgu }]}>{baslik.following ? 'Takipte' : 'Takip Et'}</Text>
        </Pressable>
      </View>
      <PaylasAkisiModal akis={paylasAkisi} />

      {/* Görünmez, ekran dışı — sadece paylaşırken görsel olarak yakalanır. */}
      <View style={{ position: 'absolute', left: -9999, top: 0 }} collapsable={false}>
        <View ref={kartRef} collapsable={false}>
          <PaylasimKarti baslik={kategoriAdi(baslik.category)} vurguRenk={RENKLER.vurgu}>
            <Text style={styles.paylasBaslik}>{baslik.title}</Text>
            {baslik.body ? <Text style={styles.paylasMetin} numberOfLines={6}>{baslik.body}</Text> : null}
            <Text style={styles.paylasAlt}>▲ {baslik.voteCount} · 💬 {baslik.commentCount} · {baslik.authorName}</Text>
          </PaylasimKarti>
        </View>
      </View>

      <FlatList
        data={gorunenYorumlar}
        keyExtractor={(y) => String(y.id)}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: 16 }}
        ListHeaderComponent={(
          <View style={{ marginBottom: 8 }}>
            <Text style={styles.baslikMetin}>{baslik.title}</Text>
            <Text style={[styles.yazar, baslik.isAdmin && { color: RENKLER.uyari }]}>
              {baslik.isAdmin ? '🛡️ ' : ''}{baslik.authorName} · {zamanFormatla(baslik.createdAt)}
            </Text>
            {baslik.body ? <Text style={styles.govde}>{baslik.body}</Text> : null}
            {baslik.imageUrl ? <Image source={{ uri: tamGorselUrl(baslik.imageUrl) }} style={styles.gorsel} resizeMode="contain" /> : null}
            <View style={styles.eylemSatiri}>
              <Pressable onPress={oyla} style={[styles.eylemButon, baslik.voted && { borderColor: RENKLER.vurgu }]}>
                <Text style={[styles.eylemMetin, baslik.voted && { color: RENKLER.vurgu }]}>▲ {baslik.voteCount}</Text>
              </Pressable>
              <Pressable onPress={baslikMenusu} style={styles.eylemButon}>
                <Text style={styles.eylemMetin}>{baslik.userId === user?.id || user?.isAdmin ? 'Sil' : 'Şikayet / Engelle'}</Text>
              </Pressable>
            </View>
            <Text style={styles.yorumBaslik}>Yorumlar ({baslik.commentCount})</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.bos}>Henüz yorum yok. İlk yorumu sen yaz!</Text>}
        renderItem={({ item: y }) => (
          <Pressable onLongPress={() => yorumMenusu(y)} style={[styles.yorumKutu, y.parentId && styles.yanitKutu]}>
            <View style={styles.yorumUstSatir}>
              <Text style={[styles.yorumYazar, y.isAdmin && { color: RENKLER.uyari }]} numberOfLines={1}>{y.isAdmin ? '🛡️ ' : ''}{y.authorName}</Text>
              <Text style={styles.yorumZaman}>{zamanFormatla(y.createdAt)}</Text>
            </View>
            <Text style={styles.yorumMetin}>{y.body}</Text>
            <View style={styles.yorumEylemler}>
              <Pressable onPress={() => yanitla(y)} hitSlop={10}>
                <Text style={[styles.yorumEylem, { color: RENKLER.vurgu }]}>Yanıtla</Text>
              </Pressable>
              {y.userId !== user?.id || user?.isAdmin ? (
                <Pressable onPress={() => yorumMenusu(y)} hitSlop={10}>
                  <Text style={styles.yorumEylem}>{user?.isAdmin ? 'Sil' : 'Şikayet / Engelle'}</Text>
                </Pressable>
              ) : (
                <Pressable onPress={() => yorumSil(y)} hitSlop={10}>
                  <Text style={styles.yorumEylem}>Sil</Text>
                </Pressable>
              )}
            </View>
          </Pressable>
        )}
      />

      <View style={styles.girdiAlani}>
        {yanitlanan ? (
          <View style={styles.yanitSatiri}>
            <Text style={styles.yanitMetin} numberOfLines={1}>{yanitlanan.authorName} kullanıcısına yanıt</Text>
            <Pressable onPress={() => setYanitlanan(null)} hitSlop={10}>
              <Text style={[styles.yanitIptal, { color: RENKLER.vurgu2 }]}>Vazgeç</Text>
            </Pressable>
          </View>
        ) : null}
        <View style={styles.girdiSatiri}>
          <TextInput
            ref={girdiRef}
            style={styles.girdi}
            placeholder="Yorumunu yaz..."
            placeholderTextColor={RENKLER.metinUcuncul}
            value={metin}
            onChangeText={setMetin}
            maxLength={1000}
            multiline
          />
          <Pressable onPress={gonder} disabled={gonderiliyor || !metin.trim()} style={[styles.gonderButon, (!metin.trim() || gonderiliyor) && { opacity: 0.5 }]}>
            {gonderiliyor ? <ActivityIndicator size="small" color={RENKLER.bg} /> : <Text style={styles.gonderMetin}>Gönder</Text>}
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function olusturStyles(RENKLER) {
  return StyleSheet.create({
    ustBar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: RENKLER.ayrici },
    geriButon: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
    geriMetin: { fontSize: 32, lineHeight: 34, color: RENKLER.metin },
    ustKategori: { flex: 1, fontSize: 13, fontWeight: '700', color: RENKLER.vurgu2 },
    takipButon: { borderRadius: 10, borderWidth: 1, borderColor: RENKLER.ayrici, paddingHorizontal: 12, paddingVertical: 8 },
    takipMetin: { fontSize: 12.5, fontWeight: '700', color: RENKLER.metin },
    bos: { color: RENKLER.metinIkincil, textAlign: 'center', marginTop: 24 },
    baslikMetin: { fontSize: 21, fontWeight: '900', color: RENKLER.metin, lineHeight: 26 },
    yazar: { fontSize: 12, color: RENKLER.metinIkincil, marginTop: 6 },
    govde: { fontSize: 14.5, color: RENKLER.metin, lineHeight: 21, marginTop: 12 },
    gorsel: { width: '100%', height: 260, borderRadius: 12, marginTop: 12, backgroundColor: RENKLER.bg3 },
    eylemSatiri: { flexDirection: 'row', gap: 8, marginTop: 14 },
    eylemButon: { borderRadius: 11, borderWidth: 1, borderColor: RENKLER.ayrici, backgroundColor: RENKLER.bg2, paddingHorizontal: 14, paddingVertical: 11 },
    eylemMetin: { fontSize: 13, fontWeight: '700', color: RENKLER.metin },
    yorumBaslik: { fontSize: 14, fontWeight: '800', color: RENKLER.metin, marginTop: 20 },
    yorumKutu: { backgroundColor: RENKLER.bg2, borderRadius: 12, borderWidth: 1, borderColor: RENKLER.ayrici, padding: 11 },
    yanitKutu: { marginLeft: 22 },
    yorumUstSatir: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
    yorumYazar: { flex: 1, fontSize: 12, fontWeight: '800', color: RENKLER.vurgu2 },
    yorumZaman: { fontSize: 10.5, color: RENKLER.metinUcuncul },
    yorumMetin: { fontSize: 13.5, color: RENKLER.metin, lineHeight: 19, marginTop: 4 },
    yorumEylemler: { flexDirection: 'row', gap: 18, marginTop: 8 },
    yorumEylem: { fontSize: 12, fontWeight: '700', color: RENKLER.metinIkincil },
    girdiAlani: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 10, borderTopWidth: 1, borderTopColor: RENKLER.ayrici, backgroundColor: RENKLER.bg },
    yanitSatiri: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, paddingBottom: 6 },
    yanitMetin: { flex: 1, fontSize: 12, color: RENKLER.metinIkincil },
    yanitIptal: { fontSize: 12, fontWeight: '700' },
    girdiSatiri: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
    girdi: {
      flex: 1, backgroundColor: RENKLER.bg2, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10,
      color: RENKLER.metin, fontSize: 13.5, maxHeight: 100, borderWidth: 1, borderColor: RENKLER.ayrici,
    },
    gonderButon: { backgroundColor: RENKLER.vurgu, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, minWidth: 74, alignItems: 'center' },
    gonderMetin: { color: RENKLER.bg, fontWeight: '800', fontSize: 12.5 },
    paylasBaslik: { fontSize: 20, fontWeight: '900', color: RENKLER.metin, lineHeight: 25 },
    paylasMetin: { fontSize: 13.5, color: RENKLER.metinIkincil, lineHeight: 19, marginTop: 8 },
    paylasAlt: { fontSize: 12, fontWeight: '700', color: RENKLER.metinIkincil, marginTop: 12 },
  });
}
