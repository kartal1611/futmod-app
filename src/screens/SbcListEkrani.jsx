import NeonParilti from '../components/NeonParilti';
import { useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, Image, Pressable, ActivityIndicator, RefreshControl, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useContentStore, useContentItems } from '../store/contentStore';
import { useRenkler, useOrtakStil } from '../constants/theme';

const KATEGORI_ETIKET = {
  players: 'Oyuncu',
  upgrades: 'Yükseltme',
  challenges: 'Maç Kartı',
  icons: 'Icon',
  foundations: 'Temel',
  swaps: 'Takas',
};
const KATEGORILER = ['players', 'upgrades', 'challenges', 'icons', 'foundations', 'swaps'];

function kategoriAl(slug) {
  const kat = (slug || '').split('/')[0];
  return KATEGORI_ETIKET[kat] || null;
}

export default function SbcListEkrani() {
  const RENKLER = useRenkler();
  const ORTAK_STIL = useOrtakStil();
  const styles = olusturStyles(RENKLER);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { loading, fetchFeed } = useContentStore();
  const items = useContentItems('sbc');
  const [aktifKategori, setAktifKategori] = useState('all');

  useEffect(() => { fetchFeed('sbc'); }, []);

  const sayilar = useMemo(() => {
    const s = {};
    for (const k of KATEGORILER) s[k] = 0;
    for (const item of items) {
      const kat = (item.payload?.slug || '').split('/')[0];
      if (s[kat] != null) s[kat]++;
    }
    return s;
  }, [items]);

  const gorunenler = aktifKategori === 'all'
    ? items
    : items.filter((item) => (item.payload?.slug || '').split('/')[0] === aktifKategori);

  return (
    <View style={ORTAK_STIL.ekran}>
      <NeonParilti />
      <View style={[styles.ustBar, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={styles.geriOk}>‹</Text>
        </Pressable>
        <Text style={styles.baslik}>SBC Merkezi 📋</Text>
        <View style={{ width: 24 }} />
      </View>
      {items.length > 0 ? <Text style={styles.sayac}>{items.length} SBC · canlı veri</Text> : null}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtreSatiri}>
        <Filtre etiket="Tümü" sayi={items.length} secili={aktifKategori === 'all'} onPress={() => setAktifKategori('all')} />
        {KATEGORILER.map((k) => (
          <Filtre key={k} etiket={KATEGORI_ETIKET[k]} sayi={sayilar[k]} secili={aktifKategori === k} onPress={() => setAktifKategori(k)} />
        ))}
      </ScrollView>

      {loading && items.length === 0 ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={RENKLER.vurgu} />
      ) : (
        <FlatList
          data={gorunenler}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 16, paddingTop: 8, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={() => fetchFeed('sbc')} tintColor={RENKLER.vurgu} />}
          ListEmptyComponent={
            <Text style={styles.bos}>
              {items.length === 0 ? 'Henüz SBC yok.' : 'Bu kategoride SBC yok.'}
            </Text>
          }
          renderItem={({ item }) => {
            const p = item.payload || {};
            const kategori = kategoriAl(p.slug);
            const up = p.communityUpvotePct;
            const down = p.communityDownvotePct;
            return (
              <Pressable onPress={() => router.push(`/sbc/${item.id}`)} style={({ pressed }) => [ORTAK_STIL.kart, { marginBottom: 14 }, pressed && { opacity: 0.85 }]}>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  {item.imageUrl ? (
                    <Image source={{ uri: item.imageUrl }} style={styles.gorsel} resizeMode="contain" />
                  ) : (
                    <View style={[styles.gorsel, { backgroundColor: RENKLER.bg3 }]} />
                  )}
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                      {p.isNew ? <Text style={styles.yeniEtiket}>YENİ</Text> : null}
                      {kategori ? <Text style={styles.katEtiket}>{kategori}</Text> : null}
                    </View>
                    <Text style={styles.kartBaslik} numberOfLines={2}>{item.title}</Text>
                    {p.description ? <Text style={styles.aciklama} numberOfLines={2}>{p.description}</Text> : null}
                    {p.priceCoins ? (
                      <Text style={styles.maliyet}>{p.priceCoins.toLocaleString('tr-TR')} points</Text>
                    ) : null}
                  </View>
                  <Text style={styles.ok}>›</Text>
                </View>

                <View style={styles.istatistikSatiri}>
                  <Istatistik etiket="Kadro" deger={p.challengeCount ?? '-'} />
                  <Istatistik etiket="Bitiş" deger={p.expires || '-'} />
                  <Istatistik etiket="Tekrar" deger={p.repeatable || '-'} />
                  <Istatistik etiket="Yenilenme" deger={p.refreshesEvery || '-'} />
                </View>

                {(up != null && down != null) ? (
                  <View style={styles.oySatiri}>
                    <View style={styles.oyBar}>
                      <View style={[styles.oyDoluBar, { width: `${up}%` }]} />
                    </View>
                    <Text style={styles.oyMetin}>👍 %{up} · 👎 %{down}</Text>
                  </View>
                ) : null}
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}

function Filtre({ etiket, sayi, secili, onPress }) {
  const RENKLER = useRenkler();
  const styles = olusturStyles(RENKLER);
  return (
    <Pressable onPress={onPress} style={[styles.filtreChip, secili && styles.filtreChipSecili]}>
      <Text style={[styles.filtreMetin, secili && styles.filtreMetinSecili]}>{etiket}{sayi ? ` (${sayi})` : ''}</Text>
    </Pressable>
  );
}

function Istatistik({ etiket, deger }) {
  const RENKLER = useRenkler();
  const styles = olusturStyles(RENKLER);
  return (
    <View style={styles.istatistikKutu}>
      <Text style={styles.istatistikEtiket}>{etiket}</Text>
      <Text style={styles.istatistikDeger} numberOfLines={1}>{String(deger)}</Text>
    </View>
  );
}

function olusturStyles(RENKLER) {
  return StyleSheet.create({
  ustBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 4,
  },
  sayac: { textAlign: 'center', color: RENKLER.metinUcuncul, fontSize: 11.5, marginBottom: 10 },
  filtreSatiri: { paddingHorizontal: 16, gap: 8, paddingBottom: 12, alignItems: 'flex-start' },
  filtreChip: { height: 36, paddingHorizontal: 14, justifyContent: 'center', borderRadius: 20, backgroundColor: RENKLER.bg2, borderWidth: 1, borderColor: RENKLER.ayrici, alignSelf: 'flex-start' },
  filtreChipSecili: { backgroundColor: RENKLER.vurgu, borderColor: RENKLER.vurgu },
  filtreMetin: { fontSize: 12.5, fontWeight: '700', color: RENKLER.metinIkincil },
  filtreMetinSecili: { color: RENKLER.bg },
  geriOk: { fontSize: 28, color: RENKLER.metin, fontWeight: '300', width: 24 },
  baslik: { fontSize: 18, fontWeight: '800', color: RENKLER.metin, flex: 1, textAlign: 'center' },
  gorsel: { width: 56, height: 56, borderRadius: 8 },
  yeniEtiket: { fontSize: 9, fontWeight: '800', color: RENKLER.bg, backgroundColor: RENKLER.vurgu, alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  katEtiket: { fontSize: 9, fontWeight: '800', color: RENKLER.vurgu2, backgroundColor: `${RENKLER.vurgu2}22`, alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, textTransform: 'uppercase' },
  kartBaslik: { fontSize: 14.5, fontWeight: '700', color: RENKLER.metin, marginTop: 3 },
  aciklama: { fontSize: 11.5, color: RENKLER.metinIkincil, marginTop: 2 },
  maliyet: { fontSize: 12, color: RENKLER.uyari, marginTop: 4, fontWeight: '700' },
  ok: { fontSize: 24, color: RENKLER.metinUcuncul, fontWeight: '300' },
  bos: { color: RENKLER.metinIkincil, textAlign: 'center', marginTop: 40, paddingHorizontal: 24 },
  istatistikSatiri: { flexDirection: 'row', gap: 6, marginTop: 12 },
  istatistikKutu: { flex: 1, backgroundColor: RENKLER.bg3, borderRadius: 8, paddingVertical: 6, alignItems: 'center' },
  istatistikEtiket: { fontSize: 8.5, fontWeight: '700', color: RENKLER.metinUcuncul, textTransform: 'uppercase' },
  istatistikDeger: { fontSize: 11, fontWeight: '700', color: RENKLER.metin, marginTop: 1 },
  oySatiri: { marginTop: 10, gap: 4 },
  oyBar: { height: 4, borderRadius: 2, backgroundColor: RENKLER.hata, overflow: 'hidden' },
  oyDoluBar: { height: 4, backgroundColor: RENKLER.basari },
  oyMetin: { fontSize: 10.5, color: RENKLER.metinUcuncul },
  });
}
