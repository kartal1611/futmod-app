import { useEffect, useState } from 'react';
import { View, Text, TextInput, Image, Pressable, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import NeonParilti from '../components/NeonParilti';
import { api } from '../services/api';
import { useRenkler, useOrtakStil } from '../constants/theme';
import { FORUM_KATEGORILERI } from '../constants/forum';

const MIN_BASLIK = 5;
const MIN_SECENEK = 2;
const MAX_SECENEK = 6;
const MAX_GORSEL = 4;

/** Opens a new thread, or edits the title and text of an existing one with ?duzenle=<id>. */
export default function ForumYeniBaslikEkrani() {
  const RENKLER = useRenkler();
  const ORTAK_STIL = useOrtakStil();
  const styles = olusturStyles(RENKLER);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const duzenleId = params.duzenle ? Number(params.duzenle) : null;
  const [kategori, setKategori] = useState(params.kategori || 'genel');
  const [baslik, setBaslik] = useState('');
  const [metin, setMetin] = useState('');
  const [gorseller, setGorseller] = useState([]);
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [anketAcik, setAnketAcik] = useState(false);
  const [secenekler, setSecenekler] = useState(['', '']);

  useEffect(() => {
    if (!duzenleId) return;
    api.forumThread(duzenleId).then((data) => {
      setBaslik(data.item.title);
      setMetin(data.item.body);
    }).catch((err) => Alert.alert('Hata', err.message || 'Başlık yüklenemedi'));
  }, [duzenleId]);

  const doluSecenekler = secenekler.map((s) => s.trim()).filter(Boolean);
  const anketHazir = !anketAcik || doluSecenekler.length >= MIN_SECENEK;
  const hazir = baslik.trim().length >= MIN_BASLIK && anketHazir && !gonderiliyor;

  const secenekYaz = (i, deger) => setSecenekler((prev) => prev.map((s, j) => (j === i ? deger : s)));

  const gorselSec = async () => {
    const izin = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!izin.granted) {
      Alert.alert('İzin gerekli', 'Galeriye erişim izni vermelisin.');
      return;
    }
    const sonuc = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsMultipleSelection: true,
      selectionLimit: MAX_GORSEL - gorseller.length,
    });
    if (!sonuc.canceled && sonuc.assets?.length) {
      setGorseller((prev) => [...prev, ...sonuc.assets].slice(0, MAX_GORSEL));
    }
  };

  const kaydet = async () => {
    if (!hazir) return;
    setGonderiliyor(true);
    try {
      if (duzenleId) {
        await api.forumEditThread(duzenleId, { title: baslik.trim(), body: metin.trim() });
        router.back();
        return;
      }
      const yuklenenler = [];
      for (const g of gorseller) {
        yuklenenler.push((await api.forumUploadImage(g.uri, g.fileName)).imageUrl);
      }
      const data = await api.forumCreateThread({
        category: kategori,
        title: baslik.trim(),
        body: metin.trim(),
        imageUrls: yuklenenler,
        ...(anketAcik ? { pollOptions: doluSecenekler } : {}),
      });
      router.replace(`/forum/${data.item.id}`);
    } catch (err) {
      Alert.alert('Hata', err.message || 'Kaydedilemedi');
      setGonderiliyor(false);
    }
  };

  return (
    <KeyboardAvoidingView style={ORTAK_STIL.ekran} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <NeonParilti />
      <View style={[styles.ustBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.geriButon} accessibilityRole="button" accessibilityLabel="Geri">
          <Text style={styles.geriMetin}>‹</Text>
        </Pressable>
        <Text style={styles.baslikMetin}>{duzenleId ? 'Başlığı Düzenle' : 'Yeni Başlık'}</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
        {!duzenleId ? (
          <>
            <Text style={styles.etiket}>Kategori</Text>
            <View style={styles.kategoriSatiri}>
              {FORUM_KATEGORILERI.map((k) => (
                <Pressable
                  key={k.key}
                  onPress={() => setKategori(k.key)}
                  style={[styles.kategoriButon, kategori === k.key && { backgroundColor: RENKLER.vurgu, borderColor: RENKLER.vurgu }]}
                >
                  <Text style={[styles.kategoriMetin, kategori === k.key && { color: RENKLER.bg }]}>{k.label}</Text>
                </Pressable>
              ))}
            </View>
          </>
        ) : null}

        <Text style={styles.etiket}>Başlık</Text>
        <TextInput
          style={styles.girdi}
          placeholder="Ne sormak istiyorsun?"
          placeholderTextColor={RENKLER.metinUcuncul}
          value={baslik}
          onChangeText={setBaslik}
          maxLength={120}
        />

        <Text style={styles.etiket}>Detay (opsiyonel)</Text>
        <TextInput
          style={[styles.girdi, { minHeight: 120, textAlignVertical: 'top' }]}
          placeholder="Bütçen, kadron, aklındaki oyuncular... @ ile birinden bahset"
          placeholderTextColor={RENKLER.metinUcuncul}
          value={metin}
          onChangeText={setMetin}
          maxLength={2000}
          multiline
        />

        {!duzenleId ? (
          <>
            <Text style={styles.etiket}>Görseller (en fazla {MAX_GORSEL})</Text>
            <View style={styles.gorselSatiri}>
              {gorseller.map((g, i) => (
                <Pressable
                  key={g.uri}
                  onPress={() => setGorseller((prev) => prev.filter((_, j) => j !== i))}
                  accessibilityRole="button"
                  accessibilityLabel={`${i + 1}. görseli kaldır`}
                >
                  <Image source={{ uri: g.uri }} style={styles.onizleme} resizeMode="cover" />
                  <Text style={styles.kaldir}>✕</Text>
                </Pressable>
              ))}
              {gorseller.length < MAX_GORSEL ? (
                <Pressable onPress={gorselSec} style={styles.gorselEkle} accessibilityRole="button" accessibilityLabel="Görsel ekle">
                  <Text style={styles.gorselMetin}>📸 Ekle</Text>
                </Pressable>
              ) : null}
            </View>

            <Pressable onPress={() => setAnketAcik((v) => !v)} style={[styles.anketButon, anketAcik && { borderColor: RENKLER.vurgu }]}>
              <Text style={[styles.gorselMetin, anketAcik && { color: RENKLER.vurgu }]}>📊 {anketAcik ? 'Anketi kaldır' : 'Anket ekle'}</Text>
            </Pressable>
            {anketAcik ? (
              <View style={{ gap: 8, marginTop: 10 }}>
                {secenekler.map((s, i) => (
                  <TextInput
                    key={i}
                    style={styles.girdi}
                    placeholder={`Seçenek ${i + 1}`}
                    placeholderTextColor={RENKLER.metinUcuncul}
                    value={s}
                    onChangeText={(v) => secenekYaz(i, v)}
                    maxLength={60}
                  />
                ))}
                {secenekler.length < MAX_SECENEK ? (
                  <Pressable onPress={() => setSecenekler((prev) => [...prev, ''])} style={styles.secenekEkle}>
                    <Text style={[styles.gorselMetin, { color: RENKLER.vurgu }]}>+ Seçenek ekle</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}
          </>
        ) : null}

        <Pressable onPress={kaydet} disabled={!hazir} style={[ORTAK_STIL.buyukButon, { marginTop: 18 }, !hazir && { opacity: 0.5 }]}>
          {gonderiliyor ? <ActivityIndicator color={RENKLER.bg} /> : <Text style={styles.acMetin}>{duzenleId ? 'Kaydet' : 'Başlığı Aç'}</Text>}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function olusturStyles(RENKLER) {
  return StyleSheet.create({
    ustBar: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: RENKLER.ayrici },
    geriButon: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
    geriMetin: { fontSize: 32, lineHeight: 34, color: RENKLER.metin },
    baslikMetin: { fontSize: 18, fontWeight: '900', color: RENKLER.metin },
    etiket: { fontSize: 13, fontWeight: '700', color: RENKLER.metinIkincil, marginTop: 16, marginBottom: 8 },
    kategoriSatiri: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    kategoriButon: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: RENKLER.ayrici, backgroundColor: RENKLER.bg2 },
    kategoriMetin: { fontSize: 12.5, fontWeight: '700', color: RENKLER.metinIkincil },
    girdi: {
      backgroundColor: RENKLER.bg2, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
      color: RENKLER.metin, fontSize: 14.5, borderWidth: 1, borderColor: RENKLER.ayrici,
    },
    gorselSatiri: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    onizleme: { width: 76, height: 76, borderRadius: 10, backgroundColor: RENKLER.bg3 },
    kaldir: { position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: 10, overflow: 'hidden', textAlign: 'center', lineHeight: 20, fontSize: 11, color: '#fff', backgroundColor: 'rgba(0,0,0,0.7)' },
    gorselEkle: { width: 76, height: 76, borderRadius: 10, borderWidth: 1.5, borderColor: RENKLER.ayrici, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: RENKLER.bg3 },
    gorselMetin: { fontSize: 13, color: RENKLER.metinIkincil, fontWeight: '600' },
    anketButon: { marginTop: 14, minHeight: 46, borderRadius: 12, borderWidth: 1, borderColor: RENKLER.ayrici, backgroundColor: RENKLER.bg2, alignItems: 'center', justifyContent: 'center' },
    secenekEkle: { minHeight: 42, alignItems: 'center', justifyContent: 'center' },
    acMetin: { color: RENKLER.bg, fontWeight: '800', fontSize: 15 },
  });
}
