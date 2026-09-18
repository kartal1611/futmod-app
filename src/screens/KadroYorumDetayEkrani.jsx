import { useEffect, useState } from 'react';
import { View, Text, Image, FlatList, Pressable, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform, Alert, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api, getServerRootUrl } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useRenkler, useOrtakStil } from '../constants/theme';

function tamGorselUrl(url) {
  if (!url) return null;
  return url.startsWith('http') ? url : `${getServerRootUrl()}${url}`;
}

function zamanFormatla(iso) {
  if (!iso) return '';
  const d = new Date(iso.replace(' ', 'T') + 'Z');
  return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' });
}

export default function KadroYorumDetayEkrani() {
  const RENKLER = useRenkler();
  const ORTAK_STIL = useOrtakStil();
  const styles = olusturStyles(RENKLER);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();
  const { user } = useAuthStore();
  const [post, setPost] = useState(null);
  const [yorumlar, setYorumlar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [metin, setMetin] = useState('');
  const [gonderiliyor, setGonderiliyor] = useState(false);

  useEffect(() => {
    let iptal = false;
    setLoading(true);
    api.kadroPostItem(id)
      .then((data) => { if (!iptal) { setPost(data.item); setYorumlar(data.comments || []); } })
      .catch((err) => { if (!iptal) setError(err.message); })
      .finally(() => { if (!iptal) setLoading(false); });
    return () => { iptal = true; };
  }, [id]);

  const yorumGonder = async () => {
    const body = metin.trim();
    if (!body || gonderiliyor) return;
    setGonderiliyor(true);
    try {
      const data = await api.kadroAddComment(id, body);
      setYorumlar((prev) => [...prev, data.item]);
      setMetin('');
    } catch (err) {
      Alert.alert('Hata', err.message || 'Yorum gönderilemedi');
    } finally {
      setGonderiliyor(false);
    }
  };

  const yorumSil = (yorumId) => {
    Alert.alert('Yorumu Sil', 'Bu yorumu silmek istediğine emin misin?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil', style: 'destructive', onPress: async () => {
          try {
            await api.kadroDeleteComment(yorumId);
            setYorumlar((prev) => prev.filter((y) => y.id !== yorumId));
          } catch (err) {
            Alert.alert('Hata', err.message || 'Silinemedi');
          }
        },
      },
    ]);
  };

  const postSil = () => {
    Alert.alert('Gönderiyi Sil', 'Bu gönderiyi silmek istediğine emin misin?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil', style: 'destructive', onPress: async () => {
          try {
            await api.kadroDeletePost(id);
            router.back();
          } catch (err) {
            Alert.alert('Hata', err.message || 'Silinemedi');
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

  if (error || !post) {
    return (
      <View style={ORTAK_STIL.ekran}>
        <View style={[styles.ustBar, { paddingTop: insets.top + 12 }]}>
          <Pressable onPress={() => router.back()} hitSlop={10}><Text style={styles.geriOk}>‹</Text></Pressable>
          <Text style={styles.baslik}>Kadro</Text>
          <View style={{ width: 24 }} />
        </View>
        <Text style={styles.bos}>{error || 'Gönderi bulunamadı.'}</Text>
      </View>
    );
  }

  const silYetkisi = post.userId === user?.id || user?.isAdmin;

  return (
    <KeyboardAvoidingView style={ORTAK_STIL.ekran} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={insets.top}>
      <View style={[styles.ustBar, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}><Text style={styles.geriOk}>‹</Text></Pressable>
        <Text style={styles.baslik} numberOfLines={1}>{post.authorName}'nin Kadrosu</Text>
        {silYetkisi ? (
          <Pressable onPress={postSil} hitSlop={10}><Text style={styles.silIkon}>🗑️</Text></Pressable>
        ) : <View style={{ width: 24 }} />}
      </View>

      <FlatList
        data={yorumlar}
        keyExtractor={(y) => String(y.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
        ListHeaderComponent={
          <View style={{ marginBottom: 18 }}>
            <Image source={{ uri: tamGorselUrl(post.imageUrl) }} style={styles.postGorsel} resizeMode="contain" />
            <View style={styles.postUstSatir}>
              <Text style={[styles.postYazar, post.isAdmin && { color: RENKLER.uyari }]}>{post.isAdmin ? '🛡️ ' : ''}{post.authorName}</Text>
              <Text style={styles.postZaman}>{zamanFormatla(post.createdAt)}</Text>
            </View>
            {post.caption ? <Text style={styles.postCaption}>{post.caption}</Text> : null}
            <Text style={styles.yorumBaslik}>Yorumlar / Öneriler 💬 {yorumlar.length > 0 ? `(${yorumlar.length})` : ''}</Text>
          </View>
        }
        ListEmptyComponent={<Text style={styles.bos}>Henüz yorum yok. İlk öneriyi sen yap!</Text>}
        renderItem={({ item: y }) => (
          <View style={styles.yorumKarti}>
            <View style={styles.postUstSatir}>
              <Text style={[styles.yorumYazar, y.isAdmin && { color: RENKLER.uyari }]}>{y.isAdmin ? '🛡️ ' : ''}{y.authorName}</Text>
              <Text style={styles.postZaman}>{zamanFormatla(y.createdAt)}</Text>
            </View>
            <Text style={styles.yorumMetin}>{y.body}</Text>
            {(y.userId === user?.id || user?.isAdmin) ? (
              <Pressable onPress={() => yorumSil(y.id)} style={{ alignSelf: 'flex-end', marginTop: 4 }}>
                <Text style={styles.yorumSilMetin}>Sil</Text>
              </Pressable>
            ) : null}
          </View>
        )}
      />

      <View style={[styles.girdiSatiri, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TextInput
          style={styles.girdi}
          placeholder="Yorum veya öneri yaz..."
          placeholderTextColor={RENKLER.metinUcuncul}
          value={metin}
          onChangeText={setMetin}
          multiline
          maxLength={500}
        />
        <Pressable onPress={yorumGonder} disabled={gonderiliyor || !metin.trim()} style={[styles.gonderButon, { backgroundColor: RENKLER.vurgu }, (!metin.trim() || gonderiliyor) && { opacity: 0.5 }]}>
          {gonderiliyor ? <ActivityIndicator size="small" color={RENKLER.bg} /> : <Text style={[styles.gonderMetin, { color: RENKLER.bg }]}>Gönder</Text>}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function olusturStyles(RENKLER) {
  return StyleSheet.create({
    ustBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: RENKLER.ayrici },
    geriOk: { fontSize: 28, color: RENKLER.metin, fontWeight: '300', width: 24 },
    baslik: { fontSize: 15, fontWeight: '800', color: RENKLER.metin, flex: 1, textAlign: 'center' },
    silIkon: { fontSize: 16, width: 24, textAlign: 'right' },
    bos: { color: RENKLER.metinIkincil, textAlign: 'center', marginTop: 40 },
    postGorsel: { width: '100%', height: 320, backgroundColor: RENKLER.bg3, borderRadius: 14 },
    postUstSatir: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
    postYazar: { fontSize: 13.5, fontWeight: '800', color: RENKLER.vurgu2 },
    postZaman: { fontSize: 10.5, color: RENKLER.metinUcuncul },
    postCaption: { fontSize: 13.5, color: RENKLER.metin, marginTop: 6, lineHeight: 19 },
    yorumBaslik: { fontSize: 15, fontWeight: '800', color: RENKLER.metin, marginTop: 20 },
    yorumKarti: { backgroundColor: RENKLER.bg2, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: RENKLER.ayrici, marginBottom: 10 },
    yorumYazar: { fontSize: 12.5, fontWeight: '700', color: RENKLER.vurgu2 },
    yorumMetin: { fontSize: 13, color: RENKLER.metin, marginTop: 4, lineHeight: 18 },
    yorumSilMetin: { fontSize: 11, color: RENKLER.hata, fontWeight: '700' },
    girdiSatiri: {
      flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: 12, paddingTop: 10,
      borderTopWidth: 1, borderTopColor: RENKLER.ayrici, backgroundColor: RENKLER.bg,
    },
    girdi: {
      flex: 1, backgroundColor: RENKLER.bg2, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10,
      color: RENKLER.metin, fontSize: 13.5, maxHeight: 100, borderWidth: 1, borderColor: RENKLER.ayrici,
    },
    gonderButon: { borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12 },
    gonderMetin: { fontWeight: '800', fontSize: 12.5 },
  });
}
