import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, FlatList, Image, TextInput, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator, RefreshControl, Modal, Alert, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../store/authStore';
import { api, getServerRootUrl } from '../services/api';
import { useRenkler, useOrtakStil } from '../constants/theme';

const YENILEME_ARALIGI = 5000;
const KATEGORILER = [
  { key: 'sohbet', label: '💬 Genel Sohbet' },
  { key: 'kadro', label: '🧩 Kadro Kurma' },
];

function saatFormatla(iso) {
  if (!iso) return '';
  const d = new Date(iso.replace(' ', 'T') + 'Z');
  return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' });
}

export default function ForumEkrani() {
  const RENKLER = useRenkler();
  const ORTAK_STIL = useOrtakStil();
  const styles = olusturStyles(RENKLER);
  const insets = useSafeAreaInsets();
  const [kategori, setKategori] = useState('sohbet');

  return (
    <View style={ORTAK_STIL.ekran}>
      <View style={[styles.ustBar, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.baslik}>Forum</Text>
        <Text style={styles.altBaslik}>Tüm üyelerle sohbet et, kadronu paylaş</Text>
        <View style={styles.kategoriSatiri}>
          {KATEGORILER.map((k) => (
            <Pressable
              key={k.key}
              onPress={() => setKategori(k.key)}
              style={[styles.kategoriButon, kategori === k.key && { backgroundColor: RENKLER.vurgu, borderColor: RENKLER.vurgu }]}
            >
              <Text style={[styles.kategoriMetin, kategori === k.key && { color: RENKLER.bg }]}>{k.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {kategori === 'sohbet' ? <GenelSohbetIcerik RENKLER={RENKLER} styles={styles} insets={insets} /> : <KadroKurmaIcerik RENKLER={RENKLER} ORTAK_STIL={ORTAK_STIL} styles={styles} />}
    </View>
  );
}

function GenelSohbetIcerik({ RENKLER, styles, insets }) {
  const { user } = useAuthStore();
  const [mesajlar, setMesajlar] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [metin, setMetin] = useState('');
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const listRef = useRef(null);

  const yukle = useCallback(async (sessiz = false) => {
    if (!sessiz) setYukleniyor(true);
    try {
      const data = await api.forumMessages({ limit: 100 });
      setMesajlar(data.items || []);
    } catch { /* sessiz geç — arkaplan yenilemesinde kullanıcıyı rahatsız etme */ }
    if (!sessiz) setYukleniyor(false);
  }, []);

  useEffect(() => {
    yukle();
    const zamanlayici = setInterval(() => yukle(true), YENILEME_ARALIGI);
    return () => clearInterval(zamanlayici);
  }, [yukle]);

  const gonder = async () => {
    const body = metin.trim();
    if (!body || gonderiliyor) return;
    setGonderiliyor(true);
    try {
      const data = await api.forumSend(body);
      setMetin('');
      setMesajlar((prev) => [...prev, data.item]);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (err) {
      Alert.alert('Hata', err.message || 'Mesaj gönderilemedi');
    } finally {
      setGonderiliyor(false);
    }
  };

  const sil = (mesaj) => {
    Alert.alert('Mesajı Sil', 'Bu mesajı silmek istediğine emin misin?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil', style: 'destructive', onPress: async () => {
          try {
            await api.forumDelete(mesaj.id);
            setMesajlar((prev) => prev.filter((m) => m.id !== mesaj.id));
          } catch (err) {
            Alert.alert('Hata', err.message || 'Silinemedi');
          }
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={insets.top + 90}>
      {yukleniyor ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={RENKLER.vurgu} />
      ) : (
        <FlatList
          ref={listRef}
          data={mesajlar}
          keyExtractor={(m) => String(m.id)}
          contentContainerStyle={{ padding: 16, paddingBottom: 8, gap: 10 }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={<Text style={styles.bos}>Henüz mesaj yok. İlk mesajı sen yaz!</Text>}
          renderItem={({ item: m }) => {
            const benimMi = m.userId === user?.id;
            return (
              <Pressable
                onLongPress={() => (benimMi || user?.isAdmin) && sil(m)}
                style={[styles.mesajKutu, benimMi && styles.mesajKutuBenim]}
              >
                <View style={styles.mesajUstSatir}>
                  <Text style={[styles.nick, m.isAdmin && styles.nickAdmin]}>{m.isAdmin ? '🛡️ ' : ''}{m.nickname}</Text>
                  <Text style={styles.saat}>{saatFormatla(m.createdAt)}</Text>
                </View>
                <Text style={styles.mesajMetin}>{m.body}</Text>
              </Pressable>
            );
          }}
        />
      )}

      <View style={[styles.girdiSatiri, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TextInput
          style={styles.girdi}
          placeholder="Mesajını yaz..."
          placeholderTextColor={RENKLER.metinUcuncul}
          value={metin}
          onChangeText={setMetin}
          maxLength={500}
          multiline
        />
        <Pressable onPress={gonder} disabled={gonderiliyor || !metin.trim()} style={[styles.gonderButon, (!metin.trim() || gonderiliyor) && { opacity: 0.5 }]}>
          <Text style={styles.gonderMetin}>Gönder</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function tamGorselUrl(url) {
  if (!url) return null;
  return url.startsWith('http') ? url : `${getServerRootUrl()}${url}`;
}

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

function KadroKurmaIcerik({ RENKLER, ORTAK_STIL, styles }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [postlar, setPostlar] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [yenileniyor, setYenileniyor] = useState(false);
  const [modalAcik, setModalAcik] = useState(false);
  const [secilenGorsel, setSecilenGorsel] = useState(null);
  const [mesaj, setMesaj] = useState('');
  const [gonderiliyor, setGonderiliyor] = useState(false);

  const yukle = useCallback(async () => {
    try {
      const data = await api.kadroPosts({ limit: 30 });
      setPostlar(data.items || []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    setYukleniyor(true);
    yukle().finally(() => setYukleniyor(false));
  }, [yukle]);

  const yenile = async () => {
    setYenileniyor(true);
    await yukle();
    setYenileniyor(false);
  };

  const modaliAc = () => {
    setSecilenGorsel(null);
    setMesaj('');
    setModalAcik(true);
  };

  const gorselSec = async () => {
    const izin = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!izin.granted) {
      Alert.alert('İzin gerekli', 'Galeriye erişim izni vermelisin.');
      return;
    }
    const sonuc = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!sonuc.canceled && sonuc.assets?.[0]) {
      setSecilenGorsel(sonuc.assets[0]);
    }
  };

  const paylas = async () => {
    if (!secilenGorsel) {
      Alert.alert('Görsel gerekli', 'Önce kadronun ekran görüntüsünü seç.');
      return;
    }
    setGonderiliyor(true);
    try {
      const yukleme = await api.kadroUploadImage(secilenGorsel.uri, secilenGorsel.fileName);
      const data = await api.kadroCreatePost({ imageUrl: yukleme.imageUrl, caption: mesaj.trim() });
      setPostlar((prev) => [data.item, ...prev]);
      setModalAcik(false);
    } catch (err) {
      Alert.alert('Hata', err.message || 'Gönderi paylaşılamadı');
    } finally {
      setGonderiliyor(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.kadroUstSatir}>
        <Pressable onPress={modaliAc} style={[styles.yeniButon, { backgroundColor: RENKLER.vurgu }]}>
          <Text style={[styles.yeniButonMetin, { color: RENKLER.bg }]}>+ Kadronu Paylaş</Text>
        </Pressable>
      </View>

      {yukleniyor ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={RENKLER.vurgu} />
      ) : (
        <FlatList
          data={postlar}
          keyExtractor={(p) => String(p.id)}
          contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={yenileniyor} onRefresh={yenile} tintColor={RENKLER.vurgu} />}
          ListEmptyComponent={<Text style={styles.bos}>Henüz kadro paylaşılmamış. İlk paylaşan sen ol!</Text>}
          renderItem={({ item }) => (
            <Pressable onPress={() => router.push(`/kadro-yorumlama/${item.id}`)} style={[ORTAK_STIL.kart, { padding: 0, overflow: 'hidden' }]}>
              <Image source={{ uri: tamGorselUrl(item.imageUrl) }} style={styles.postGorsel} resizeMode="cover" />
              <View style={{ padding: 12 }}>
                <View style={styles.postUstSatir}>
                  <Text style={[styles.postYazar, item.isAdmin && { color: RENKLER.uyari }]}>{item.isAdmin ? '🛡️ ' : ''}{item.authorName}</Text>
                  <Text style={styles.postZaman}>{zamanFormatla(item.createdAt)}</Text>
                </View>
                {item.caption ? <Text style={styles.postCaption} numberOfLines={3}>{item.caption}</Text> : null}
                <Text style={[styles.postYorumSayisi, { color: RENKLER.vurgu }]}>
                  💬 {item.commentCount > 0 ? `${item.commentCount} yorum/öneri` : 'İlk yorumu sen yap'}
                </Text>
              </View>
            </Pressable>
          )}
        />
      )}

      <Modal visible={modalAcik} transparent animationType="slide" onRequestClose={() => setModalAcik(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalArkaPlan}>
          <View style={[styles.modalKutu, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <View style={styles.modalUstSatir}>
              <Text style={styles.modalBaslik}>Kadronu Paylaş</Text>
              <Pressable onPress={() => setModalAcik(false)} hitSlop={10}>
                <Text style={styles.modalKapat}>✕</Text>
              </Pressable>
            </View>

            <Pressable onPress={gorselSec} style={styles.gorselSeçKutu}>
              {secilenGorsel ? (
                <Image source={{ uri: secilenGorsel.uri }} style={styles.onizlemeGorsel} resizeMode="cover" />
              ) : (
                <>
                  <Text style={styles.gorselSecEmoji}>📸</Text>
                  <Text style={styles.gorselSecMetin}>Kadro ekran görüntüsü seç</Text>
                </>
              )}
            </Pressable>

            <TextInput
              style={styles.mesajInput}
              placeholder="Kadron hakkında ne düşünüyorsun? (opsiyonel)"
              placeholderTextColor={RENKLER.metinUcuncul}
              value={mesaj}
              onChangeText={setMesaj}
              multiline
              maxLength={500}
            />

            <Pressable
              onPress={paylas}
              disabled={gonderiliyor || !secilenGorsel}
              style={[styles.paylasButon, { backgroundColor: RENKLER.vurgu }, (!secilenGorsel || gonderiliyor) && { opacity: 0.5 }]}
            >
              {gonderiliyor ? <ActivityIndicator size="small" color={RENKLER.bg} /> : <Text style={[styles.paylasButonMetin, { color: RENKLER.bg }]}>Paylaş</Text>}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function olusturStyles(RENKLER) {
  return StyleSheet.create({
    ustBar: { paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: RENKLER.ayrici },
    baslik: { fontSize: 20, fontWeight: '900', color: RENKLER.metin },
    altBaslik: { fontSize: 12, color: RENKLER.metinIkincil, marginTop: 2 },
    kategoriSatiri: { flexDirection: 'row', gap: 8, marginTop: 12 },
    kategoriButon: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: RENKLER.ayrici, backgroundColor: RENKLER.bg2 },
    kategoriMetin: { fontSize: 12.5, fontWeight: '700', color: RENKLER.metinIkincil },
    bos: { color: RENKLER.metinIkincil, textAlign: 'center', marginTop: 40 },
    mesajKutu: { backgroundColor: RENKLER.bg2, borderRadius: 12, padding: 10, borderWidth: 1, borderColor: RENKLER.ayrici, alignSelf: 'flex-start', maxWidth: '85%' },
    mesajKutuBenim: { alignSelf: 'flex-end', borderColor: RENKLER.vurgu, backgroundColor: `${RENKLER.vurgu}14` },
    mesajUstSatir: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
    nick: { fontSize: 11.5, fontWeight: '800', color: RENKLER.vurgu2 },
    nickAdmin: { color: RENKLER.uyari },
    saat: { fontSize: 9.5, color: RENKLER.metinUcuncul },
    mesajMetin: { fontSize: 13.5, color: RENKLER.metin, lineHeight: 18 },
    girdiSatiri: {
      flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: 12, paddingTop: 10,
      borderTopWidth: 1, borderTopColor: RENKLER.ayrici, backgroundColor: RENKLER.bg,
    },
    girdi: {
      flex: 1, backgroundColor: RENKLER.bg2, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10,
      color: RENKLER.metin, fontSize: 13.5, maxHeight: 100, borderWidth: 1, borderColor: RENKLER.ayrici,
    },
    gonderButon: { backgroundColor: RENKLER.vurgu, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12 },
    gonderMetin: { color: RENKLER.bg, fontWeight: '800', fontSize: 12.5 },

    kadroUstSatir: { paddingHorizontal: 16, paddingTop: 14, alignItems: 'flex-start' },
    yeniButon: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9 },
    yeniButonMetin: { fontWeight: '800', fontSize: 12.5 },
    postGorsel: { width: '100%', height: 220, backgroundColor: RENKLER.bg3 },
    postUstSatir: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    postYazar: { fontSize: 12.5, fontWeight: '800', color: RENKLER.vurgu2 },
    postZaman: { fontSize: 10.5, color: RENKLER.metinUcuncul },
    postCaption: { fontSize: 13, color: RENKLER.metin, marginTop: 6, lineHeight: 18 },
    postYorumSayisi: { fontSize: 11.5, fontWeight: '700', marginTop: 8 },
    modalArkaPlan: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
    modalKutu: { backgroundColor: RENKLER.bg2, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 18 },
    modalUstSatir: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    modalBaslik: { fontSize: 16, fontWeight: '800', color: RENKLER.metin },
    modalKapat: { fontSize: 18, color: RENKLER.metinIkincil, padding: 4 },
    gorselSeçKutu: {
      height: 180, borderRadius: 14, borderWidth: 1.5, borderColor: RENKLER.ayrici, borderStyle: 'dashed',
      alignItems: 'center', justifyContent: 'center', backgroundColor: RENKLER.bg3, overflow: 'hidden',
    },
    onizlemeGorsel: { width: '100%', height: '100%' },
    gorselSecEmoji: { fontSize: 30 },
    gorselSecMetin: { fontSize: 12.5, color: RENKLER.metinIkincil, marginTop: 8, fontWeight: '600' },
    mesajInput: {
      marginTop: 14, backgroundColor: RENKLER.bg3, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
      color: RENKLER.metin, fontSize: 13.5, minHeight: 70, borderWidth: 1, borderColor: RENKLER.ayrici,
    },
    paylasButon: { marginTop: 16, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
    paylasButonMetin: { fontWeight: '800', fontSize: 14 },
  });
}
