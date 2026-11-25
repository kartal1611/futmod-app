import { View, Text, TextInput, Pressable, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { api, getServerRootUrl } from '../../services/api';
import { useRenkler, FONT } from '../../constants/theme';

/** Yönetim paneli formlarında ortak parçalar: etiketli alan, buton, seçim çipleri, görsel seçici. */

export function Alan({ etiket, deger, degistir, style, ...rest }) {
  const RENKLER = useRenkler();
  return (
    <View style={{ marginTop: 10 }}>
      <Text style={{ fontFamily: FONT.etiket, fontSize: 12.5, letterSpacing: 1, color: RENKLER.metinIkincil }}>{etiket.toLocaleUpperCase('tr-TR')}</Text>
      <TextInput
        value={deger == null ? '' : String(deger)}
        onChangeText={degistir}
        placeholderTextColor={RENKLER.metinUcuncul}
        style={[{ marginTop: 4, backgroundColor: RENKLER.bg3, borderRadius: 4, borderWidth: 1, borderColor: RENKLER.ayrici, paddingHorizontal: 12, paddingVertical: 10, color: RENKLER.metin, fontSize: 14 }, style]}
        {...rest}
      />
    </View>
  );
}

export function Buton({ metin, onPress, tur = 'ana', yukleniyor = false, style }) {
  const RENKLER = useRenkler();
  const ana = tur === 'ana';
  const tehlike = tur === 'tehlike';
  return (
    <Pressable
      onPress={onPress}
      disabled={yukleniyor}
      style={[{
        minHeight: 44, borderRadius: 3, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, borderWidth: 1,
        backgroundColor: ana ? RENKLER.vurgu : 'transparent',
        borderColor: ana ? RENKLER.vurgu : tehlike ? RENKLER.hata : RENKLER.ayrici,
      }, style]}
    >
      {yukleniyor ? <ActivityIndicator color={ana ? RENKLER.vurguUstu : RENKLER.vurgu} /> : (
        <Text style={{ fontFamily: FONT.etiketItalik, fontSize: 15, letterSpacing: 0.8, color: ana ? RENKLER.vurguUstu : tehlike ? RENKLER.hata : RENKLER.metin }}>
          {metin.toLocaleUpperCase('tr-TR')}
        </Text>
      )}
    </Pressable>
  );
}

export function Cipler({ secenekler, secili, sec }) {
  const RENKLER = useRenkler();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
      {secenekler.map((s) => {
        const aktif = secili === s.deger;
        return (
          <Pressable
            key={String(s.deger)}
            onPress={() => sec(s.deger)}
            style={{ paddingHorizontal: 10, paddingVertical: 7, borderRadius: 3, borderWidth: 1, borderColor: aktif ? RENKLER.vurgu : RENKLER.ayrici, backgroundColor: aktif ? RENKLER.vurgu : RENKLER.bg3 }}
          >
            <Text style={{ fontSize: 12, fontWeight: '700', color: aktif ? RENKLER.vurguUstu : RENKLER.metin }}>{s.etiket}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Galeriden görsel seçip sunucuya yükler, tam URL döndürür. */
export async function gorselSecVeYukle() {
  const izin = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!izin.granted) {
    Alert.alert('İzin gerekli', 'Görsel seçmek için fotoğraf erişimine izin ver.');
    return null;
  }
  const sonuc = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85 });
  if (sonuc.canceled || !sonuc.assets?.[0]) return null;
  const a = sonuc.assets[0];
  const { imageUrl } = await api.forumUploadImage(a.uri, a.fileName || 'gorsel.jpg');
  return imageUrl.startsWith('http') ? imageUrl : `${getServerRootUrl()}${imageUrl}`;
}

export function onayla(baslik, mesaj, islem, eylem = 'Sil') {
  Alert.alert(baslik, mesaj, [
    { text: 'Vazgeç', style: 'cancel' },
    { text: eylem, style: 'destructive', onPress: islem },
  ]);
}

export function useAdminStil() {
  const RENKLER = useRenkler();
  return StyleSheet.create({
    arama: { backgroundColor: RENKLER.bg2, borderRadius: 4, borderWidth: 1, borderColor: RENKLER.ayrici, paddingHorizontal: 12, paddingVertical: 10, color: RENKLER.metin, fontSize: 14 },
    satir: { backgroundColor: RENKLER.bg2, borderRadius: 4, borderWidth: 1, borderColor: RENKLER.ayrici, padding: 12 },
    satirBaslik: { fontSize: 15, fontWeight: '800', color: RENKLER.metin },
    satirAlt: { fontSize: 12, color: RENKLER.metinIkincil, marginTop: 3 },
    eylemler: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
    kucukButon: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 3, borderWidth: 1, borderColor: RENKLER.ayrici },
    kucukMetin: { fontSize: 12, fontWeight: '700', color: RENKLER.metin },
    bolum: { fontFamily: FONT.etiket, fontSize: 14, letterSpacing: 1.4, color: RENKLER.metinIkincil, marginTop: 4 },
    bos: { color: RENKLER.metinIkincil, textAlign: 'center', marginTop: 24 },
    hata: { color: RENKLER.hata, fontSize: 13, marginTop: 8 },
  });
}
