import { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, Image, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';
import { api, getServerRootUrl } from '../../services/api';
import { useRenkler, useOrtakStil } from '../../constants/theme';

const KATEGORILER = [
  { key: 'trade', label: 'Trade', not: 'Sadece VIP üyelere gider' },
  { key: 'sbc', label: 'SBC', not: 'SBC bildirimini açan herkese gider' },
  { key: 'yayin', label: 'Yayın', not: 'Yayın bildirimini açan herkese gider' },
  { key: 'haberler', label: 'Haberler', not: 'Haber bildirimini açan herkese gider' },
];

function tamGorselUrl(imageUrl) {
  if (!imageUrl) return null;
  return imageUrl.startsWith('http') ? imageUrl : `${getServerRootUrl()}${imageUrl}`;
}

export default function AdminBildirimSekmesi() {
  const RENKLER = useRenkler();
  const ORTAK_STIL = useOrtakStil();
  const styles = olusturStyles(RENKLER);
  const [kategori, setKategori] = useState('sbc');
  const [baslik, setBaslik] = useState('');
  const [govde, setGovde] = useState('');
  const [tradeKartlari, setTradeKartlari] = useState([]);
  const [seciliTradeId, setSeciliTradeId] = useState(null);
  const [yeniGorsel, setYeniGorsel] = useState(null); // { uri, name } — bildirimle birlikte yeni kart oluşturmak için
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [mesaj, setMesaj] = useState(null);

  useEffect(() => {
    if (kategori === 'trade' && tradeKartlari.length === 0) {
      api.adminListTrade().then((data) => setTradeKartlari(data.items)).catch(() => {});
    }
  }, [kategori]);

  const gorselSec = async () => {
    const izin = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!izin.granted) {
      Alert.alert('İzin gerekli', 'Görsel seçebilmek için galeri izni vermelisin.');
      return;
    }
    const sonuc = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!sonuc.canceled && sonuc.assets?.[0]) {
      const asset = sonuc.assets[0];
      setYeniGorsel({ uri: asset.uri, name: asset.fileName || 'trade.jpg' });
      setSeciliTradeId(null); // yeni görsel varken eski bir kart seçili kalmasın
    }
  };

  const gonder = async () => {
    if (!baslik.trim() || !govde.trim()) {
      setMesaj('Başlık ve metin boş olamaz.');
      return;
    }
    setGonderiliyor(true);
    setMesaj(null);
    try {
      let tradeId = seciliTradeId;

      // Bildirim sekmesinden görsel seçildiyse, göndermeden önce yeni bir
      // trade kartı oluştur ve bildirimi ona bağla — kullanıcı bildirime
      // dokununca görseli ve bilgileri tam olarak görür.
      if (kategori === 'trade' && yeniGorsel) {
        const yukleme = await api.adminUploadTradeImage(yeniGorsel.uri, yeniGorsel.name);
        const yeniKart = await api.adminCreateTrade({ body: govde.trim(), imageUrl: yukleme.imageUrl });
        tradeId = yeniKart.item.id;
      }

      const payload = { category: kategori, title: baslik.trim(), body: govde.trim() };
      if (kategori === 'trade' && tradeId) payload.tradeId = tradeId;
      const data = await api.adminSendNotification(payload);
      setMesaj(`✅ ${data.sent} cihaza gönderildi.`);
      setBaslik('');
      setGovde('');
      setSeciliTradeId(null);
      setYeniGorsel(null);
      if (kategori === 'trade') {
        api.adminListTrade().then((d) => setTradeKartlari(d.items)).catch(() => {});
      }
    } catch (err) {
      setMesaj(err.message);
    } finally {
      setGonderiliyor(false);
    }
  };

  const seciliKategori = KATEGORILER.find((k) => k.key === kategori);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <View style={ORTAK_STIL.kart}>
        <Text style={styles.baslik}>Kategori</Text>
        <View style={styles.kategoriSatiri}>
          {KATEGORILER.map((k) => (
            <Pressable
              key={k.key}
              style={[styles.kategoriChip, kategori === k.key && styles.kategoriChipSecili]}
              onPress={() => setKategori(k.key)}
            >
              <Text style={[styles.kategoriMetin, kategori === k.key && styles.kategoriMetinSecili]}>{k.label}</Text>
            </Pressable>
          ))}
        </View>
        {seciliKategori ? <Text style={styles.kategoriNot}>{seciliKategori.not}</Text> : null}

        {kategori === 'trade' ? (
          <View style={{ marginTop: 14 }}>
            <Text style={styles.altBaslik}>Yeni görsel yükle (yeni kart oluşturur)</Text>
            <Pressable style={styles.gorselAlani} onPress={gorselSec}>
              {yeniGorsel ? (
                <Image source={{ uri: yeniGorsel.uri }} style={styles.gorselOnizleme} resizeMode="cover" />
              ) : (
                <Text style={styles.gorselPlaceholder}>📷 Görsel seç</Text>
              )}
            </Pressable>

            {tradeKartlari.length > 0 ? (
              <>
                <Text style={[styles.altBaslik, { marginTop: 14 }]}>Ya da mevcut bir karta bağlan</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginTop: 8 }}>
                  {tradeKartlari.map((t) => (
                    <Pressable
                      key={t.id}
                      style={[styles.kartChip, seciliTradeId === t.id && styles.kartChipSecili]}
                      onPress={() => { setSeciliTradeId(seciliTradeId === t.id ? null : t.id); setYeniGorsel(null); }}
                    >
                      {t.imageUrl ? <Image source={{ uri: tamGorselUrl(t.imageUrl) }} style={styles.kartChipGorsel} /> : null}
                      <Text style={[styles.kartChipMetin, seciliTradeId === t.id && styles.kartChipMetinSecili]} numberOfLines={1}>
                        {t.body.slice(0, 20)}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </>
            ) : null}
          </View>
        ) : null}

        <TextInput
          style={[styles.input, { marginTop: 16 }]}
          placeholder="Bildirim başlığı"
          placeholderTextColor={RENKLER.metinUcuncul}
          value={baslik}
          onChangeText={setBaslik}
        />
        <TextInput
          style={[styles.input, { marginTop: 10, height: 80, textAlignVertical: 'top' }]}
          multiline
          placeholder={kategori === 'trade' && yeniGorsel ? 'Bu metin hem bildirimde hem yeni kartın bilgisi olarak kullanılır' : 'Bildirim metni'}
          placeholderTextColor={RENKLER.metinUcuncul}
          value={govde}
          onChangeText={setGovde}
        />

        <Pressable style={[ORTAK_STIL.buyukButon, { marginTop: 14 }]} onPress={gonder} disabled={gonderiliyor}>
          {gonderiliyor ? <ActivityIndicator color={RENKLER.bg} /> : <Text style={styles.buttonMetin}>Gönder</Text>}
        </Pressable>
        {mesaj ? <Text style={styles.mesaj}>{mesaj}</Text> : null}
      </View>
    </ScrollView>
  );
}

