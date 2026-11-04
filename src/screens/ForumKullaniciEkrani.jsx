import { useCallback, useState } from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBaslikIslemleri } from '../hooks/useBaslikIslemleri';
import { icerikMenusuAc } from '../components/moderation/moderasyonYardimci';
import YazarSatiri from '../components/forum/YazarSatiri';
import BaslikKarti from '../components/forum/BaslikKarti';
import NeonParilti from '../components/NeonParilti';
import { api } from '../services/api';
import { useRenkler, useOrtakStil } from '../constants/theme';

function katilimTarihi(iso) {
  if (!iso) return '';
  return new Date(iso.replace(' ', 'T') + 'Z').toLocaleDateString('tr-TR', { month: 'long', year: 'numeric', timeZone: 'Europe/Istanbul' });
}

export default function ForumKullaniciEkrani() {
  const RENKLER = useRenkler();
  const ORTAK_STIL = useOrtakStil();
  const styles = olusturStyles(RENKLER);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [profil, setProfil] = useState(null);
  const [basliklar, setBasliklar] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState(null);
  const islemler = useBaslikIslemleri(setBasliklar);

  const yukle = useCallback(async () => {
    try {
      const [p, b] = await Promise.all([
        api.forumUser(id),
        api.forumThreads({ userId: id, sort: 'new', limit: 50 }),
      ]);
      setProfil(p.profile);
      setBasliklar(b.items || []);
      setHata(null);
    } catch (err) {
      setHata(err.message || 'Profil yüklenemedi');
    } finally {
      setYukleniyor(false);
    }
  }, [id]);

  useFocusEffect(useCallback(() => { yukle(); }, [yukle]));

  const takipDegistir = async () => {
    try {
      const data = await api.forumFollowUser(profil.id, !profil.isFollowing);
      setProfil(data.profile);
    } catch (err) {
      setHata(err.message || 'Takip güncellenemedi');
    }
  };

  const menuAc = () => icerikMenusuAc({
    hedefUserId: profil.id,
    hedefAd: profil.name,
    contentType: 'user',
    contentId: null,
    benimUserId: islemler.benimId,
    afterBlock: yukle,
  });

  return (
    <View style={ORTAK_STIL.ekran}>
      <NeonParilti />
      <View style={[styles.ustBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.geriButon} accessibilityRole="button" accessibilityLabel="Geri">
          <Text style={styles.geriMetin}>‹</Text>
        </Pressable>
        <Text style={styles.ustBaslik} numberOfLines={1}>{profil?.name || 'Profil'}</Text>
      </View>
      {yukleniyor ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={RENKLER.vurgu} />
      ) : !profil ? (
        <Text style={styles.bos}>{hata}</Text>
      ) : (
        <FlatList
          data={basliklar}
          keyExtractor={(b) => String(b.id)}
          contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 32 }}
          ListHeaderComponent={(
            <View style={{ marginBottom: 8 }}>
              <YazarSatiri ad={profil.name} isAdmin={profil.isAdmin} isModerator={profil.isModerator} rozet={profil.badge} boyut={21} />
              <Text style={styles.katilim}>{katilimTarihi(profil.joinedAt)} tarihinde katıldı</Text>
              <View style={styles.sayilar}>
                <Sayi deger={profil.reputation} etiket="İtibar" styles={styles} />
                <Sayi deger={profil.followerCount} etiket="Takipçi" styles={styles} />
                <Sayi deger={profil.threadCount} etiket="Başlık" styles={styles} />
                <Sayi deger={profil.commentCount} etiket="Yorum" styles={styles} />
              </View>
              {profil.id !== islemler.benimId ? (
                <View style={styles.eylemler}>
                  <Pressable onPress={takipDegistir} style={[styles.takipButon, !profil.isFollowing && { backgroundColor: RENKLER.vurgu, borderColor: RENKLER.vurgu }]}>
                    <Text style={[styles.takipMetin, !profil.isFollowing && { color: RENKLER.bg }]}>{profil.isFollowing ? 'Takipten Çık' : 'Takip Et'}</Text>
                  </Pressable>
                  <Pressable onPress={menuAc} style={styles.takipButon}>
                    <Text style={styles.takipMetin}>Şikayet / Engelle</Text>
                  </Pressable>
                </View>
              ) : null}
              <Text style={styles.bolum}>Başlıklar</Text>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.bos}>{profil.blocked ? 'Bu kullanıcıyı engelledin.' : 'Henüz başlık açmamış.'}</Text>}
          renderItem={({ item }) => <BaslikKarti baslik={item} islemler={islemler} />}
        />
      )}
    </View>
  );
}

function Sayi({ deger, etiket, styles }) {
  return (
    <View style={styles.sayiKutu}>
      <Text style={styles.sayiDeger}>{deger}</Text>
      <Text style={styles.sayiEtiket}>{etiket}</Text>
    </View>
  );
}

function olusturStyles(RENKLER) {
  return StyleSheet.create({
    ustBar: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: RENKLER.ayrici },
    geriButon: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
    geriMetin: { fontSize: 32, lineHeight: 34, color: RENKLER.metin },
    ustBaslik: { flex: 1, fontSize: 17, fontWeight: '800', color: RENKLER.metin },
    bos: { color: RENKLER.metinIkincil, textAlign: 'center', marginTop: 24 },
    eylemler: { flexDirection: 'row', gap: 8, marginTop: 14 },
    takipButon: { flex: 1, minHeight: 44, borderRadius: 12, borderWidth: 1, borderColor: RENKLER.ayrici, alignItems: 'center', justifyContent: 'center' },
    takipMetin: { fontSize: 13, fontWeight: '800', color: RENKLER.metin },
    katilim: { fontSize: 12.5, color: RENKLER.metinIkincil, marginTop: 4 },
    sayilar: { flexDirection: 'row', gap: 8, marginTop: 14 },
    sayiKutu: { flex: 1, alignItems: 'center', backgroundColor: RENKLER.bg2, borderRadius: 12, borderWidth: 1, borderColor: RENKLER.ayrici, paddingVertical: 12 },
    sayiDeger: { fontSize: 18, fontWeight: '900', color: RENKLER.vurgu },
    sayiEtiket: { fontSize: 11.5, color: RENKLER.metinIkincil, marginTop: 2 },
    bolum: { fontSize: 14, fontWeight: '800', color: RENKLER.metin, marginTop: 20 },
  });
}
