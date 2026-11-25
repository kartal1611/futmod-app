import { useCallback, useEffect, useState } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { api } from '../../services/api';
import { useRenkler } from '../../constants/theme';
import OyuncuKarti from '../OyuncuKarti';
import { Alan, Buton, Cipler, gorselSecVeYukle, onayla, useAdminStil } from './adminOrtak';

const POZISYONLAR = ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LM', 'RM', 'LW', 'RW', 'ST'];

const BOS = { name: '', rating: '', position: 'ST', rarity: '', club: '', league: '', nation: '', priceCoins: '', imageUrl: '', versionId: null };

/** Kart ekleme, düzenleme, silme. TOTW / promo grubuna bağlanırsa İçerik sekmesinde o grupta görünür. */
export default function AdminKartlarSekmesi() {
  const RENKLER = useRenkler();
  const st = useAdminStil();
  const [arama, setArama] = useState('');
  const [liste, setListe] = useState([]);
  const [gruplar, setGruplar] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [form, setForm] = useState(null);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [hata, setHata] = useState(null);

  const yukle = useCallback(async () => {
    setYukleniyor(true);
    try {
      setListe((await api.adminPlayers(arama.trim())).items || []);
      setHata(null);
    } catch (err) {
      setHata(err.message);
    } finally {
      setYukleniyor(false);
    }
  }, [arama]);

  useEffect(() => {
    yukle();
    api.adminGroups().then((d) => setGruplar(d.items || [])).catch(() => {});
  }, []);

  const alan = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const kaydet = async () => {
    setKaydediliyor(true);
    setHata(null);
    try {
      const { id, ...veri } = form;
      if (id) await api.adminUpdatePlayer(id, veri);
      else await api.adminCreatePlayer(veri);
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

  const sil = (k) => onayla('Kartı sil', `${k.name} (${k.rating}) kalıcı olarak silinsin mi? Forum başlıklarındaki bağlantısı da kalkar.`, async () => {
    try {
      await api.adminDeletePlayer(k.id);
      setListe((l) => l.filter((x) => x.id !== k.id));
    } catch (err) {
      setHata(err.message);
    }
  });

  if (form) {
    return (
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        <Text style={st.bolum}>{form.id ? 'KARTI DÜZENLE' : 'YENİ KART'}</Text>
        <View style={{ alignItems: 'center', marginTop: 10 }}>
          <OyuncuKarti yuzUrl={form.imageUrl || null} isim={form.name || 'Oyuncu'} nadirlik={form.rarity} rating={Number(form.rating) || ''} pozisyon={form.position} genislik={110} />
        </View>
        <Alan etiket="Oyuncu adı" deger={form.name} degistir={alan('name')} />
        <Alan etiket="Reyting" deger={form.rating} degistir={alan('rating')} keyboardType="number-pad" maxLength={2} />
        <Text style={[st.satirAlt, { marginTop: 10 }]}>POZİSYON</Text>
        <Cipler secenekler={POZISYONLAR.map((p) => ({ deger: p, etiket: p }))} secili={form.position} sec={alan('position')} />
        <Alan etiket="Nadirlik (ör. TOTW, Gold, Icon)" deger={form.rarity} degistir={alan('rarity')} />
        <Alan etiket="Kulüp" deger={form.club} degistir={alan('club')} />
        <Alan etiket="Lig" deger={form.league} degistir={alan('league')} />
        <Alan etiket="Ülke" deger={form.nation} degistir={alan('nation')} />
        <Alan etiket="Fiyat (coin)" deger={form.priceCoins} degistir={alan('priceCoins')} keyboardType="number-pad" />
        <Text style={[st.satirAlt, { marginTop: 10 }]}>GRUP (İçerik sekmesinde nerede görünsün)</Text>
        <Cipler
          secenekler={[{ deger: null, etiket: 'Yok' }, ...gruplar.map((g) => ({ deger: g.versionId, etiket: g.title }))]}
          secili={form.versionId ?? null}
          sec={alan('versionId')}
        />
        <Alan etiket="Görsel bağlantısı (isteğe bağlı)" deger={form.imageUrl} degistir={alan('imageUrl')} autoCapitalize="none" />
        <Buton metin="Galeriden görsel" tur="ikincil" onPress={gorsel} style={{ marginTop: 10 }} />
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
      <TextInput
        style={st.arama}
        placeholder="Oyuncu adıyla ara (boşsa en yeniler)"
        placeholderTextColor={RENKLER.metinUcuncul}
        value={arama}
        onChangeText={setArama}
        onSubmitEditing={yukle}
        returnKeyType="search"
      />
      <Buton metin="+ Yeni kart" onPress={() => setForm({ ...BOS })} />
      {hata ? <Text style={st.hata}>{hata}</Text> : null}
      {yukleniyor ? <ActivityIndicator style={{ marginTop: 20 }} color={RENKLER.vurgu} /> : null}
      {!yukleniyor && liste.length === 0 ? <Text style={st.bos}>Kart bulunamadı.</Text> : null}
      {liste.map((k) => (
        <View key={k.id} style={[st.satir, { flexDirection: 'row', gap: 12, alignItems: 'center' }]}>
          <OyuncuKarti yuzUrl={k.imageUrl} isim={k.name} nadirlik={k.rarity} rating={k.rating} pozisyon={k.position} genislik={58} />
          <View style={{ flex: 1 }}>
            <Text style={st.satirBaslik} numberOfLines={1}>{k.name}</Text>
            <Text style={st.satirAlt} numberOfLines={1}>{[k.rating, k.position, k.rarity, k.club].filter(Boolean).join(' · ')}</Text>
            <Text style={st.satirAlt}>{k.adminEkledi ? 'Yönetici ekledi' : 'Otomatik'}{k.priceCoins ? ` · ${k.priceCoins.toLocaleString('tr-TR')} coin` : ''}</Text>
            <View style={st.eylemler}>
              <Pressable style={st.kucukButon} onPress={() => setForm({ ...BOS, ...k, rating: String(k.rating ?? ''), priceCoins: k.priceCoins ?? '' })}>
                <Text style={st.kucukMetin}>✏️ Düzenle</Text>
              </Pressable>
              <Pressable style={[st.kucukButon, { borderColor: RENKLER.hata }]} onPress={() => sil(k)}>
                <Text style={[st.kucukMetin, { color: RENKLER.hata }]}>🗑 Sil</Text>
              </Pressable>
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
