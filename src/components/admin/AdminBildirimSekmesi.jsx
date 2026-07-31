import { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { api } from '../../services/api';
import { RENKLER, ORTAK_STIL } from '../../constants/theme';

const KATEGORILER = [
  { key: 'trade', label: 'Trade', not: 'Sadece VIP üyelere gider' },
  { key: 'sbc', label: 'SBC', not: 'SBC bildirimini açan herkese gider' },
  { key: 'yayin', label: 'Yayın', not: 'Yayın bildirimini açan herkese gider' },
  { key: 'haberler', label: 'Haberler', not: 'Haber bildirimini açan herkese gider' },
];

export default function AdminBildirimSekmesi() {
  const [kategori, setKategori] = useState('sbc');
  const [baslik, setBaslik] = useState('');
  const [govde, setGovde] = useState('');
  const [tradeKartlari, setTradeKartlari] = useState([]);
  const [seciliTradeId, setSeciliTradeId] = useState(null);
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [mesaj, setMesaj] = useState(null);

  useEffect(() => {
    if (kategori === 'trade' && tradeKartlari.length === 0) {
      api.adminListTrade().then((data) => setTradeKartlari(data.items)).catch(() => {});
    }
  }, [kategori]);

  const gonder = async () => {
    if (!baslik.trim() || !govde.trim()) return;
    setGonderiliyor(true);
    setMesaj(null);
    try {
      const payload = { category: kategori, title: baslik.trim(), body: govde.trim() };
      if (kategori === 'trade' && seciliTradeId) payload.tradeId = seciliTradeId;
      const data = await api.adminSendNotification(payload);
      setMesaj(`✅ ${data.sent} cihaza gönderildi.`);
      setBaslik('');
      setGovde('');
      setSeciliTradeId(null);
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

        {kategori === 'trade' && tradeKartlari.length > 0 ? (
          <View style={{ marginTop: 14 }}>
            <Text style={styles.altBaslik}>Hangi karta bağlansın? (opsiyonel)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginTop: 8 }}>
              {tradeKartlari.map((t) => (
                <Pressable
                  key={t.id}
                  style={[styles.kartChip, seciliTradeId === t.id && styles.kartChipSecili]}
                  onPress={() => setSeciliTradeId(seciliTradeId === t.id ? null : t.id)}
                >
                  <Text style={[styles.kartChipMetin, seciliTradeId === t.id && styles.kartChipMetinSecili]} numberOfLines={1}>
                    {t.body.slice(0, 24)}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
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
          placeholder="Bildirim metni"
          placeholderTextColor={RENKLER.metinUcuncul}
          value={govde}
          onChangeText={setGovde}
        />

        <Pressable style={[ORTAK_STIL.buyukButon, { marginTop: 14 }]} onPress={gonder} disabled={gonderiliyor}>
          {gonderiliyor ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonMetin}>Gönder</Text>}
        </Pressable>
        {mesaj ? <Text style={styles.mesaj}>{mesaj}</Text> : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  baslik: { fontSize: 14, fontWeight: '700', color: RENKLER.metin },
  altBaslik: { fontSize: 12, fontWeight: '700', color: RENKLER.metinIkincil },
  kategoriSatiri: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  kategoriChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: RENKLER.bg3, borderWidth: 1, borderColor: RENKLER.ayrici },
  kategoriChipSecili: { backgroundColor: RENKLER.vurgu, borderColor: RENKLER.vurgu },
  kategoriMetin: { fontSize: 12.5, fontWeight: '700', color: RENKLER.metinIkincil },
  kategoriMetinSecili: { color: RENKLER.bg },
  kategoriNot: { fontSize: 11.5, color: RENKLER.metinUcuncul, marginTop: 8 },
  kartChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: RENKLER.bg3, borderWidth: 1, borderColor: RENKLER.ayrici, maxWidth: 140 },
  kartChipSecili: { backgroundColor: RENKLER.vurgu2, borderColor: RENKLER.vurgu2 },
  kartChipMetin: { fontSize: 11.5, color: RENKLER.metinIkincil },
  kartChipMetinSecili: { color: RENKLER.bg, fontWeight: '700' },
  input: {
    backgroundColor: RENKLER.bg3, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    color: RENKLER.metin, borderWidth: 1, borderColor: RENKLER.ayrici,
  },
  buttonMetin: { color: '#fff', fontWeight: '800', fontSize: 14 },
  mesaj: { marginTop: 12, color: RENKLER.vurgu2, textAlign: 'center', fontSize: 13 },
});
