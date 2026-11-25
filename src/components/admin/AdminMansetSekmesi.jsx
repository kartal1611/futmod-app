import { useCallback, useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, Pressable, ActivityIndicator, Switch } from 'react-native';
import { api } from '../../services/api';
import { useRenkler } from '../../constants/theme';
import { tamGorselUrl } from '../../constants/forum';
import { Alan, Buton, gorselSecVeYukle, onayla, useAdminStil } from './adminOrtak';

const BOS = { title: '', subtitle: '', imageUrl: '', linkUrl: '', threadId: null, threadTitle: null };

/**
 * Forum ana sayfasındaki dönen bant. Buraya eklenen slaytlar sırayla en başta görünür,
 * kalan yerleri sıcak konular ve güncel TOTW doldurur. Bir forum başlığını eklemek için
 * Forum sekmesinde ya da başlığın içinde "Manşete ekle"ye bas.
 */
export default function AdminMansetSekmesi() {
  const RENKLER = useRenkler();
  const st = useAdminStil();
  const [liste, setListe] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [form, setForm] = useState(null);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [hata, setHata] = useState(null);

  const yukle = useCallback(async () => {
    try {
      setListe((await api.adminBanner()).items || []);
      setHata(null);
    } catch (err) {
      setHata(err.message);
    } finally {
      setYukleniyor(false);
    }
  }, []);

  useEffect(() => { yukle(); }, [yukle]);

  const islem = async (fn) => {
    try {
      await fn();
    } catch (err) {
      setHata(err.message);
    }
  };

  const alan = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const kaydet = async () => {
    setKaydediliyor(true);
    setHata(null);
    try {
      const veri = { title: form.title, subtitle: form.subtitle, imageUrl: form.imageUrl, linkUrl: form.threadId ? null : form.linkUrl };
      if (form.id) await api.adminUpdateBanner(form.id, veri);
      else await api.adminCreateBanner(veri);
      setForm(null);
      await yukle();
    } catch (err) {
      setHata(err.message);
    } finally {
      setKaydediliyor(false);
    }
  };

  const gorsel = () => islem(async () => {
    const url = await gorselSecVeYukle();
    if (url) setForm((f) => ({ ...f, imageUrl: url }));
  });

  if (form) {
    return (
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        <Text style={st.bolum}>{form.id ? 'MANŞETİ DÜZENLE' : 'YENİ MANŞET'}</Text>
        {form.threadId ? <Text style={[st.satirAlt, { marginTop: 8 }]}>Bağlı forum başlığı: {form.threadTitle || `#${form.threadId}`}</Text> : null}
        <Alan etiket="Başlık" deger={form.title} degistir={alan('title')} placeholder="Örn. Yeni promo geldi!" />
        <Alan etiket="Alt yazı (isteğe bağlı)" deger={form.subtitle} degistir={alan('subtitle')} multiline />
        {!form.threadId ? (
          <Alan etiket="Bağlantı (isteğe bağlı, https://…)" deger={form.linkUrl} degistir={alan('linkUrl')} autoCapitalize="none" keyboardType="url" />
        ) : null}
        <Alan etiket="Görsel bağlantısı (isteğe bağlı)" deger={form.imageUrl} degistir={alan('imageUrl')} autoCapitalize="none" />
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, alignItems: 'center' }}>
          <Buton metin="Galeriden görsel" tur="ikincil" onPress={gorsel} />
          {form.imageUrl ? <Image source={{ uri: tamGorselUrl(form.imageUrl) }} style={{ width: 54, height: 54, borderRadius: 4, backgroundColor: RENKLER.bg3 }} /> : null}
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
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 8 }}>
      <Text style={st.satirAlt}>
        Ana sayfadaki kayan bant. Buradakiler sırayla en başta görünür; kalan yerleri sıcak konular ve TOTW doldurur.
        Forum başlığı eklemek için Forum sekmesinde ya da başlığın içinde “📣 Manşete ekle”ye bas.
      </Text>
      <Buton metin="+ Yeni manşet" onPress={() => setForm({ ...BOS })} />
      {hata ? <Text style={st.hata}>{hata}</Text> : null}
      {yukleniyor ? <ActivityIndicator style={{ marginTop: 20 }} color={RENKLER.vurgu} /> : null}
      {!yukleniyor && liste.length === 0 ? <Text style={st.bos}>Manşet yok, bantta yalnız sıcak konular ve TOTW görünüyor.</Text> : null}
      {liste.map((m, i) => (
        <View key={m.id} style={[st.satir, !m.isActive && { opacity: 0.55 }]}>
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            {m.imageUrl ? <Image source={{ uri: tamGorselUrl(m.imageUrl) }} style={{ width: 46, height: 46, borderRadius: 4, backgroundColor: RENKLER.bg3 }} /> : null}
            <View style={{ flex: 1 }}>
              <Text style={st.satirBaslik} numberOfLines={2}>{i + 1}. {m.title}</Text>
              <Text style={st.satirAlt} numberOfLines={1}>{m.threadId ? `💬 Forum başlığı: ${m.threadTitle || m.threadId}` : m.linkUrl ? `🔗 ${m.linkUrl}` : 'Bağlantısız'}</Text>
            </View>
            <Switch value={m.isActive} onValueChange={(v) => islem(async () => { await api.adminUpdateBanner(m.id, { isActive: v }); await yukle(); })} />
          </View>
          <View style={st.eylemler}>
            <Pressable style={[st.kucukButon, i === 0 && { opacity: 0.4 }]} disabled={i === 0} onPress={() => islem(async () => setListe((await api.adminMoveBanner(m.id, 'up')).items))}>
              <Text style={st.kucukMetin}>▲ Yukarı</Text>
            </Pressable>
            <Pressable style={[st.kucukButon, i === liste.length - 1 && { opacity: 0.4 }]} disabled={i === liste.length - 1} onPress={() => islem(async () => setListe((await api.adminMoveBanner(m.id, 'down')).items))}>
              <Text style={st.kucukMetin}>▼ Aşağı</Text>
            </Pressable>
            <Pressable style={st.kucukButon} onPress={() => setForm({ ...BOS, ...m, subtitle: m.subtitle || '', imageUrl: m.imageUrl || '', linkUrl: m.linkUrl || '' })}>
              <Text style={st.kucukMetin}>✏️ Düzenle</Text>
            </Pressable>
            <Pressable style={[st.kucukButon, { borderColor: RENKLER.hata }]} onPress={() => onayla('Manşeti kaldır', `"${m.title}" banttan kaldırılsın mı? Forum başlığı silinmez.`, () => islem(async () => { await api.adminDeleteBanner(m.id); await yukle(); }), 'Kaldır')}>
              <Text style={[st.kucukMetin, { color: RENKLER.hata }]}>🗑 Kaldır</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
