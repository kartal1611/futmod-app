import { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator, Alert, StyleSheet, Switch } from 'react-native';
import { api } from '../../services/api';
import { useRenkler, useOrtakStil } from '../../constants/theme';

export default function AdminHizmetlerSekmesi() {
  const RENKLER = useRenkler();
  const ORTAK_STIL = useOrtakStil();
  const styles = olusturStyles(RENKLER);
  const [liste, setListe] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [duzenlenenId, setDuzenlenenId] = useState(null);
  const [baslik, setBaslik] = useState('');
  const [aciklama, setAciklama] = useState('');
  const [emoji, setEmoji] = useState('⭐');
  const [sortOrder, setSortOrder] = useState('0');
  const [active, setActive] = useState(true);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [mesaj, setMesaj] = useState(null);

  const listeyiGetir = () => {
    setYukleniyor(true);
    api.adminListServices().then((data) => setListe(data.items)).finally(() => setYukleniyor(false));
  };

  useEffect(() => { listeyiGetir(); }, []);

  const formuSifirla = () => {
    setDuzenlenenId(null);
    setBaslik('');
    setAciklama('');
    setEmoji('⭐');
    setSortOrder('0');
    setActive(true);
  };

  const duzenlemeyeBasla = (item) => {
    setDuzenlenenId(item.id);
    setBaslik(item.title);
    setAciklama(item.description || '');
    setEmoji(item.emoji || '⭐');
    setSortOrder(String(item.sortOrder ?? 0));
    setActive(item.active);
  };

  const kaydet = async () => {
    if (!baslik.trim()) return;
    setKaydediliyor(true);
    setMesaj(null);
    try {
      const payload = { title: baslik.trim(), description: aciklama.trim() || null, emoji, sortOrder: Number(sortOrder) || 0, active };
      if (duzenlenenId) {
        await api.adminUpdateService(duzenlenenId, payload);
        setMesaj('✅ Hizmet güncellendi.');
      } else {
        await api.adminCreateService(payload);
        setMesaj('✅ Yeni hizmet eklendi.');
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
    Alert.alert('Hizmeti sil', `"${item.title}" hizmetini silmek istediğine emin misin?`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.adminDeleteService(item.id);
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
        <Text style={styles.baslik}>{duzenlenenId ? 'Hizmeti Düzenle' : 'Yeni Hizmet'}</Text>
        <Text style={styles.aciklama}>Ana sayfada "Diğer Hizmetler" altında kart olarak görünür. Tıklayınca Telegram'da bu hizmet için mesaj hazır gelir.</Text>

        <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
          <TextInput
            style={[styles.input, { width: 64, textAlign: 'center', fontSize: 20 }]}
            value={emoji}
            onChangeText={setEmoji}
            maxLength={4}
          />
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Başlık (örn: Rank Boost)"
            placeholderTextColor={RENKLER.metinUcuncul}
            value={baslik}
            onChangeText={setBaslik}
          />
        </View>

        <TextInput
          style={[styles.input, { marginTop: 10, minHeight: 70, textAlignVertical: 'top' }]}
          multiline
          placeholder="Kısa açıklama (opsiyonel)"
          placeholderTextColor={RENKLER.metinUcuncul}
          value={aciklama}
          onChangeText={setAciklama}
        />

        <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, alignItems: 'center' }}>
          <TextInput
            style={[styles.input, { width: 80 }]}
            placeholder="Sıra"
            placeholderTextColor={RENKLER.metinUcuncul}
            keyboardType="number-pad"
            value={sortOrder}
            onChangeText={setSortOrder}
          />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, justifyContent: 'flex-end' }}>
            <Text style={{ color: RENKLER.metinIkincil, fontSize: 13 }}>Aktif</Text>
            <Switch value={active} onValueChange={setActive} />
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
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

      <Text style={styles.listeBaslik}>Kayıtlı Hizmetler</Text>
      {yukleniyor ? (
        <ActivityIndicator style={{ marginTop: 20 }} color={RENKLER.vurgu} />
      ) : liste.length === 0 ? (
        <Text style={styles.bos}>Henüz hizmet yok.</Text>
      ) : (
        liste.map((item) => (
          <View key={item.id} style={[ORTAK_STIL.kart, { marginTop: 10, flexDirection: 'row', gap: 10, alignItems: 'center', opacity: item.active ? 1 : 0.5 }]}>
            <Text style={{ fontSize: 26 }}>{item.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.listeMetin} numberOfLines={1}>{item.title}{!item.active ? ' (pasif)' : ''}</Text>
              {item.description ? <Text style={styles.listeAciklama} numberOfLines={2}>{item.description}</Text> : null}
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
  input: {
    backgroundColor: RENKLER.bg3, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    color: RENKLER.metin, borderWidth: 1, borderColor: RENKLER.ayrici, fontSize: 13.5,
  },
  buttonMetin: { color: RENKLER.bg, fontWeight: '800', fontSize: 14 },
  vazgecButon: { paddingHorizontal: 18, justifyContent: 'center', borderRadius: 14, backgroundColor: RENKLER.bg3 },
  vazgecMetin: { color: RENKLER.metinIkincil, fontWeight: '700' },
  mesaj: { marginTop: 12, color: RENKLER.vurgu2, textAlign: 'center', fontSize: 13 },
  listeBaslik: { fontSize: 14, fontWeight: '700', color: RENKLER.metin, marginTop: 20, marginBottom: 6 },
  bos: { color: RENKLER.metinIkincil, fontSize: 12.5, marginTop: 8 },
  listeMetin: { fontSize: 13.5, fontWeight: '700', color: RENKLER.metin },
  listeAciklama: { fontSize: 11.5, color: RENKLER.metinIkincil, marginTop: 2 },
  duzenleLink: { fontSize: 12, color: RENKLER.vurgu2, fontWeight: '700' },
  silLink: { fontSize: 12, color: RENKLER.hata, fontWeight: '700' },
  });
}
