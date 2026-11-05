import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, FlatList, Image, TextInput, Pressable, ScrollView, Modal, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore';
import { useModerationStore } from '../store/moderationStore';
import { useBildirimStore } from '../store/bildirimStore';
import { icerikMenusuAc } from '../components/moderation/moderasyonYardimci';
import NeonParilti from '../components/NeonParilti';
import ForumMetin from '../components/forum/ForumMetin';
import YazarSatiri from '../components/forum/YazarSatiri';
import Avatar from '../components/forum/Avatar';
import OyGrubu from '../components/forum/OyGrubu';
import OyuncuKarti from '../components/OyuncuKarti';
import { usePaylasAkisi } from '../hooks/usePaylasAkisi';
import PaylasButonu from '../components/share/PaylasButonu';
import PaylasAkisiModal from '../components/share/PaylasAkisiModal';
import PaylasimKarti from '../components/share/PaylasimKarti';
import { api } from '../services/api';
import { useRenkler, useOrtakStil } from '../constants/theme';
import { kategoriAdi, tamGorselUrl, zamanFormatla } from '../constants/forum';

const STAT_ADI = { pace: 'Hız', shooting: 'Şut', passing: 'Pas', dribbling: 'Çeviklik', defending: 'Defans', physicality: 'Fizik' };

function statRengi(deger, RENKLER) {
  if ((deger ?? 0) >= 80) return RENKLER.basari;
  if ((deger ?? 0) >= 60) return RENKLER.vurgu;
  return RENKLER.hata;
}

const BAHSETME_SONU = /(?:^|\s)@([\p{L}\p{N}_.]*)$/u;

