import { useState } from 'react';
import { View, Text, TextInput, Image, Pressable, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import NeonParilti from '../components/NeonParilti';
import { api } from '../services/api';
import { useRenkler, useOrtakStil } from '../constants/theme';
import { FORUM_KATEGORILERI } from '../constants/forum';

const MIN_BASLIK = 5;

export default function ForumYeniBaslikEkrani() {
  const RENKLER = useRenkler();
  const ORTAK_STIL = useOrtakStil();
  const styles = olusturStyles(RENKLER);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const [kategori, setKategori] = useState(params.kategori || 'genel');
  const [baslik, setBaslik] = useState('');
  const [metin, setMetin] = useState('');
  const [gorsel, setGorsel] = useState(null);
  const [gonderiliyor, setGonderiliyor] = useState(false);

  const hazir = baslik.trim().length >= MIN_BASLIK && !gonderiliyor;

  const gorselSec = async () => {
    const izin = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!izin.granted) {
      Alert.alert('İzin gerekli', 'Galeriye erişim izni vermelisin.');
      return;
    }
    const sonuc = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!sonuc.canceled && sonuc.assets?.[0]) setGorsel(sonuc.assets[0]);
  };

  const ac = async () => {
    if (!hazir) return;
    setGonderiliyor(true);
    try {
      const yukleme = gorsel ? await api.kadroUploadImage(gorsel.uri, gorsel.fileName) : null;
      const data = await api.forumCreateThread({
        category: kategori,
        title: baslik.trim(),
        body: metin.trim(),
        ...(yukleme ? { imageUrl: yukleme.imageUrl } : {}),
      });
      router.replace(`/forum/${data.item.id}`);
    } catch (err) {
      Alert.alert('Hata', err.message || 'Başlık açılamadı');
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
        <Text style={styles.baslikMetin}>Yeni Başlık</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
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
          placeholder="Bütçen, kadron, aklındaki oyuncular..."
          placeholderTextColor={RENKLER.metinUcuncul}
          value={metin}
          onChangeText={setMetin}
          maxLength={2000}
          multiline
        />

        <Pressable onPress={gorselSec} style={styles.gorselKutu}>
          {gorsel ? (
            <Image source={{ uri: gorsel.uri }} style={styles.onizleme} resizeMode="cover" />
          ) : (
            <Text style={styles.gorselMetin}>📸 Görsel ekle (opsiyonel)</Text>
          )}
        </Pressable>

        <Pressable onPress={ac} disabled={!hazir} style={[ORTAK_STIL.buyukButon, { marginTop: 18 }, !hazir && { opacity: 0.5 }]}>
          {gonderiliyor ? <ActivityIndicator color={RENKLER.bg} /> : <Text style={styles.acMetin}>Başlığı Aç</Text>}
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
    gorselKutu: {
      marginTop: 16, height: 130, borderRadius: 14, borderWidth: 1.5, borderColor: RENKLER.ayrici, borderStyle: 'dashed',
      alignItems: 'center', justifyContent: 'center', backgroundColor: RENKLER.bg3, overflow: 'hidden',
    },
    onizleme: { width: '100%', height: '100%' },
    gorselMetin: { fontSize: 13, color: RENKLER.metinIkincil, fontWeight: '600' },
    acMetin: { color: RENKLER.bg, fontWeight: '800', fontSize: 15 },
  });
}
