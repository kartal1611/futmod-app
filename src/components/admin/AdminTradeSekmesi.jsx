import { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, Image, ScrollView, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { api, getServerRootUrl } from '../../services/api';
import { useRenkler, useOrtakStil } from '../../constants/theme';

function tamGorselUrl(imageUrl) {
  if (!imageUrl) return null;
  return imageUrl.startsWith('http') ? imageUrl : `${getServerRootUrl()}${imageUrl}`;
}

export default function AdminTradeSekmesi() {
  const RENKLER = useRenkler();
  const ORTAK_STIL = useOrtakStil();
  const styles = olusturStyles(RENKLER);
  const [liste, setListe] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [duzenlenenId, setDuzenlenenId] = useState(null); // null = yeni kart
  const [gorsel, setGorsel] = useState(null); // { uri, name } yerel seçim
  const [mevcutGorselUrl, setMevcutGorselUrl] = useState(null); // sunucudaki mevcut görsel
  const [metin, setMetin] = useState('');
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [mesaj, setMesaj] = useState(null);

  const listeyiGetir = () => {
    setYukleniyor(true);
    api.adminListTrade().then((data) => setListe(data.items)).finally(() => setYukleniyor(false));
  };

  useEffect(() => { listeyiGetir(); }, []);

  const formuSifirla = () => {
    setDuzenlenenId(null);
    setGorsel(null);
    setMevcutGorselUrl(null);
    setMetin('');
  };

  const duzenlemeyeBasla = (item) => {
    setDuzenlenenId(item.id);
    setGorsel(null);
    setMevcutGorselUrl(item.imageUrl);
    setMetin(item.body);
  };

  const gorselSec = async () => {
    const izin = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!izin.granted) {
      Alert.alert('İzin gerekli', 'Görsel seçebilmek için galeri izni vermelisin.');
      return;
    }
    const sonuc = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!sonuc.canceled && sonuc.assets?.[0]) {
      const asset = sonuc.assets[0];
      setGorsel({ uri: asset.uri, name: asset.fileName || 'trade.jpg' });
    }
  };

  const kaydet = async () => {
    if (!metin.trim()) return;
    setKaydediliyor(true);
    setMesaj(null);
    try {
      let imageUrl = mevcutGorselUrl;
      if (gorsel) {
        const yukleme = await api.adminUploadTradeImage(gorsel.uri, gorsel.name);
        imageUrl = yukleme.imageUrl;
      }
      if (duzenlenenId) {
        await api.adminUpdateTrade(duzenlenenId, { body: metin.trim(), imageUrl });
        setMesaj('✅ Kart güncellendi.');
      } else {
        await api.adminCreateTrade({ body: metin.trim(), imageUrl });
        setMesaj('✅ Yeni kart eklendi.');
      }
      formuSifirla();
      listeyiGetir();
    } catch (err) {
      setMesaj(err.message);
    } finally {
      setKaydediliyor(false);
    }
  };

  const sil = (item) => {
    Alert.alert('Kartı sil', 'Bu trade kartını silmek istediğine emin misin?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.adminDeleteTrade(item.id);
            listeyiGetir();
            if (duzenlenenId === item.id) formuSifirla();
          } catch (err) {
            setMesaj(err.message);
          }
        },
      },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <View style={ORTAK_STIL.kart}>
        <Text style={styles.baslik}>{duzenlenenId ? 'Kartı Düzenle' : 'Yeni Trade Kartı'}</Text>
        <Text style={styles.aciklama}>Kart görselini yükle, altına bilgileri yaz. VIP üyeler Trade ekranında bunu görecek.</Text>

        <Pressable style={styles.gorselAlani} onPress={gorselSec}>
          {gorsel ? (
            <Image source={{ uri: gorsel.uri }} style={styles.gorselOnizleme} resizeMode="cover" />
          ) : mevcutGorselUrl ? (
            <Image source={{ uri: tamGorselUrl(mevcutGorselUrl) }} style={styles.gorselOnizleme} resizeMode="cover" />
          ) : (
            <Text style={styles.gorselPlaceholder}>📷 Görsel seç</Text>
          )}
        </Pressable>

        <TextInput
          style={styles.textarea}
          multiline
          placeholder="Örn: Mbappe 92 - 1.2M coin - ..."
          placeholderTextColor={RENKLER.metinUcuncul}
          value={metin}
          onChangeText={setMetin}
        />

        <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
          <Pressable style={[ORTAK_STIL.buyukButon, { flex: 1 }]} onPress={kaydet} disabled={kaydediliyor}>
            {kaydediliyor ? <ActivityIndicator color={RENKLER.bg} /> : <Text style={styles.buttonMetin}>{duzenlenenId ? 'Güncelle' : 'Ekle'}</Text>}
          </Pressable>
          {duzenlenenId ? (
            <Pressable style={styles.vazgecButon} onPress={formuSifirla}>
              <Text style={styles.vazgecMetin}>Vazgeç</Text>
            </Pressable>
          ) : null}
        </View>
        {mesaj ? <Text style={styles.mesaj}>{mesaj}</Text> : null}
      </View>

      <Text style={styles.listeBaslik}>Kayıtlı Kartlar</Text>
      {yukleniyor ? (
        <ActivityIndicator style={{ marginTop: 20 }} color={RENKLER.vurgu} />
      ) : liste.length === 0 ? (
        <Text style={styles.bos}>Henüz kart yok.</Text>
      ) : (
        liste.map((item) => (
          <View key={item.id} style={[ORTAK_STIL.kart, { marginTop: 10, flexDirection: 'row', gap: 10 }]}>
            {item.imageUrl ? (
              <Image source={{ uri: tamGorselUrl(item.imageUrl) }} style={styles.kucukGorsel} resizeMode="cover" />
            ) : (
              <View style={[styles.kucukGorsel, { backgroundColor: RENKLER.bg3 }]} />
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.listeMetin} numberOfLines={2}>{item.body}</Text>
              <View style={{ flexDirection: 'row', gap: 14, marginTop: 6 }}>
                <Pressable onPress={() => duzenlemeyeBasla(item)}>
                  <Text style={styles.duzenleLink}>Düzenle</Text>
                </Pressable>
                <Pressable onPress={() => sil(item)}>
                  <Text style={styles.silLink}>Sil</Text>
                </Pressable>
              </View>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

function olusturStyles(RENKLER) {
  return StyleSheet.create({
  baslik: { fontSize: 15, fontWeight: '700', color: RENKLER.metin },
  aciklama: { fontSize: 12, color: RENKLER.metinIkincil, marginTop: 6, marginBottom: 12 },
  gorselAlani: {
    height: 140, borderRadius: 12, backgroundColor: RENKLER.bg3, borderWidth: 1, borderColor: RENKLER.ayrici,
    borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 12,
  },
  gorselOnizleme: { width: '100%', height: '100%' },
  gorselPlaceholder: { color: RENKLER.metinUcuncul, fontSize: 13 },
  textarea: {
    backgroundColor: RENKLER.bg3, borderRadius: 10, padding: 14, minHeight: 100, textAlignVertical: 'top',
    color: RENKLER.metin, borderWidth: 1, borderColor: RENKLER.ayrici, fontSize: 13.5,
  },
  buttonMetin: { color: RENKLER.bg, fontWeight: '800', fontSize: 14 },
  vazgecButon: { paddingHorizontal: 18, justifyContent: 'center', borderRadius: 14, backgroundColor: RENKLER.bg3 },
  vazgecMetin: { color: RENKLER.metinIkincil, fontWeight: '700' },
  mesaj: { marginTop: 12, color: RENKLER.vurgu2, textAlign: 'center', fontSize: 13 },
  listeBaslik: { fontSize: 14, fontWeight: '700', color: RENKLER.metin, marginTop: 20, marginBottom: 6 },
  bos: { color: RENKLER.metinIkincil, fontSize: 12.5, marginTop: 8 },
  kucukGorsel: { width: 56, height: 56, borderRadius: 8 },
  listeMetin: { fontSize: 12.5, color: RENKLER.metin, lineHeight: 18 },
  duzenleLink: { fontSize: 12, color: RENKLER.vurgu2, fontWeight: '700' },
  silLink: { fontSize: 12, color: RENKLER.hata, fontWeight: '700' },
  });
}