export default function ForumBaslikEkrani() {
  const RENKLER = useRenkler();
  const ORTAK_STIL = useOrtakStil();
  const styles = olusturStyles(RENKLER);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuthStore();
  const blockedIds = useModerationStore((s) => s.blockedIds);
  const bildirimAyarla = useBildirimStore((s) => s.ayarla);
  const [baslik, setBaslik] = useState(null);
  const [yorumlar, setYorumlar] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState(null);
  const [metin, setMetin] = useState('');
  const [yanitlanan, setYanitlanan] = useState(null);
  const [duzenlenen, setDuzenlenen] = useState(null);
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [yorumSirasi, setYorumSirasi] = useState('old');
  const [tamEkranGorsel, setTamEkranGorsel] = useState(null);
  const [oneriler, setOneriler] = useState([]);
  const kartRef = useRef(null);
  const girdiRef = useRef(null);
  const paylasAkisi = usePaylasAkisi({
    baslik: { baslik: 'Başlık', ref: kartRef },
  });
  const yetkili = !!(user?.isAdmin || user?.isModerator);

  const yukle = useCallback(async () => {
    try {
      const data = await api.forumThread(id, yorumSirasi);
      setBaslik(data.item);
      setYorumlar(data.comments || []);
      setHata(null);
    } catch (err) {
      setHata(err.message || 'Başlık yüklenemedi');
    } finally {
      setYukleniyor(false);
    }
  }, [id, yorumSirasi]);

  // Düzenleme ekranından dönünce de güncel görünsün.
  useFocusEffect(useCallback(() => { yukle(); }, [yukle]));

  // Başlığı açmak o başlığın bildirimlerini okundu sayar.
  useEffect(() => {
    api.forumMarkNotificationsRead(Number(id)).then((data) => bildirimAyarla(data.unread)).catch(() => {});
  }, [id, bildirimAyarla]);

  // Yazılan son kelime @ ile başlıyorsa kullanıcı adı öner.
  useEffect(() => {
    const eslesme = metin.match(BAHSETME_SONU);
    const aranan = eslesme?.[1];
    if (!aranan) { setOneriler([]); return undefined; }
    const zamanlayici = setTimeout(() => {
      api.forumSearchUsers(aranan).then((data) => setOneriler(data.items || [])).catch(() => setOneriler([]));
    }, 250);
    return () => clearTimeout(zamanlayici);
  }, [metin]);

  const oneriSec = (ad) => {
    setMetin((m) => m.replace(/@[\p{L}\p{N}_.]*$/u, `@${ad} `));
    setOneriler([]);
  };

  // Bildirimden soğuk açılışta geri gidilecek ekran olmayabilir.
  const geri = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/forum');
  };

  // Bu uçlar anketi döndürmez; ekrandaki anket korunur.
  const baslikGuncelle = async (islem, hataMetni) => {
    try {
      const data = await islem();
      setBaslik((prev) => ({ ...data.item, poll: prev.poll }));
    } catch (err) {
      Alert.alert('Hata', err.message || hataMetni);
    }
  };

  const oyla = (deger) => baslikGuncelle(() => api.forumVote(baslik.id, deger), 'Oy verilemedi');
  const takipDegistir = () => baslikGuncelle(() => api.forumFollow(baslik.id, !baslik.following), 'Takip güncellenemedi');
  const kaydet = () => baslikGuncelle(() => api.forumSave(baslik.id, !baslik.saved), 'Kaydedilemedi');
  const sabitle = () => baslikGuncelle(() => api.forumPin(baslik.id, !baslik.isPinned), 'Sabitlenemedi');
  const kilitle = () => baslikGuncelle(() => api.forumLock(baslik.id, !baslik.isLocked), 'Kilitlenemedi');

  const anketOyla = async (secenekId) => {
    try {
      const data = await api.forumPollVote(baslik.id, secenekId);
      setBaslik((prev) => ({ ...prev, poll: data.poll }));
    } catch (err) {
      Alert.alert('Hata', err.message || 'Oy verilemedi');
    }
  };

  const yorumOyla = async (yorum, deger) => {
    try {
      const data = await api.forumCommentVote(yorum.id, deger);
      setYorumlar((prev) => prev.map((y) => (y.id === yorum.id ? { ...y, voteCount: data.voteCount, myVote: data.myVote } : y)));
    } catch (err) {
      Alert.alert('Hata', err.message || 'Oy verilemedi');
    }
  };

  const gonder = async () => {
    const body = metin.trim();
    if (!body || gonderiliyor) return;
    setGonderiliyor(true);
    try {
      if (duzenlenen) {
        await api.forumEditComment(duzenlenen.id, body);
      } else {
        await api.forumAddComment(baslik.id, { body, ...(yanitlanan ? { parentId: yanitlanan.id } : {}) });
      }
      setMetin('');
      setYanitlanan(null);
      setDuzenlenen(null);
      await yukle();
    } catch (err) {
      Alert.alert('Hata', err.message || 'Yorum gönderilemedi');
    } finally {
      setGonderiliyor(false);
    }
  };

  const baslikSil = () => {
    Alert.alert('Başlığı Sil', 'Bu başlık ve tüm yorumları silinecek. Emin misin?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil', style: 'destructive', onPress: async () => {
          try {
            await api.forumDeleteThread(baslik.id);
            geri();
          } catch (err) {
            Alert.alert('Hata', err.message || 'Silinemedi');
          }
        },
      },
    ]);
  };

  const yorumSil = (yorum) => {
    Alert.alert('Yorumu Sil', 'Bu yorumu ve yanıtlarını silmek istediğine emin misin?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil', style: 'destructive', onPress: async () => {
          try {
            await api.forumDeleteComment(yorum.id);
            await yukle();
          } catch (err) {
            Alert.alert('Hata', err.message || 'Silinemedi');
          }
        },
      },
    ]);
  };

  const sikayetMenusu = (hedef, contentType, afterBlock) => icerikMenusuAc({
    hedefUserId: hedef.userId,
    hedefAd: hedef.authorName,
    contentType,
    contentId: hedef.id,
    benimUserId: user?.id,
    afterBlock,
  });

  const baslikMenusu = () => {
    const benim = baslik.userId === user?.id;
    if (!benim && !yetkili) { sikayetMenusu(baslik, 'forum_thread', geri); return; }
    Alert.alert('Başlık', 'Ne yapmak istersin?', [
      { text: 'Vazgeç', style: 'cancel' },
      ...(benim ? [{ text: 'Düzenle', onPress: () => router.push(`/forum/yeni?duzenle=${baslik.id}`) }] : []),
      ...(!benim ? [{ text: 'Şikayet / Engelle', onPress: () => sikayetMenusu(baslik, 'forum_thread', geri) }] : []),
      { text: 'Sil', style: 'destructive', onPress: baslikSil },
    ]);
  };

  const yorumDuzenle = (yorum) => {
    setDuzenlenen(yorum);
    setYanitlanan(null);
    setMetin(yorum.body);
    girdiRef.current?.focus();
  };

  const yorumMenusu = (yorum) => {
    const benim = yorum.userId === user?.id;
    if (!benim && !yetkili) { sikayetMenusu(yorum, 'forum_comment', yukle); return; }
    Alert.alert('Yorum', 'Ne yapmak istersin?', [
      { text: 'Vazgeç', style: 'cancel' },
      ...(benim ? [{ text: 'Düzenle', onPress: () => yorumDuzenle(yorum) }] : []),
      ...(!benim ? [{ text: 'Şikayet / Engelle', onPress: () => sikayetMenusu(yorum, 'forum_comment', yukle) }] : []),
      { text: 'Sil', style: 'destructive', onPress: () => yorumSil(yorum) },
    ]);
  };

  const yanitla = (yorum) => {
    setDuzenlenen(null);
    setYanitlanan(yorum);
    girdiRef.current?.focus();
  };

  const iptal = () => {
    if (duzenlenen) setMetin('');
    setDuzenlenen(null);
    setYanitlanan(null);
  };

  if (yukleniyor || !baslik) {
    return (
      <View style={ORTAK_STIL.ekran}>
        <NeonParilti />
        <View style={[styles.ustBar, { paddingTop: insets.top + 8 }]}>
          <Pressable onPress={geri} hitSlop={10} style={styles.geriButon} accessibilityRole="button" accessibilityLabel="Geri">
            <Text style={styles.geriMetin}>‹</Text>
          </Pressable>
        </View>
        {yukleniyor ? <ActivityIndicator style={{ marginTop: 40 }} color={RENKLER.vurgu} /> : <Text style={styles.bos}>{hata}</Text>}
      </View>
    );
  }

  const gorunenYorumlar = yorumlar.filter((y) => !blockedIds.includes(y.userId));
  const yorumAcik = !baslik.isLocked || yetkili;
  const baslikBenim = baslik.userId === user?.id;

  return (
    <KeyboardAvoidingView style={ORTAK_STIL.ekran} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <NeonParilti />
      <View style={[styles.ustBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={geri} hitSlop={10} style={styles.geriButon} accessibilityRole="button" accessibilityLabel="Geri">
          <Text style={styles.geriMetin}>‹</Text>
        </Pressable>
        <Text style={styles.ustKategori}>{kategoriAdi(baslik.category)}</Text>
        <PaylasButonu onPress={paylasAkisi.ac} calisiyor={paylasAkisi.yukleniyor} />
        <Pressable onPress={takipDegistir} style={[styles.takipButon, baslik.following && { borderColor: RENKLER.vurgu }]}>
          <Text style={[styles.takipMetin, baslik.following && { color: RENKLER.vurgu }]}>{baslik.following ? 'Takipte' : 'Takip Et'}</Text>
        </Pressable>
      </View>
      <PaylasAkisiModal akis={paylasAkisi} />

      <Modal visible={!!tamEkranGorsel} transparent animationType="fade" onRequestClose={() => setTamEkranGorsel(null)}>
        <Pressable onPress={() => setTamEkranGorsel(null)} style={styles.tamEkran} accessibilityRole="button" accessibilityLabel="Görseli kapat">
          {tamEkranGorsel ? <Image source={{ uri: tamEkranGorsel }} style={{ width: '100%', height: '100%' }} resizeMode="contain" /> : null}
        </Pressable>
      </Modal>

      {/* Görünmez, ekran dışı — sadece paylaşırken görsel olarak yakalanır. */}
      <View style={{ position: 'absolute', left: -9999, top: 0 }} collapsable={false}>
        <View ref={kartRef} collapsable={false}>
          <PaylasimKarti baslik={kategoriAdi(baslik.category)} vurguRenk={RENKLER.vurgu}>
            <Text style={styles.paylasBaslik}>{baslik.title}</Text>
            {baslik.body ? <Text style={styles.paylasMetin} numberOfLines={6}>{baslik.body}</Text> : null}
            <Text style={styles.paylasAlt}>▲ {baslik.voteCount} · 💬 {baslik.commentCount} · {baslik.authorName}</Text>
          </PaylasimKarti>
        </View>
      </View>

      <FlatList
        data={gorunenYorumlar}
        keyExtractor={(y) => String(y.id)}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: 16 }}
        ListHeaderComponent={(
          <View style={{ marginBottom: 8 }}>
            <Pressable onPress={() => router.push(`/forum/kullanici/${baslik.userId}`)} hitSlop={6} style={styles.yazarSatir}>
              <Avatar ad={baslik.authorName} yetkili={baslik.isAdmin || baslik.isModerator} />
              <View style={{ flex: 1 }}>
                <YazarSatiri ad={baslik.authorName} isAdmin={baslik.isAdmin} isModerator={baslik.isModerator} rozet={baslik.badge} />
                <Text style={styles.zaman}>{zamanFormatla(baslik.createdAt)} · {kategoriAdi(baslik.category)}{baslik.editedAt ? ' · düzenlendi' : ''}</Text>
              </View>
            </Pressable>
            <Text style={styles.baslikMetin}>{baslik.title}</Text>
            {baslik.body ? <ForumMetin style={styles.govde}>{baslik.body}</ForumMetin> : null}
            {baslik.imageUrls.length === 1 ? (
              <Pressable onPress={() => setTamEkranGorsel(tamGorselUrl(baslik.imageUrls[0]))}>
                <Image source={{ uri: tamGorselUrl(baslik.imageUrls[0]) }} style={styles.gorsel} resizeMode="contain" />
              </Pressable>
            ) : null}
            {baslik.imageUrls.length > 1 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} style={{ marginTop: 12 }}>
                {baslik.imageUrls.map((u) => (
                  <Pressable key={u} onPress={() => setTamEkranGorsel(tamGorselUrl(u))}>
                    <Image source={{ uri: tamGorselUrl(u) }} style={styles.cokluGorsel} resizeMode="cover" />
                  </Pressable>
                ))}
              </ScrollView>
            ) : null}
            {baslik.players.map((p) => {
              const statlar = p.attributes ? Object.entries(p.attributes).slice(0, 6) : [];
              return (
                <Pressable key={p.futggId} onPress={() => router.push(`/oyuncular/${p.futggId}`)} style={styles.oyuncuKutu}>
                  <OyuncuKarti yuzUrl={p.imageUrl} isim={p.name} nadirlik={p.rarity} rating={p.rating} pozisyon={p.position} genislik={118} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.oyuncuAd} numberOfLines={1}>{p.name}</Text>
                    <Text style={styles.oyuncuAlt}>{p.position} · {p.rating} OVR</Text>
                    {statlar.map(([ad, veri]) => (
                      <View key={ad} style={styles.statSatir}>
                        <Text style={styles.statAd}>{STAT_ADI[ad] || ad}</Text>
                        <View style={styles.statBar}>
                          <View style={[styles.statDolgu, { width: `${Math.min(veri.value ?? 0, 100)}%`, backgroundColor: statRengi(veri.value, RENKLER) }]} />
                        </View>
                        <Text style={styles.statDeger}>{veri.value ?? '-'}</Text>
                      </View>
                    ))}
                  </View>
                </Pressable>
              );
            })}
            {baslik.tags.length > 0 ? (
              <View style={styles.etiketSatir}>
                {baslik.tags.map((t) => <Text key={t} style={styles.etiket}>#{t}</Text>)}
              </View>
            ) : null}
            {baslik.poll ? (
              <View style={styles.anket}>
                {baslik.poll.options.map((s) => {
                  const oran = baslik.poll.totalVotes ? Math.round((s.voteCount / baslik.poll.totalVotes) * 100) : 0;
                  const benim = baslik.poll.myOptionId === s.id;
                  return (
                    <Pressable key={s.id} onPress={() => anketOyla(s.id)} style={[styles.anketSecenek, benim && { borderColor: RENKLER.vurgu }]}>
                      <View style={[styles.anketDolgu, { width: `${oran}%`, backgroundColor: `${RENKLER.vurgu}33` }]} />
                      <Text style={styles.anketMetin} numberOfLines={2}>{benim ? '✓ ' : ''}{s.label}</Text>
                      <Text style={styles.anketOran}>%{oran}</Text>
                    </Pressable>
                  );
                })}
                <Text style={styles.anketToplam}>{baslik.poll.totalVotes} oy</Text>
              </View>
            ) : null}
            <View style={styles.eylemSatiri}>
              <OyGrubu sayi={baslik.voteCount} oyum={baslik.myVote} onOy={oyla} kapali={baslikBenim} cerceveli />
              <Pressable onPress={kaydet} style={[styles.eylemButon, baslik.saved && { borderColor: RENKLER.vurgu2 }]}>
                <Text style={[styles.eylemMetin, baslik.saved && { color: RENKLER.vurgu2 }]}>{baslik.saved ? '★ Kaydedildi' : '☆ Kaydet'}</Text>
              </Pressable>
              <Pressable onPress={baslikMenusu} style={styles.eylemButon}>
                <Text style={styles.eylemMetin}>{baslikBenim || yetkili ? 'Seçenekler' : 'Şikayet / Engelle'}</Text>
              </Pressable>
              {yetkili ? (
                <>
                  <Pressable onPress={sabitle} style={styles.eylemButon}>
                    <Text style={styles.eylemMetin}>{baslik.isPinned ? '📌 Sabiti kaldır' : '📌 Sabitle'}</Text>
                  </Pressable>
                  <Pressable onPress={kilitle} style={styles.eylemButon}>
                    <Text style={styles.eylemMetin}>{baslik.isLocked ? '🔓 Kilidi aç' : '🔒 Kilitle'}</Text>
                  </Pressable>
                </>
              ) : null}
            </View>
            <View style={styles.yorumBaslikSatiri}>
              <Text style={styles.yorumBaslik}>Yorumlar ({baslik.commentCount})</Text>
              <Pressable onPress={() => setYorumSirasi((s) => (s === 'old' ? 'best' : 'old'))} hitSlop={10}>
                <Text style={[styles.yorumEylem, { color: RENKLER.vurgu }]}>{yorumSirasi === 'old' ? 'Sıra: Tarih' : 'Sıra: En iyi'}</Text>
              </Pressable>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.bos}>Henüz yorum yok. İlk yorumu sen yaz!</Text>}
        renderItem={({ item: y }) => {
          const benim = y.userId === user?.id;
          return (
            <Pressable onLongPress={() => yorumMenusu(y)} style={[styles.yorumKutu, y.parentId && styles.yanitKutu]}>
              <View style={styles.yorumUstSatir}>
                <Pressable onPress={() => router.push(`/forum/kullanici/${y.userId}`)} hitSlop={6} style={styles.yorumYazar}>
                  <Avatar ad={y.authorName} boyut={28} yetkili={y.isAdmin || y.isModerator} />
                  <YazarSatiri ad={y.authorName} isAdmin={y.isAdmin} isModerator={y.isModerator} rozet={y.badge} />
                </Pressable>
                <Text style={styles.zaman}>{zamanFormatla(y.createdAt)}{y.editedAt ? ' · düzenlendi' : ''}</Text>
              </View>
              <ForumMetin style={styles.yorumMetin}>{y.body}</ForumMetin>
              <View style={styles.yorumEylemler}>
                <OyGrubu sayi={y.voteCount} oyum={y.myVote} onOy={(d) => yorumOyla(y, d)} kapali={benim} />
                {yorumAcik ? (
                  <Pressable onPress={() => yanitla(y)} hitSlop={10}>
                    <Text style={[styles.yorumEylem, { color: RENKLER.vurgu }]}>Yanıtla</Text>
                  </Pressable>
                ) : null}
                <Pressable onPress={() => yorumMenusu(y)} hitSlop={10}>
                  <Text style={styles.yorumEylem}>{benim || yetkili ? 'Seçenekler' : 'Şikayet / Engelle'}</Text>
                </Pressable>
              </View>
            </Pressable>
          );
        }}
      />

      {yorumAcik ? (
        <View style={styles.girdiAlani}>
          {oneriler.length > 0 ? (
            <ScrollView horizontal keyboardShouldPersistTaps="always" showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 8 }}>
              {oneriler.map((o) => (
                <Pressable key={o.id} onPress={() => oneriSec(o.name)} style={styles.oneri}>
                  <Text style={styles.oneriMetin}>@{o.name}</Text>
                </Pressable>
              ))}
            </ScrollView>
          ) : null}
          {yanitlanan || duzenlenen ? (
            <View style={styles.yanitSatiri}>
              <Text style={styles.yanitMetin} numberOfLines={1}>{duzenlenen ? 'Yorumunu düzenliyorsun' : `${yanitlanan.authorName} kullanıcısına yanıt`}</Text>
              <Pressable onPress={iptal} hitSlop={10}>
                <Text style={[styles.yanitIptal, { color: RENKLER.vurgu2 }]}>Vazgeç</Text>
              </Pressable>
            </View>
          ) : null}
          <View style={styles.girdiSatiri}>
            <TextInput
              ref={girdiRef}
              style={styles.girdi}
              placeholder="Yorumunu yaz, @ ile birinden bahset..."
              placeholderTextColor={RENKLER.metinUcuncul}
              value={metin}
              onChangeText={setMetin}
              maxLength={1000}
              multiline
            />
            <Pressable onPress={gonder} disabled={gonderiliyor || !metin.trim()} style={[styles.gonderButon, (!metin.trim() || gonderiliyor) && { opacity: 0.5 }]}>
              {gonderiliyor ? <ActivityIndicator size="small" color={RENKLER.bg} /> : <Text style={styles.gonderMetin}>{duzenlenen ? 'Kaydet' : 'Gönder'}</Text>}
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={styles.girdiAlani}>
          <Text style={styles.kilitliMetin}>🔒 Bu başlık yorumlara kapalı</Text>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

