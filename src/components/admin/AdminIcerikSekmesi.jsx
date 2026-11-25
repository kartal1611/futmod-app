import { useCallback, useEffect, useState } from 'react';
import { View, Text, TextInput, Image, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { api } from '../../services/api';
import { useRenkler } from '../../constants/theme';
import { Alan, Buton, Cipler, gorselSecVeYukle, onayla, useAdminStil } from './adminOrtak';

const TURLER = [
  { deger: 'sbc', etiket: 'SBC' },
  { deger: 'evolution', etiket: 'Evrim' },
];

function bosForm(tur) {
  return { type: tur, title: '', description: '', expires: '', priceCoins: '', imageUrl: '' };
}

function formdan(item) {
  const p = item.payload || {};
  const evo = item.type === 'evolution';
  return {
    type: item.type,
    title: item.title,
    description: p.description || '',
    expires: (evo ? p.expiry : p.expires) || '',
    priceCoins: (evo ? p.coinsCost : p.priceCoins) ?? '',
    imageUrl: item.imageUrl || '',
  };
}

/** SBC ve Evrim içeriklerini ekleme, düzenleme, silme. Senkron, yöneticinin değişikliğini ezmez. */
export default function AdminIcerikSekmesi() {
  const RENKLER = useRenkler();
  const st = useAdminStil();
  const [tur, setTur] = useState('sbc');
  const [arama, setArama] = useState('');
  const [liste, setListe] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [form, setForm] = useState(null); // { id?, ...alanlar }
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [hata, setHata] = useState(null);

  const yukle = useCallback(async () => {
    setYukleniyor(true);
    try {
      setListe((await api.adminContent(tur, arama.trim())).items || []);
      setHata(null);
    } catch (err) {
      setHata(err.message);
    } finally {
      setYukleniyor(false);
    }
  }, [tur, arama]);

  useEffect(() => { yukle(); }, [tur]);

  const alan = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const kaydet = async () => {
    setKaydediliyor(true);
    setHata(null);
    try {
      const { id, ...veri } = form;
      if (id) await api.adminUpdateContent(id, veri);
      else await api.adminCreateContent(veri);
      setForm(null);
      await yukle();
    } catch (err) {
      setHata(err.message);
    } finally {
      setKaydediliyor(false);
    }
  };

  const gorsel = async () => {
    try {
      const url = await gorselSecVeYukle();
      if (url) setForm((f) => ({ ...f, imageUrl: url }));
    } catch (err) {
      setHata(err.message);
    }
  };

  const sil = (item) => onayla('İçeriği sil', `"${item.title}" kalıcı olarak silinsin mi? Yorumları da silinir.`, async () => {
    try {
      await api.adminDeleteContent(item.id);
      setListe((l) => l.filter((x) => x.id !== item.id));
    } catch (err) {
      setHata(err.message);
    }
  });

  if (form) {
    return (
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        <Text style={st.bolum}>{form.id ? 'İÇERİĞİ DÜZENLE' : 'YENİ İÇERİK'}</Text>
        {!form.id ? <Cipler secenekler={TURLER} secili={form.type} sec={alan('type')} /> : null}
        <Alan etiket="Başlık" deger={form.title} degistir={alan('title')} placeholder="Örn. 84+ Oyuncu Seçimi" />
        <Alan etiket="Açıklama" deger={form.description} degistir={alan('description')} multiline style={{ minHeight: 90 }} />
        <Alan etiket="Bitiş" deger={form.expires} degistir={alan('expires')} placeholder="Örn. 3 gün kaldı" />
        <Alan etiket="Coin maliyeti" deger={form.priceCoins} degistir={alan('priceCoins')} keyboardType="number-pad" />
        <Alan etiket="Görsel bağlantısı (isteğe bağlı)" deger={form.imageUrl} degistir={alan('imageUrl')} autoCapitalize="none" />
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, alignItems: 'center' }}>
          <Buton metin="Galeriden görsel" tur="ikincil" onPress={gorsel} />
          {form.imageUrl ? <Image source={{ uri: form.imageUrl }} style={{ width: 54, height: 54, borderRadius: 4, backgroundColor: RENKLER.bg3 }} /> : null}
        </View>
        {hata ? <Text style={st.hata}>{hata}</Text> : null}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 18 }}>
          <Buton metin="Vazgeç" tur="ikincil" onPress={() => { setForm(null); setHata(null); }} style={{ flex: 1 }} />
          <Buton metin="Kaydet" onPress={kaydet} yukleniyor={kaydediliyor} style={{ flex: 1 }} />
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 8 }} keyboardShouldPersistTaps="handled">
      <Cipler secenekler={TURLER} secili={tur} sec={setTur} />
      <TextInput
        style={[st.arama, { marginTop: 6 }]}
        placeholder="Başlıkta ara"
        placeholderTextColor={RENKLER.metinUcuncul}
        value={arama}
        onChangeText={setArama}
        onSubmitEditing={yukle}
        returnKeyType="search"
      />
      <Buton metin={tur === 'sbc' ? '+ Yeni SBC' : '+ Yeni Evrim'} onPress={() => setForm(bosForm(tur))} />
      {hata ? <Text style={st.hata}>{hata}</Text> : null}
      {yukleniyor ? <ActivityIndicator style={{ marginTop: 20 }} color={RENKLER.vurgu} /> : null}
      {!yukleniyor && liste.length === 0 ? <Text style={st.bos}>İçerik yok.</Text> : null}
      {liste.map((item) => (
        <View key={item.id} style={st.satir}>
          <Text style={st.satirBaslik} numberOfLines={2}>{item.title}</Text>
          <Text style={st.satirAlt} numberOfLines={1}>
            {[item.futggId?.startsWith('adm-') ? 'Yönetici ekledi' : 'Otomatik', item.payload?.expires || item.payload?.expiry].filter(Boolean).join(' · ')}
          </Text>
          <View style={st.eylemler}>
            <Pressable style={st.kucukButon} onPress={() => setForm({ id: item.id, ...formdan(item) })}>
              <Text style={st.kucukMetin}>✏️ Düzenle</Text>
            </Pressable>
            <Pressable style={[st.kucukButon, { borderColor: RENKLER.hata }]} onPress={() => sil(item)}>
              <Text style={[st.kucukMetin, { color: RENKLER.hata }]}>🗑 Sil</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