function olusturStyles(RENKLER) {
  return StyleSheet.create({
  baslik: { fontSize: 14, fontWeight: '700', color: RENKLER.metin },
  altBaslik: { fontSize: 12, fontWeight: '700', color: RENKLER.metinIkincil },
  kategoriSatiri: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  kategoriChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: RENKLER.bg3, borderWidth: 1, borderColor: RENKLER.ayrici },
  kategoriChipSecili: { backgroundColor: RENKLER.vurgu, borderColor: RENKLER.vurgu },
  kategoriMetin: { fontSize: 12.5, fontWeight: '700', color: RENKLER.metinIkincil },
  kategoriMetinSecili: { color: RENKLER.bg },
  kategoriNot: { fontSize: 11.5, color: RENKLER.metinUcuncul, marginTop: 8 },
  gorselAlani: {
    height: 100, borderRadius: 12, backgroundColor: RENKLER.bg3, borderWidth: 1, borderColor: RENKLER.ayrici,
    borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginTop: 8,
  },
  gorselOnizleme: { width: '100%', height: '100%' },
  gorselPlaceholder: { color: RENKLER.metinUcuncul, fontSize: 13 },
  kartChip: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, backgroundColor: RENKLER.bg3, borderWidth: 1, borderColor: RENKLER.ayrici, maxWidth: 130, alignItems: 'center', gap: 6 },
  kartChipSecili: { backgroundColor: RENKLER.vurgu2, borderColor: RENKLER.vurgu2 },
  kartChipGorsel: { width: 40, height: 40, borderRadius: 6 },
  kartChipMetin: { fontSize: 11, color: RENKLER.metinIkincil, textAlign: 'center' },
  kartChipMetinSecili: { color: RENKLER.bg, fontWeight: '700' },
  input: {
    backgroundColor: RENKLER.bg3, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    color: RENKLER.metin, borderWidth: 1, borderColor: RENKLER.ayrici,
  },
  buttonMetin: { color: RENKLER.bg, fontWeight: '800', fontSize: 14 },
  mesaj: { marginTop: 12, color: RENKLER.vurgu2, textAlign: 'center', fontSize: 13 },
  });
}
