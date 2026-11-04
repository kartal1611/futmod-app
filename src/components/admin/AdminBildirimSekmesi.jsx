import { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { api } from '../../services/api';
import { useRenkler, useOrtakStil } from '../../constants/theme';

const KATEGORILER = [
  { key: 'sbc', label: 'SBC', not: 'SBC bildirimini açan herkese gider' },
  { key: 'yayin', label: 'Yayın', not: 'Yayın bildirimini açan herkese gider' },
  { key: 'haberler', label: 'Haberler', not: 'Haber bildirimini açan herkese gider' },
];

export default function AdminBildirimSekmesi() {
  const RENKLER = useRenkler();
  const ORTAK_STIL = useOrtakStil();
  const styles = olusturStyles(RENKLER);
  const [kategori, setKategori] = useState('sbc');
  const [baslik, setBaslik] = useState('');
  const [govde, setGovde] = useState('');
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [mesaj, setMesaj] = useState(null);

  const gonder = async () => {
    if (!baslik.trim() || !govde.trim()) {
      setMesaj('Başlık ve metin boş olamaz.');
      return;
    }
    setGonderiliyor(true);
    setMesaj(null);
    try {
      const payload = { category: kategori, title: baslik.trim(), body: govde.trim() };
      const data = await api.adminSendNotification(payload);
      setMesaj(`✅ ${data.sent} cihaza gönderildi.`);
      setBaslik('');
      setGovde('');
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
          placeholder="Bildirim metni"
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
  kategoriSatiri: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  kategoriChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: RENKLER.bg3, borderWidth: 1, borderColor: RENKLER.ayrici },
  kategoriChipSecili: { backgroundColor: RENKLER.vurgu, borderColor: RENKLER.vurgu },
  kategoriMetin: { fontSize: 12.5, fontWeight: '700', color: RENKLER.metinIkincil },
  kategoriMetinSecili: { color: RENKLER.bg },
  kategoriNot: { fontSize: 11.5, color: RENKLER.metinUcuncul, marginTop: 8 },
  input: {
    backgroundColor: RENKLER.bg3, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    color: RENKLER.metin, borderWidth: 1, borderColor: RENKLER.ayrici,
  },
  buttonMetin: { color: RENKLER.bg, fontWeight: '800', fontSize: 14 },
  mesaj: { marginTop: 12, color: RENKLER.vurgu2, textAlign: 'center', fontSize: 13 },
  });
}