function olusturStyles(RENKLER) {
  return StyleSheet.create({
    ustBar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: RENKLER.ayrici },
    geriButon: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
    geriMetin: { fontSize: 32, lineHeight: 34, color: RENKLER.metin },
    ustKategori: { flex: 1, fontSize: 13, fontWeight: '700', color: RENKLER.vurgu2 },
    takipButon: { borderRadius: 10, borderWidth: 1, borderColor: RENKLER.ayrici, paddingHorizontal: 12, paddingVertical: 8 },
    takipMetin: { fontSize: 12.5, fontWeight: '700', color: RENKLER.metin },
    tamEkran: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)' },
    bos: { color: RENKLER.metinIkincil, textAlign: 'center', marginTop: 24 },
    baslikMetin: { fontSize: 21, fontWeight: '900', color: RENKLER.metin, lineHeight: 26 },
    yazarSatir: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
    yorumYazar: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
    oyuncuKutu: { flexDirection: 'row', gap: 12, marginTop: 14, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: RENKLER.ayrici, backgroundColor: RENKLER.bg2 },
    oyuncuAd: { fontSize: 15, fontWeight: '800', color: RENKLER.metin },
    oyuncuAlt: { fontSize: 12, color: RENKLER.metinIkincil, marginTop: 2, marginBottom: 6 },
    statSatir: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 5 },
    statAd: { width: 52, fontSize: 11, color: RENKLER.metinIkincil },
    statBar: { flex: 1, height: 5, borderRadius: 3, backgroundColor: RENKLER.bg3, overflow: 'hidden' },
    statDolgu: { height: '100%', borderRadius: 3 },
    statDeger: { width: 22, fontSize: 11, fontWeight: '800', color: RENKLER.metin, textAlign: 'right' },
    etiketSatir: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
    etiket: { fontSize: 12, fontWeight: '700', color: RENKLER.vurgu },
    zaman: { fontSize: 11, color: RENKLER.metinIkincil },
    govde: { fontSize: 14.5, color: RENKLER.metin, lineHeight: 21, marginTop: 12 },
    gorsel: { width: '100%', height: 260, borderRadius: 12, marginTop: 12, backgroundColor: RENKLER.bg3 },
    cokluGorsel: { width: 220, height: 220, borderRadius: 12, backgroundColor: RENKLER.bg3 },
    anket: { gap: 8, marginTop: 14 },
    anketSecenek: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 46, borderRadius: 11, borderWidth: 1, borderColor: RENKLER.ayrici, backgroundColor: RENKLER.bg2, paddingHorizontal: 12, overflow: 'hidden' },
    anketDolgu: { position: 'absolute', left: 0, top: 0, bottom: 0 },
    anketMetin: { flex: 1, fontSize: 13.5, fontWeight: '600', color: RENKLER.metin },
    anketOran: { fontSize: 13, fontWeight: '800', color: RENKLER.metin },
    anketToplam: { fontSize: 12, color: RENKLER.metinIkincil },
    kilitliMetin: { fontSize: 13, color: RENKLER.metinIkincil, textAlign: 'center', paddingVertical: 8 },
    eylemSatiri: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
    eylemButon: { borderRadius: 11, borderWidth: 1, borderColor: RENKLER.ayrici, backgroundColor: RENKLER.bg2, paddingHorizontal: 14, paddingVertical: 11 },
    eylemMetin: { fontSize: 13, fontWeight: '700', color: RENKLER.metin },
    yorumBaslikSatiri: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20 },
    yorumBaslik: { fontSize: 14, fontWeight: '800', color: RENKLER.metin },
    yorumKutu: { backgroundColor: RENKLER.bg2, borderRadius: 12, borderWidth: 1, borderColor: RENKLER.ayrici, padding: 11 },
    yanitKutu: { marginLeft: 22 },
    yorumUstSatir: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
    yorumMetin: { fontSize: 13.5, color: RENKLER.metin, lineHeight: 19, marginTop: 4 },
    yorumEylemler: { flexDirection: 'row', gap: 18, marginTop: 8 },
    yorumEylem: { fontSize: 12, fontWeight: '700', color: RENKLER.metinIkincil },
    girdiAlani: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 10, borderTopWidth: 1, borderTopColor: RENKLER.ayrici, backgroundColor: RENKLER.bg },
    oneri: { borderRadius: 10, borderWidth: 1, borderColor: RENKLER.ayrici, backgroundColor: RENKLER.bg2, paddingHorizontal: 12, paddingVertical: 8 },
    oneriMetin: { fontSize: 12.5, fontWeight: '700', color: RENKLER.vurgu },
    yanitSatiri: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, paddingBottom: 6 },
    yanitMetin: { flex: 1, fontSize: 12, color: RENKLER.metinIkincil },
    yanitIptal: { fontSize: 12, fontWeight: '700' },
    girdiSatiri: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
    girdi: {
      flex: 1, backgroundColor: RENKLER.bg2, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10,
      color: RENKLER.metin, fontSize: 13.5, maxHeight: 100, borderWidth: 1, borderColor: RENKLER.ayrici,
    },
    gonderButon: { backgroundColor: RENKLER.vurgu, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, minWidth: 74, alignItems: 'center' },
    gonderMetin: { color: RENKLER.bg, fontWeight: '800', fontSize: 12.5 },
    paylasBaslik: { fontSize: 20, fontWeight: '900', color: RENKLER.metin, lineHeight: 25 },
    paylasMetin: { fontSize: 13.5, color: RENKLER.metinIkincil, lineHeight: 19, marginTop: 8 },
    paylasAlt: { fontSize: 12, fontWeight: '700', color: RENKLER.metinIkincil, marginTop: 12 },
  });
}
