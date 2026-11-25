import { useCallback, useEffect, useState } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { api } from '../../services/api';
import { useRenkler } from '../../constants/theme';
import { kategoriAdi, zamanFormatla } from '../../constants/forum';
import { Alan, Buton, onayla, useAdminStil } from './adminOrtak';

/** Forumdaki her başlık ve yorum: düzenle, sil, sabitle, kilitle, yazarı yasakla. */
export default function AdminForumSekmesi() {
  const RENKLER = useRenkler();
  const st = useAdminStil();
  const [arama, setArama] = useState('');
  const [liste, setListe] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState(null);
  const [acik, setAcik] = useState(null); // { item, comments }
  const [duzenle, setDuzenle] = useState(null); // { tur: 'baslik'|'yorum', id, title?, body }
  const [kaydediliyor, setKaydediliyor] = useState(false);

  const yukle = useCallback(async () => {
    setYukleniyor(true);
    try {
      const q = arama.trim();
      const params = { sort: 'new', limit: 40 };
      if (q.length >= 2) params.q = q;
      setListe((await api.forumThreads(params)).items || []);
      setHata(null);
    } catch (err) {
      setHata(err.message);
    } finally {
      setYukleniyor(false);
    }
  }, [arama]);

  useEffect(() => { yukle(); }, []);

  const ac = async (id) => {
    try {
      setAcik(await api.forumThread(id));
    } catch (err) {
      setHata(err.message);
    }
  };

  const guncelle = (yeni) => {
    setListe((l) => l.map((b) => (b.id === yeni.id ? { ...b, ...yeni } : b)));
    if (acik?.item?.id === yeni.id) setAcik((a) => ({ ...a, item: { ...a.item, ...yeni } }));
  };

  const islem = async (fn) => {
    try {
      await fn();
    } catch (err) {
      Alert.alert('Hata', err.message || 'İşlem yapılamadı');
    }
  };

  const sabitle = (b) => islem(async () => guncelle({ ...(await api.forumPin(b.id, !b.isPinned)).item, id: b.id }));
  const kilitle = (b) => islem(async () => guncelle({ ...(await api.forumLock(b.id, !b.isLocked)).item, id: b.id }));
  const sil = (b) => onayla('Başlığı sil', `"${b.title}" ve tüm yorumları kalıcı olarak silinsin mi?`, () => islem(async () => {
    await api.forumDeleteThread(b.id);
    setListe((l) => l.filter((x) => x.id !== b.id));
    setAcik(null);
  }));
  const yorumSil = (c) => onayla('Yorumu sil', 'Bu yorum kalıcı olarak silinsin mi?', () => islem(async () => {
    await api.forumDeleteComment(c.id);
    setAcik((a) => ({ ...a, comments: a.comments.filter((x) => x.id !== c.id) }));
  }));
  const yasakla = (userId, ad) => onayla('Kullanıcıyı yasakla', `${ad} oturumdan atılacak ve tekrar giriş yapamayacak.`, () => islem(async () => {
    await api.forumBanUser(userId, true);
    Alert.alert('Yasaklandı', `${ad} yasaklandı.`);
  }), 'Yasakla');

  const kaydet = async () => {
    setKaydediliyor(true);
    try {
      if (duzenle.tur === 'baslik') {
        const { item } = await api.forumEditThread(duzenle.id, { title: duzenle.title, body: duzenle.body });
        guncelle(item);
      } else {
        await api.forumEditComment(duzenle.id, duzenle.body);
        setAcik((a) => ({ ...a, comments: a.comments.map((c) => (c.id === duzenle.id ? { ...c, body: duzenle.body } : c)) }));
      }
      setDuzenle(null);
    } catch (err) {
      Alert.alert('Hata', err.message || 'Kaydedilemedi');
    } finally {
      setKaydediliyor(false);
    }
  };

  const BaslikEylemleri = ({ b }) => (
    <View style={st.eylemler}>
      {!acik ? <Kucuk metin="💬 Aç" onPress={() => ac(b.id)} /> : null}
      <Kucuk metin="✏️ Düzenle" onPress={() => setDuzenle({ tur: 'baslik', id: b.id, title: b.title, body: b.body || '' })} />
      <Kucuk metin={b.isPinned ? '📌 Sabiti kaldır' : '📌 Sabitle'} onPress={() => sabitle(b)} />
      <Kucuk metin={b.isLocked ? '🔓 Kilidi aç' : '🔒 Kilitle'} onPress={() => kilitle(b)} />
      <Kucuk metin="📣 Manşete ekle" onPress={() => islem(async () => { await api.adminCreateBanner({ threadId: b.id }); Alert.alert('Manşete eklendi', 'Ana sayfadaki kayan bantta en başta görünecek.'); })} />
      <Kucuk metin="🗑 Sil" tehlike onPress={() => sil(b)} />
      {!b.isAdmin ? <Kucuk metin="⛔ Yazarı yasakla" tehlike onPress={() => yasakla(b.userId, b.authorName)} /> : null}
    </View>
  );

  function Kucuk({ metin, onPress, tehlike }) {
    return (
      <Pressable style={[st.kucukButon, tehlike && { borderColor: RENKLER.hata }]} onPress={onPress}>
        <Text style={[st.kucukMetin, tehlike && { color: RENKLER.hata }]}>{metin}</Text>
      </Pressable>
    );
  }

  if (duzenle) {
    return (
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        <Text style={st.bolum}>{duzenle.tur === 'baslik' ? 'BAŞLIĞI DÜZENLE' : 'YORUMU DÜZENLE'}</Text>
        {duzenle.tur === 'baslik' ? <Alan etiket="Başlık" deger={duzenle.title} degistir={(v) => setDuzenle((d) => ({ ...d, title: v }))} /> : null}
        <Alan etiket="Metin" deger={duzenle.body} degistir={(v) => setDuzenle((d) => ({ ...d, body: v }))} multiline style={{ minHeight: 140, textAlignVertical: 'top' }} />
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 18 }}>
          <Buton metin="Vazgeç" tur="ikincil" onPress={() => setDuzenle(null)} style={{ flex: 1 }} />
          <Buton metin="Kaydet" onPress={kaydet} yukleniyor={kaydediliyor} style={{ flex: 1 }} />
        </View>
      </ScrollView>
    );
  }

  if (acik) {
    const b = acik.item;
    return (
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60, gap: 8 }}>
        <Pressable onPress={() => setAcik(null)} hitSlop={10}>
          <Text style={{ color: RENKLER.vurgu, fontWeight: '800' }}>‹ Listeye dön</Text>
        </Pressable>
        <View style={st.satir}>
          <Text style={st.satirAlt}>{b.authorName} · {kategoriAdi(b.category)} · {zamanFormatla(b.createdAt)}</Text>
          <Text style={[st.satirBaslik, { marginTop: 4 }]}>{b.title}</Text>
          {b.body ? <Text style={{ color: RENKLER.metin, marginTop: 6, lineHeight: 20 }}>{b.body}</Text> : null}
          <BaslikEylemleri b={b} />
        </View>
        <Text style={[st.bolum, { marginTop: 8 }]}>YORUMLAR ({acik.comments.length})</Text>
        {acik.comments.length === 0 ? <Text style={st.bos}>Yorum yok.</Text> : null}
        {acik.comments.map((c) => (
          <View key={c.id} style={st.satir}>
            <Text style={st.satirAlt}>{c.authorName} · {zamanFormatla(c.createdAt)}</Text>
            <Text style={{ color: RENKLER.metin, marginTop: 4, lineHeight: 19 }}>{c.body}</Text>
            <View style={st.eylemler}>
              <Kucuk metin="✏️ Düzenle" onPress={() => setDuzenle({ tur: 'yorum', id: c.id, body: c.body })} />
              <Kucuk metin="🗑 Sil" tehlike onPress={() => yorumSil(c)} />
              {!c.isAdmin ? <Kucuk metin="⛔ Yasakla" tehlike onPress={() => yasakla(c.userId, c.authorName)} /> : null}
            </View>
          </View>
        ))}
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 8 }} keyboardShouldPersistTaps="handled">
      <TextInput
        style={st.arama}
        placeholder="Başlıklarda ara (boşsa en yeniler)"
        placeholderTextColor={RENKLER.metinUcuncul}
        value={arama}
        onChangeText={setArama}
        onSubmitEditing={yukle}
        returnKeyType="search"
      />
      {hata ? <Text style={st.hata}>{hata}</Text> : null}
      {yukleniyor ? <ActivityIndicator style={{ marginTop: 20 }} color={RENKLER.vurgu} /> : null}
      {!yukleniyor && liste.length === 0 ? <Text style={st.bos}>Başlık bulunamadı.</Text> : null}
      {liste.map((b) => (
        <View key={b.id} style={[st.satir, b.isPinned && { borderColor: RENKLER.vurgu }]}>
          <Text style={st.satirAlt}>{b.authorName} · {kategoriAdi(b.category)} · {zamanFormatla(b.createdAt)}</Text>
          <Text style={[st.satirBaslik, { marginTop: 3 }]} numberOfLines={2}>{b.title}</Text>
          <Text style={st.satirAlt}>💬 {b.commentCount} · ▲ {b.voteCount}{b.isLocked ? ' · 🔒 Kilitli' : ''}{b.isPinned ? ' · 📌 Sabit' : ''}</Text>
          <BaslikEylemleri b={b} />
        </View>
      ))}
    </ScrollView>
  );
}
