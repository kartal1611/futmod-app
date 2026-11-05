import { useEffect, useState } from 'react';
import { View, Text, TextInput, Image, Pressable, ScrollView, Switch, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import NeonParilti from '../components/NeonParilti';
import OyuncuKarti from '../components/OyuncuKarti';
import { api } from '../services/api';
import { useRenkler, useOrtakStil } from '../constants/theme';
import { FORUM_KATEGORILERI, kategoriAdi } from '../constants/forum';

const MIN_BASLIK = 5;
const MIN_SECENEK = 2;
const MAX_SECENEK = 6;
const MAX_GORSEL = 4;
const MAX_KART = 3;
const MAX_ETIKET = 3;
const TURLER = [
  { key: 'gonderi', label: 'Gönderi', emoji: '📝' },
  { key: 'anket', label: 'Anket', emoji: '📊', anket: true },
  { key: 'sbc', label: 'SBC', emoji: '🛡️', kategori: 'sbc-evo' },
  { key: 'kadro', label: 'Kadro', emoji: '🧩', kategori: 'kadro' },
  { key: 'taktik', label: 'Taktik', emoji: '🧠', kategori: 'taktik' },
];

/** Opens a new thread, or edits the title and text of an existing one with ?duzenle=<id>. */
export default function ForumYeniBaslikEkrani() {
  const RENKLER = useRenkler();
  const ORTAK_STIL = useOrtakStil();
  const styles = olusturStyles(RENKLER);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const duzenleId = params.duzenle ? Number(params.duzenle) : null;
  const [tur, setTur] = useState('gonderi');
  const [kategori, setKategori] = useState(params.kategori || 'genel');
  const [kategoriAcik, setKategoriAcik] = useState(false);
  const [baslik, setBaslik] = useState(params.baslikMetni || '');
  const [metin, setMetin] = useState('');
  const [gorseller, setGorseller] = useState([]);
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [secenekler, setSecenekler] = useState(['', '']);
  const [kartlar, setKartlar] = useState([]);
  const [kartArama, setKartArama] = useState('');
  const [kartSonuc, setKartSonuc] = useState([]);
  const [etiketler, setEtiketler] = useState([]);
  const [etiketMetin, setEtiketMetin] = useState('');
  const [bildirim, setBildirim] = useState(true);
  const anketAcik = tur === 'anket';

  useEffect(() => {
    if (!duzenleId) return;
    api.forumThread(duzenleId).then((data) => {
      setBaslik(data.item.title);
      setMetin(data.item.body);
    }).catch((err) => Alert.alert('Hata', err.message || 'Başlık yüklenemedi'));
  }, [duzenleId]);

  useEffect(() => {
    const aranan = kartArama.trim();
    if (aranan.length < 2) { setKartSonuc([]); return undefined; }
    const zamanlayici = setTimeout(() => {
      api.players({ q: aranan, limit: 8 }).then((data) => setKartSonuc(data.items || [])).catch(() => setKartSonuc([]));
    }, 300);
    return () => clearTimeout(zamanlayici);
  }, [kartArama]);

  const doluSecenekler = secenekler.map((s) => s.trim()).filter(Boolean);
  const anketHazir = !anketAcik || doluSecenekler.length >= MIN_SECENEK;
  const hazir = baslik.trim().length >= MIN_BASLIK && anketHazir && !gonderiliyor;

  const turSec = (t) => {
    setTur(t.key);
    if (t.kategori) setKategori(t.kategori);
  };

  const secenekYaz = (i, deger) => setSecenekler((prev) => prev.map((s, j) => (j === i ? deger : s)));

  const kartEkle = (p) => {
    setKartlar((prev) => (prev.length >= MAX_KART || prev.some((k) => k.futggId === p.futggId) ? prev : [...prev, p]));
    setKartArama('');
    setKartSonuc([]);
  };

  const etiketEkle = () => {
    const temiz = etiketMetin.replace(/[#\s]/g, '');
    if (temiz && etiketler.length < MAX_ETIKET && !etiketler.includes(temiz)) setEtiketler((prev) => [...prev, temiz]);
    setEtiketMetin('');
  };

  const gorselSec = async () => {
    const izin = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!izin.granted) {
      Alert.alert('İzin gerekli', 'Galeriye erişim izni vermelisin.');
      return;
    }
    const sonuc = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsMultipleSelection: true,
      selectionLimit: MAX_GORSEL - gorseller.length,
    });
    if (!sonuc.canceled && sonuc.assets?.length) {
      setGorseller((prev) => [...prev, ...sonuc.assets].slice(0, MAX_GORSEL));
    }
  };

  const kaydet = async () => {
    if (!hazir) return;
    setGonderiliyor(true);
    try {
      if (duzenleId) {
        await api.forumEditThread(duzenleId, { title: baslik.trim(), body: metin.trim() });
        router.back();
        return;
      }
      const yuklenenler = [];
      for (const g of gorseller) {
        yuklenenler.push((await api.forumUploadImage(g.uri, g.fileName)).imageUrl);
      }
      const data = await api.forumCreateThread({
        category: kategori,
        title: baslik.trim(),
        body: metin.trim(),
        imageUrls: yuklenenler,
        tags: etiketler,
        playerIds: kartlar.map((k) => k.futggId),
        notifyMe: bildirim,
        ...(anketAcik ? { pollOptions: doluSecenekler } : {}),
      });
      router.replace(`/forum/${data.item.id}`);
    } catch (err) {
      Alert.alert('Hata', err.message || 'Kaydedilemedi');
      setGonderiliyor(false);
    }
  };

  return (
    <KeyboardAvoidingView style={ORTAK_STIL.ekran} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <NeonParilti />
      <View style={[styles.ustBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.geriButon} accessibilityRole="button" accessibilityLabel="Kapat">
          <Text style={styles.geriMetin}>✕</Text>
        </Pressable>
        <Text style={styles.baslikMetin}>{duzenleId ? 'Başlığı Düzenle' : 'Başlık Oluştur'}</Text>
        <Pressable onPress={kaydet} disabled={!hazir} style={[styles.paylas, !hazir && { opacity: 0.5 }]}>
          {gonderiliyor ? <ActivityIndicator color={RENKLER.bg} /> : <Text style={styles.paylasMetin}>{duzenleId ? 'Kaydet' : 'Paylaş'}</Text>}
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
        {!duzenleId ? (
          <>
            <View style={styles.turSatiri}>
              {TURLER.map((t) => (
                <Pressable key={t.key} onPress={() => turSec(t)} style={[styles.turButon, tur === t.key && { borderColor: RENKLER.vurgu }]}>
                  <Text style={styles.turEmoji}>{t.emoji}</Text>
                  <Text style={[styles.turMetin, tur === t.key && { color: RENKLER.vurgu }]}>{t.label}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.etiket}>Kategori</Text>
            <Pressable onPress={() => setKategoriAcik((v) => !v)} style={styles.secici}>
              <Text style={styles.seciciMetin}>{kategoriAdi(kategori)}</Text>
              <Text style={styles.seciciOk}>{kategoriAcik ? '▴' : '▾'}</Text>
            </Pressable>
            {kategoriAcik ? (
              <View style={styles.kategoriSatiri}>
                {FORUM_KATEGORILERI.map((k) => (
                  <Pressable
                    key={k.key}
                    onPress={() => { setKategori(k.key); setKategoriAcik(false); }}
                    style={[styles.kategoriButon, kategori === k.key && { borderColor: RENKLER.vurgu }]}
                  >
                    <Text style={[styles.kategoriMetin, kategori === k.key && { color: RENKLER.vurgu }]}>{k.emoji} {k.label}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </>
        ) : null}

        <Text style={styles.etiket}>Başlık</Text>
        <TextInput
          style={styles.girdi}
          placeholder="Ne sormak istiyorsun?"
          placeholderTextColor={RENKLER.metinUcuncul}
          value={baslik}
          onChangeText={setBaslik}
          maxLength={120}
        />
        <Text style={styles.sayac}>{baslik.length}/120</Text>

        <Text style={styles.etiket}>İçerik</Text>
        <TextInput
          style={[styles.girdi, { minHeight: 110, textAlignVertical: 'top' }]}
          placeholder="Bütçen, kadron, aklındaki oyuncular... @ ile birinden bahset"
          placeholderTextColor={RENKLER.metinUcuncul}
          value={metin}
          onChangeText={setMetin}
          maxLength={2000}
          multiline
        />
        <Text style={styles.sayac}>{metin.length}/2000</Text>

        {!duzenleId ? (
          <>
            {anketAcik ? (
              <View style={{ gap: 8, marginTop: 8 }}>
                <Text style={styles.etiket}>Anket Seçenekleri</Text>
                {secenekler.map((s, i) => (
                  <TextInput
                    key={i}
                    style={styles.girdi}
                    placeholder={`Seçenek ${i + 1}`}
                    placeholderTextColor={RENKLER.metinUcuncul}
                    value={s}
                    onChangeText={(v) => secenekYaz(i, v)}
                    maxLength={60}
                  />
                ))}
                {secenekler.length < MAX_SECENEK ? (
                  <Pressable onPress={() => setSecenekler((prev) => [...prev, ''])} style={styles.secenekEkle}>
                    <Text style={[styles.gorselMetin, { color: RENKLER.vurgu }]}>+ Seçenek ekle</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}

            <Text style={styles.etiket}>Oyuncu Kartı (en fazla {MAX_KART})</Text>
            {kartlar.length > 0 ? (
              <View style={styles.gorselSatiri}>
                {kartlar.map((k) => (
                  <Pressable key={k.futggId} onPress={() => setKartlar((prev) => prev.filter((x) => x.futggId !== k.futggId))} accessibilityRole="button" accessibilityLabel={`${k.name} kartını kaldır`}>
                    <OyuncuKarti yuzUrl={k.imageUrl} isim={k.name} nadirlik={k.rarity} rating={k.rating} pozisyon={k.position} genislik={84} />
                    <Text style={styles.kaldir}>✕</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
            {kartlar.length < MAX_KART ? (
              <TextInput
                style={[styles.girdi, kartlar.length > 0 && { marginTop: 8 }]}
                placeholder="Oyuncu ara ve ekle"
                placeholderTextColor={RENKLER.metinUcuncul}
                value={kartArama}
                onChangeText={setKartArama}
                autoCorrect={false}
              />
            ) : null}
            {kartSonuc.map((p) => (
              <Pressable key={p.futggId} onPress={() => kartEkle(p)} style={styles.sonucSatir}>
                <Text style={styles.sonucAd} numberOfLines={1}>{p.name}</Text>
                <Text style={styles.sonucAlt}>{p.position} · {p.rating} · {p.rarity || ''}</Text>
              </Pressable>
            ))}

            <Text style={styles.etiket}>Görseller (en fazla {MAX_GORSEL})</Text>
            <View style={styles.gorselSatiri}>
              {gorseller.map((g, i) => (
                <Pressable
                  key={g.uri}
                  onPress={() => setGorseller((prev) => prev.filter((_, j) => j !== i))}
                  accessibilityRole="button"
                  accessibilityLabel={`${i + 1}. görseli kaldır`}
                >
                  <Image source={{ uri: g.uri }} style={styles.onizleme} resizeMode="cover" />
                  <Text style={styles.kaldir}>✕</Text>
                </Pressable>
              ))}
              {gorseller.length < MAX_GORSEL ? (
                <Pressable onPress={gorselSec} style={styles.gorselEkle} accessibilityRole="button" accessibilityLabel="Görsel ekle">
                  <Text style={styles.gorselArti}>+</Text>
                  <Text style={styles.gorselMetin}>Görsel Ekle</Text>
                </Pressable>
              ) : null}
            </View>

            <Text style={styles.etiket}>Etiketler (opsiyonel)</Text>
            <View style={styles.etiketSatiri}>
              {etiketler.map((t) => (
                <Pressable key={t} onPress={() => setEtiketler((prev) => prev.filter((x) => x !== t))} style={styles.etiketCip} accessibilityRole="button" accessibilityLabel={`${t} etiketini kaldır`}>
                  <Text style={styles.etiketCipMetin}>#{t}  ✕</Text>
                </Pressable>
              ))}
              {etiketler.length < MAX_ETIKET ? (
                <TextInput
                  style={styles.etiketGirdi}
                  placeholder="+ Etiket"
                  placeholderTextColor={RENKLER.metinUcuncul}
                  value={etiketMetin}
                  onChangeText={setEtiketMetin}
                  onSubmitEditing={etiketEkle}
                  onEndEditing={etiketEkle}
                  maxLength={20}
                  autoCorrect={false}
                  returnKeyType="done"
                />
              ) : null}
            </View>

            <View style={styles.bildirimSatir}>
              <View style={{ flex: 1 }}>
                <Text style={styles.bildirimBaslik}>🔔 Bildirim Gönder</Text>
                <Text style={styles.bildirimAlt}>Bu konudaki yeni yorumlarda haberdar ol.</Text>
              </View>
              <Switch value={bildirim} onValueChange={setBildirim} trackColor={{ true: RENKLER.vurgu }} />
            </View>
          </>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function olusturStyles(RENKLER) {
  return StyleSheet.create({
    ustBar: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: RENKLER.ayrici },
    geriButon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    geriMetin: { fontSize: 22, color: RENKLER.metin },
    baslikMetin: { flex: 1, fontSize: 18, fontWeight: '900', color: RENKLER.metin, textAlign: 'center' },
    paylas: { minWidth: 74, minHeight: 40, borderRadius: 12, backgroundColor: RENKLER.vurgu, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
    paylasMetin: { fontSize: 14, fontWeight: '800', color: RENKLER.bg },
    turSatiri: { flexDirection: 'row', gap: 6 },
    turButon: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: RENKLER.ayrici, backgroundColor: RENKLER.bg2 },
    turEmoji: { fontSize: 17 },
    turMetin: { fontSize: 11.5, fontWeight: '700', color: RENKLER.metinIkincil },
    etiket: { fontSize: 13.5, fontWeight: '700', color: RENKLER.metin, marginTop: 16, marginBottom: 8 },
    secici: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 46, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: RENKLER.ayrici, backgroundColor: RENKLER.bg2 },
    seciciMetin: { fontSize: 14.5, fontWeight: '600', color: RENKLER.metin },
    seciciOk: { fontSize: 15, color: RENKLER.metinIkincil },
    kategoriSatiri: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
    kategoriButon: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 11, borderWidth: 1, borderColor: RENKLER.ayrici, backgroundColor: RENKLER.bg2 },
    kategoriMetin: { fontSize: 12.5, fontWeight: '700', color: RENKLER.metinIkincil },
    girdi: {
      backgroundColor: RENKLER.bg2, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
      color: RENKLER.metin, fontSize: 14.5, borderWidth: 1, borderColor: RENKLER.ayrici,
    },
    sayac: { fontSize: 11, color: RENKLER.metinUcuncul, textAlign: 'right', marginTop: 4 },
    secenekEkle: { minHeight: 42, alignItems: 'center', justifyContent: 'center' },
    sonucSatir: { minHeight: 46, justifyContent: 'center', paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: RENKLER.ayrici },
    sonucAd: { fontSize: 14, fontWeight: '700', color: RENKLER.metin },
    sonucAlt: { fontSize: 11.5, color: RENKLER.metinIkincil, marginTop: 1 },
    gorselSatiri: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    onizleme: { width: 84, height: 84, borderRadius: 12, backgroundColor: RENKLER.bg3 },
    kaldir: { position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: 10, overflow: 'hidden', textAlign: 'center', lineHeight: 20, fontSize: 11, color: '#fff', backgroundColor: 'rgba(0,0,0,0.7)' },
    gorselEkle: { width: 84, height: 84, borderRadius: 12, borderWidth: 1.5, borderColor: RENKLER.ayrici, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
    gorselArti: { fontSize: 24, color: RENKLER.metin },
    gorselMetin: { fontSize: 11.5, color: RENKLER.metinIkincil, fontWeight: '600' },
    etiketSatiri: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
    etiketCip: { minHeight: 38, justifyContent: 'center', paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: RENKLER.ayrici, backgroundColor: RENKLER.bg2 },
    etiketCipMetin: { fontSize: 12.5, fontWeight: '700', color: RENKLER.metin },
    etiketGirdi: { minWidth: 90, minHeight: 38, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: RENKLER.ayrici, color: RENKLER.metin, fontSize: 12.5 },
    bildirimSatir: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: RENKLER.ayrici },
    bildirimBaslik: { fontSize: 14, fontWeight: '800', color: RENKLER.metin },
    bildirimAlt: { fontSize: 12, color: RENKLER.metinIkincil, marginTop: 2 },
  });
}
