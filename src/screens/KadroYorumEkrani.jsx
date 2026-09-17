import { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, Image, Pressable, ActivityIndicator, RefreshControl, Modal, TextInput, Alert, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { api, getServerRootUrl } from '../services/api';
import { useRenkler, useOrtakStil } from '../constants/theme';

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

export default function KadroYorumEkrani() {
  const RENKLER = useRenkler();
  const ORTAK_STIL = useOrtakStil();
  const styles = olusturStyles(RENKLER);
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
    <View style={ORTAK_STIL.ekran}>
      <View style={[styles.ustBar, { paddingTop: insets.top + 12 }]}>
        <View>
          <Text style={styles.baslik}>Kadro Yorumlama 🧩</Text>
          <Text style={styles.altBaslik}>Kadronu paylaş, öneri al</Text>
        </View>
        <Pressable onPress={modaliAc} style={[styles.yeniButon, { backgroundColor: RENKLER.vurgu }]}>
          <Text style={[styles.yeniButonMetin, { color: RENKLER.bg }]}>+ Paylaş</Text>
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
    ustBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: RENKLER.ayrici },
    baslik: { fontSize: 20, fontWeight: '900', color: RENKLER.metin },
    altBaslik: { fontSize: 12, color: RENKLER.metinIkincil, marginTop: 2 },
    yeniButon: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9 },
    yeniButonMetin: { fontWeight: '800', fontSize: 12.5 },
    bos: { color: RENKLER.metinIkincil, textAlign: 'center', marginTop: 40 },
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
