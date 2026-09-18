import { useEffect, useRef, useState } from 'react';
import { View, Text, Image, Pressable, ActivityIndicator, ScrollView, FlatList, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../services/api';
import { useRenkler, useOrtakStil } from '../constants/theme';
import { getPlaystyleIcon } from '../constants/playstyleIcons';
import OyuncuKarti from '../components/OyuncuKarti';
import { usePaylasAkisi } from '../hooks/usePaylasAkisi';
import PaylasButonu from '../components/share/PaylasButonu';
import PaylasAkisiModal from '../components/share/PaylasAkisiModal';
import PaylasimKarti from '../components/share/PaylasimKarti';
import NeonParilti from '../components/NeonParilti';

const KATEGORI_ETIKET = { pace: 'HIZ', shooting: 'ŞUT', passing: 'PAS', dribbling: 'DRİBLİNG', defending: 'DEFANS', physical: 'FİZİK' };
const ALT_ETIKET = {
  'Att. Pos.': 'Hücum Poz.', Finishing: 'Bitiricilik', 'Shot Power': 'Şut Gücü', 'Long Shots': 'Uzaktan Şut', Volleys: 'Vole', Penalties: 'Penaltı',
  Vision: 'Vizyon', Crossing: 'Orta', 'Fk Acc.': 'Serbest Vuruş', 'Short Pass': 'Kısa Pas', 'Long Pass': 'Uzun Pas', Curve: 'Falso',
  Agility: 'Çeviklik', Balance: 'Denge', Reactions: 'Reaksiyon', 'Ball Control': 'Top Kontrolü', Dribbling: 'Dribling', Composure: 'Soğukkanlılık',
  Interceptions: 'Top Kapma', 'Heading Acc.': 'Kafa Vuruşu', 'Def. Aware.': 'Defans Bilinci', 'Stand Tackle': 'Ayakta Müdahale', 'Slide Tackle': 'Kayarak Müdahale',
  Jumping: 'Zıplama', Stamina: 'Dayanıklılık', Strength: 'Güç', Aggression: 'Agresiflik',
  Acceleration: 'İvme', 'Sprint Speed': 'Sprint Hızı',
};

function tierRengi(RENKLER, val) {
  if (val == null) return RENKLER.metinIkincil;
  if (val >= 80) return RENKLER.basari;
  if (val >= 60) return RENKLER.uyari;
  return RENKLER.hata;
}

/** fut.gg's real PlayStyle icon — gold diamond for a + style, silver for a base one. */
function PlaystyleIcon({ name, plus, size = 30 }) {
  const icon = getPlaystyleIcon(name);
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={[
        StyleSheet.absoluteFill,
        { backgroundColor: plus ? '#e3c075' : '#c7cdd6', borderRadius: 5, transform: [{ rotate: '45deg' }, { scale: 0.72 }] },
      ]} />
      {icon ? (
        <Svg width={size * 0.52} height={size * 0.52} viewBox={icon.viewBox}>
          {icon.paths.map((d, i) => <Path key={i} d={d} fill="#1a1a1a" />)}
        </Svg>
      ) : null}
    </View>
  );
}

export default function OyuncuDetayEkrani() {
  const RENKLER = useRenkler();
  const ORTAK_STIL = useOrtakStil();
  const styles = olusturStyles(RENKLER);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { futggId, src } = useLocalSearchParams();
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [versiyonlar, setVersiyonlar] = useState([]);
  const fiyatRef = useRef(null);
  const statsRef = useRef(null);
  const paylasAkisi = usePaylasAkisi({
    fiyat: { baslik: 'Fiyat Kartı', emoji: '💰', ref: fiyatRef },
    stats: { baslik: 'Stats Kartı', emoji: '📊', ref: statsRef },
  });

  useEffect(() => {
    let iptal = false;
    setLoading(true);
    setVersiyonlar([]);
    api.playerItem(futggId, src)
      .then((data) => { if (!iptal) setPlayer(data.player); })
      .catch((err) => { if (!iptal) setError(err.message); })
      .finally(() => { if (!iptal) setLoading(false); });
    api.playerVersions(futggId)
      .then((data) => { if (!iptal) setVersiyonlar(data.items || []); })
      .catch(() => {});
    return () => { iptal = true; };
  }, [futggId]);

  if (loading) {
    return (
      <View style={[ORTAK_STIL.ekran, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={RENKLER.vurgu} />
        <Text style={{ color: RENKLER.metinIkincil, marginTop: 10, fontSize: 12 }}>Oyuncu profili yükleniyor...</Text>
      </View>
    );
  }

  if (error || !player) {
    return (
      <View style={ORTAK_STIL.ekran}>
        <UstBar router={router} baslik="Oyuncu" insets={insets} />
        <Text style={styles.bos}>{error || 'Oyuncu bulunamadı.'}</Text>
      </View>
    );
  }

  const d = player.detail || {};
  const attrs = d.attributes || null;
  // easysbc (our current source) never gives a pre-flattened "frame baked
  // in" card image the way fut.gg's list scrape used to — it only exposes
  // the bare face cutout (imageUrl) and the rarity frame separately
  // (cardFrameUrl). Always composite the two instead of treating the list-
  // level `imageUrl` as already-flattened (it isn't, for any player now).
  const duzGorselUrl = d.cardImageUrl || null;
  const yuzUrl = d.imageUrl || player.imageUrl || null;
  const cerceveUrl = d.cardFrameUrl || null;

  return (
    <View style={ORTAK_STIL.ekran}>
      <NeonParilti />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40 }}>
      <UstBar
        router={router}
        baslik={d.name || player.name}
        insets={insets}
        sagIcerik={<PaylasButonu onPress={paylasAkisi.ac} calisiyor={paylasAkisi.yukleniyor} />}
      />
      <PaylasAkisiModal akis={paylasAkisi} />

      {/* Görünmez, ekran dışı — sadece bir şablon seçildiğinde görsel olarak yakalanır. */}
      <View style={{ position: 'absolute', left: -9999, top: 0 }} collapsable={false}>
        <View ref={fiyatRef} collapsable={false}>
          <PaylasimKarti baslik="Market" vurguRenk={RENKLER.vurgu}>
            <View style={styles.paylasUstSatir}>
              <OyuncuKarti duzGorselUrl={duzGorselUrl} yuzUrl={yuzUrl} cerceveUrl={cerceveUrl} rating={d.rating} pozisyon={d.mainPosition || player.position} attrs={attrs} isim={d.name || player.name} nationIconUrl={d.nationIconUrl} leagueIconUrl={d.leagueIconUrl} weakFoot={d.weakFoot} skillMoves={d.skillMoves} genislik={110} />
              <View style={{ flex: 1 }}>
                <Text style={styles.paylasIsim} numberOfLines={2}>{d.name || player.name}</Text>
                <View style={styles.paylasRozetSatiri}>
                  {(d.mainPosition || player.position) ? <Text style={styles.paylasPozisyon}>{d.mainPosition || player.position}</Text> : null}
                  {d.rating ? <Text style={styles.paylasRating}>{d.rating} OVR</Text> : null}
                </View>
                {d.rarity ? <Text style={styles.paylasRarity} numberOfLines={2}>{d.rarity}</Text> : null}
              </View>
            </View>
            {(d.priceCoins || player.priceCoins) ? (
              <View style={styles.paylasFiyatKutu}>
                <Text style={styles.paylasFiyatEtiket}>GÜNCEL FİYAT</Text>
                <Text style={[styles.paylasFiyatDeger, { color: RENKLER.vurgu }]}>
                  {(d.priceCoins || player.priceCoins).toLocaleString('tr-TR')} coin
                </Text>
              </View>
            ) : null}
            <View style={styles.paylasAltBilgiSatiri}>
              {(d.nation || d.club) ? <Text style={styles.paylasAltBilgi} numberOfLines={1}>{[d.nation, d.club].filter(Boolean).join(' · ')}</Text> : null}
              {d.accelerateType ? <Text style={styles.paylasAltBilgi}>AcceleRATE: {d.accelerateType}</Text> : null}
            </View>
          </PaylasimKarti>
        </View>

        <View ref={statsRef} collapsable={false}>
          <PaylasimKarti baslik="Stats" vurguRenk={RENKLER.vurgu}>
            <View style={styles.paylasUstSatir}>
              <OyuncuKarti duzGorselUrl={duzGorselUrl} yuzUrl={yuzUrl} cerceveUrl={cerceveUrl} rating={d.rating} pozisyon={d.mainPosition || player.position} attrs={attrs} isim={d.name || player.name} nationIconUrl={d.nationIconUrl} leagueIconUrl={d.leagueIconUrl} weakFoot={d.weakFoot} skillMoves={d.skillMoves} genislik={90} />
              <View style={{ flex: 1 }}>
                <Text style={styles.paylasIsim} numberOfLines={2}>{d.name || player.name}</Text>
                <View style={styles.paylasRozetSatiri}>
                  {(d.mainPosition || player.position) ? <Text style={styles.paylasPozisyon}>{d.mainPosition || player.position}</Text> : null}
                  {d.rating ? <Text style={styles.paylasRating}>{d.rating} OVR</Text> : null}
                </View>
                {d.rarity ? <Text style={styles.paylasRarity} numberOfLines={1}>{d.rarity}</Text> : null}
              </View>
            </View>
            {attrs ? (
              <View style={styles.paylasDetayGrid}>
                {Object.entries(attrs).map(([kat, data]) => (
                  <View key={kat} style={styles.paylasDetayKart}>
                    <View style={styles.paylasDetayUstSatir}>
                      <Text style={styles.paylasAttrEtiket}>{KATEGORI_ETIKET[kat] || kat.toUpperCase()}</Text>
                      <Text style={[styles.paylasAttrDeger, { color: tierRengi(RENKLER, data.value) }]}>{data.value ?? '-'}</Text>
                    </View>
                    <View style={[styles.paylasDetayCizgi, { backgroundColor: tierRengi(RENKLER, data.value) }]} />
                    {Object.entries(data.subs || {}).map(([label, val]) => (
                      <View key={label} style={styles.paylasAltSatir}>
                        <Text style={styles.paylasAltEtiket} numberOfLines={1}>{ALT_ETIKET[label] || label}</Text>
                        <Text style={[styles.paylasAltDeger, { color: tierRengi(RENKLER, val) }]}>{val}</Text>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            ) : null}
            {(d.playstyles || []).length > 0 ? (
              <>
                <Text style={styles.paylasPsBaslik}>ÖNERİLEN PLAYSTYLE'LAR</Text>
                <View style={styles.paylasPsGrid}>
                  {d.playstyles.map((ps, i) => (
                    <View key={i} style={[styles.paylasPsChip, ps.plus && styles.paylasPsChipArtı]}>
                      <PlaystyleIcon name={ps.name} plus={ps.plus} size={22} />
                      <Text style={[styles.paylasPsChipMetin, ps.plus && styles.paylasPsChipMetinArtı]} numberOfLines={1}>
                        {ps.name}{ps.plus ? '+' : ''}
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            ) : null}
          </PaylasimKarti>
        </View>
      </View>

      <View style={styles.ustBolum}>
        {/* player.imageUrl (list scrape) is fut.gg's flattened card render
            — frame + player baked into one image, so prefer it. Not every
            player has reached the list sync yet (e.g. a brand-new SBC
            reward player) — for those, OyuncuKarti composites the detail
            page's bare face cutout over its own rarity frame instead of
            falling back to a frameless face crop. */}
        <OyuncuKarti duzGorselUrl={duzGorselUrl} yuzUrl={yuzUrl} cerceveUrl={cerceveUrl} rating={d.rating} pozisyon={d.mainPosition || player.position} attrs={attrs} isim={d.name || player.name} nationIconUrl={d.nationIconUrl} leagueIconUrl={d.leagueIconUrl} weakFoot={d.weakFoot} skillMoves={d.skillMoves} genislik={168} />

        <View style={styles.bilgiSutunu}>
          <View style={styles.rozetSatiri}>
            {(d.mainPosition || player.position) ? <Text style={styles.anaPozisyon}>{d.mainPosition || player.position}</Text> : null}
            {d.rating ? <Text style={styles.ratingBuyuk}>{d.rating} OVR</Text> : null}
          </View>

          {(d.altPositions || []).length > 0 ? (
            <View style={styles.chipSatiri}>
              {d.altPositions.map((p, i) => <Text key={i} style={styles.altPozisyonChip}>{p}</Text>)}
            </View>
          ) : null}

          <View style={styles.ikonSatiri}>
            {d.nationIconUrl ? <Image source={{ uri: d.nationIconUrl }} style={styles.kucukIkon} /> : null}
            {d.leagueIconUrl ? <Image source={{ uri: d.leagueIconUrl }} style={styles.kucukIkon} /> : null}
            {d.clubIconUrl ? <Image source={{ uri: d.clubIconUrl }} style={styles.kucukIkon} /> : null}
          </View>
          {(d.nation || d.league || d.club) ? (
            <Text style={styles.altMetin}>{[d.nation, d.club, d.league].filter(Boolean).join(' · ')}</Text>
          ) : null}

          <View style={styles.detaySatiri}>
            {d.preferredFoot ? <Ozellik etiket="Ayak" deger={d.preferredFoot === 'R' ? 'Sağ' : 'Sol'} /> : null}
            {d.weakFoot ? <Ozellik etiket="Zayıf Ayak" deger={`${d.weakFoot}★`} /> : null}
            {d.skillMoves ? <Ozellik etiket="Beceri" deger={`${d.skillMoves}★`} /> : null}
          </View>

          {((d.priceCoins || player.priceCoins) || d.gradingScore) ? (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {(d.priceCoins || player.priceCoins) ? (
                <View style={styles.fiyatKutu}>
                  <Text style={styles.fiyatEtiket}>🪙 Fiyat</Text>
                  <Text style={styles.fiyatDeger}>{(d.priceCoins || player.priceCoins).toLocaleString('tr-TR')} coin</Text>
                </View>
              ) : null}
              {d.gradingScore ? (
                <View style={styles.fiyatKutu}>
                  <Text style={styles.fiyatEtiket}>💎 Puan</Text>
                  <Text style={[styles.fiyatDeger, { color: RENKLER.vurgu2 }]}>{d.gradingScore.toLocaleString('tr-TR')}</Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>
      </View>

      {versiyonlar.length > 0 ? (
        <View style={{ marginTop: 20 }}>
          <Text style={[styles.bolumBaslik, { paddingHorizontal: 16 }]}>Diğer Versiyonlar ({versiyonlar.length})</Text>
          <FlatList
            data={versiyonlar}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
            keyExtractor={(v) => v.futggId}
            renderItem={({ item: v }) => (
              <Pressable onPress={() => router.push(`/oyuncular/${v.futggId}`)} style={styles.versKart}>
                {v.cardFrameUrl ? (
                  <OyuncuKarti yuzUrl={v.imageUrl} cerceveUrl={v.cardFrameUrl} genislik={72} />
                ) : v.imageUrl ? (
                  <Image source={{ uri: v.imageUrl }} style={styles.versGorsel} resizeMode="contain" />
                ) : null}
                <Text style={styles.versRating}>{v.rating} OVR</Text>
                <Text style={styles.versRarity} numberOfLines={2}>{v.rarity || '-'}</Text>
              </Pressable>
            )}
          />
        </View>
      ) : null}

      {(d.playstyles || []).length > 0 ? (
        <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
          <Text style={styles.bolumBaslik}>Önerilen PlayStyle'lar</Text>
          <Text style={styles.psAltBaslik}>Bu kartla önerilen playstyle'lar — oyuncu maçta kendi tercihini seçer, kartın kendi sabit özelliği değildir.</Text>
          <View style={styles.psGrid}>
            {d.playstyles.map((ps, i) => (
              <View key={i} style={[styles.psChip, ps.plus && styles.psChipArtı]}>
                <PlaystyleIcon name={ps.name} plus={ps.plus} />
                <Text style={[styles.psMetin, ps.plus && styles.psMetinArtı]} numberOfLines={1}>
                  {ps.name}{ps.plus ? '+' : ''}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {(d.rarity || d.height || d.weight || d.accelerateType || d.bodyType || d.age) ? (
        <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
          <Text style={styles.bolumBaslik}>Genel Bilgiler</Text>
          <View style={ORTAK_STIL.kart}>
            <Satir etiket="Rarity" deger={d.rarity} />
            <Satir etiket="Boy" deger={d.height} />
            <Satir etiket="Kilo" deger={d.weight} />
            <Satir etiket="İvme Tipi (AcceleRATE)" deger={d.accelerateType} />
            <Satir etiket="Vücut Tipi" deger={d.bodyType} />
            <Satir etiket="Yaş" deger={d.age} />
          </View>
        </View>
      ) : null}

      {(d.ggRatings || []).length > 0 ? (
        <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
          <Text style={styles.bolumBaslik}>FT Rating</Text>
          <View style={styles.ggGrid}>
            {d.ggRatings.map((gg, i) => (
              <View key={i} style={styles.ggKart}>
                <View style={styles.ggUstSatir}>
                  <Text style={styles.ggPozisyon}>{gg.position}</Text>
                  <Text style={styles.ggRating}>{gg.rating}</Text>
                </View>
                {gg.role ? <Text style={styles.ggRol} numberOfLines={1}>{gg.role}</Text> : null}
                {gg.rank ? <Text style={styles.ggRank}>{gg.rank}</Text> : null}
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {attrs ? (
        <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
          <Text style={styles.bolumBaslik}>Öznitelikler</Text>
          <View style={styles.attrGrid}>
            {Object.entries(attrs).map(([kat, data]) => (
              <View key={kat} style={styles.attrKart}>
                <View style={styles.katUstSatir}>
                  <Text style={styles.katBaslik}>{KATEGORI_ETIKET[kat] || kat.toUpperCase()}</Text>
                  <Text style={[styles.katDeger, { color: tierRengi(RENKLER, data.value) }]}>{data.value ?? '-'}</Text>
                </View>
                {Object.entries(data.subs || {}).map(([label, val]) => (
                  <View key={label} style={[styles.altSatir, { borderBottomColor: tierRengi(RENKLER, val) }]}>
                    <Text style={styles.altEtiket} numberOfLines={1}>{ALT_ETIKET[label] || label}</Text>
                    <Text style={[styles.altDeger, { color: tierRengi(RENKLER, val) }]}>{val}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        </View>
      ) : null}
      </ScrollView>
    </View>
  );
}

function UstBar({ router, baslik, insets, sagIcerik }) {
  const RENKLER = useRenkler();
  const styles = olusturStyles(RENKLER);
  return (
    <View style={[styles.ustBar, { paddingTop: insets.top + 12 }]}>
      <Pressable onPress={() => router.back()} hitSlop={10}>
        <Text style={styles.geriOk}>‹</Text>
      </Pressable>
      <Text style={styles.baslik} numberOfLines={1}>{baslik}</Text>
      <View style={{ minWidth: 24, alignItems: 'flex-end' }}>{sagIcerik || null}</View>
    </View>
  );
}

function Ozellik({ etiket, deger }) {
  const RENKLER = useRenkler();
  const styles = olusturStyles(RENKLER);
  return (
    <View style={styles.ozellikKutu}>
      <Text style={styles.ozellikEtiket}>{etiket}</Text>
      <Text style={styles.ozellikDeger}>{deger}</Text>
    </View>
  );
}

function Satir({ etiket, deger }) {
  const RENKLER = useRenkler();
  const styles = olusturStyles(RENKLER);
  if (!deger) return null;
  return (
    <View style={styles.satir}>
      <Text style={styles.satirEtiket}>{etiket}</Text>
      <Text style={styles.satirDeger}>{deger}</Text>
    </View>
  );
}

function olusturStyles(RENKLER) {
  return StyleSheet.create({
  ustBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12 },
  geriOk: { fontSize: 28, color: RENKLER.metin, fontWeight: '300', width: 24 },
  baslik: { fontSize: 18, fontWeight: '800', color: RENKLER.metin, flex: 1, textAlign: 'center' },
  bos: { color: RENKLER.metinIkincil, textAlign: 'center', marginTop: 40, paddingHorizontal: 24 },
  ustBolum: { flexDirection: 'row', paddingHorizontal: 16, marginTop: 8, gap: 14, alignItems: 'flex-start' },
  bilgiSutunu: { flex: 1, paddingTop: 6 },
  rozetSatiri: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  anaPozisyon: { fontSize: 13, fontWeight: '800', color: RENKLER.bg, backgroundColor: RENKLER.vurgu2, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  ratingBuyuk: { fontSize: 20, fontWeight: '900', color: RENKLER.metin },
  chipSatiri: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  altPozisyonChip: { fontSize: 10.5, fontWeight: '700', color: RENKLER.metinIkincil, backgroundColor: RENKLER.bg3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5 },
  ikonSatiri: { flexDirection: 'row', gap: 8, marginTop: 12, alignItems: 'center' },
  kucukIkon: { width: 20, height: 20, resizeMode: 'contain' },
  altMetin: { fontSize: 11, color: RENKLER.metinIkincil, marginTop: 5 },
  satir: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: RENKLER.ayrici },
  satirEtiket: { fontSize: 12.5, color: RENKLER.metinIkincil },
  satirDeger: { fontSize: 12.5, color: RENKLER.metin, fontWeight: '700' },
  detaySatiri: { flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' },
  ozellikKutu: { backgroundColor: RENKLER.bg3, borderRadius: 10, paddingVertical: 7, paddingHorizontal: 11, alignItems: 'center' },
  ozellikEtiket: { fontSize: 8.5, fontWeight: '700', color: RENKLER.metinUcuncul, textTransform: 'uppercase' },
  ozellikDeger: { fontSize: 12, fontWeight: '800', color: RENKLER.metin, marginTop: 2 },
  fiyatKutu: { marginTop: 12, alignItems: 'flex-start', backgroundColor: RENKLER.bg2, borderRadius: 12, paddingVertical: 9, paddingHorizontal: 16, borderWidth: 1, borderColor: RENKLER.ayrici, alignSelf: 'flex-start' },
  fiyatEtiket: { fontSize: 9.5, color: RENKLER.metinUcuncul, textTransform: 'uppercase', letterSpacing: 0.5 },
  fiyatDeger: { fontSize: 17, color: RENKLER.uyari, fontWeight: '800', marginTop: 2 },
  bolumBaslik: { fontSize: 16, fontWeight: '800', color: RENKLER.metin, marginBottom: 10 },
  ggGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  ggKart: { width: '48%', backgroundColor: RENKLER.bg2, borderRadius: 12, padding: 10, borderWidth: 1, borderColor: RENKLER.ayrici },
  ggUstSatir: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ggPozisyon: { fontSize: 11, fontWeight: '800', color: RENKLER.bg, backgroundColor: RENKLER.vurgu, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  ggRating: { fontSize: 17, fontWeight: '900', color: RENKLER.metin },
  ggRol: { fontSize: 11, color: RENKLER.metinIkincil, marginTop: 4 },
  ggRank: { fontSize: 10.5, color: RENKLER.vurgu2, marginTop: 2, fontWeight: '700' },
  psAltBaslik: { fontSize: 11, color: RENKLER.metinUcuncul, marginBottom: 10, lineHeight: 15 },
  psGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  psChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: RENKLER.bg2, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: RENKLER.ayrici,
  },
  psChipArtı: { borderColor: RENKLER.vurgu2, backgroundColor: `${RENKLER.vurgu2}1a` },
  psMetin: { fontSize: 12, fontWeight: '700', color: RENKLER.metinIkincil },
  psMetinArtı: { color: RENKLER.vurgu2 },
  attrGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  attrKart: { width: '48%', backgroundColor: RENKLER.bg2, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: RENKLER.ayrici },
  katUstSatir: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  katBaslik: { fontSize: 11.5, fontWeight: '800', color: RENKLER.vurgu2, letterSpacing: 0.5 },
  katDeger: { fontSize: 18, fontWeight: '900' },
  altSatir: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 5, borderBottomWidth: 1.5,
  },
  altEtiket: { fontSize: 11, color: RENKLER.metinIkincil, flex: 1 },
  altDeger: { fontSize: 12.5, fontWeight: '800', marginLeft: 6 },
  versKart: { width: 96, backgroundColor: RENKLER.bg2, borderRadius: 12, padding: 8, borderWidth: 1, borderColor: RENKLER.ayrici, alignItems: 'center' },
  versGorsel: { width: 72, height: 100 },
  versRating: { fontSize: 12.5, fontWeight: '900', color: RENKLER.metin, marginTop: 4 },
  versRarity: { fontSize: 9, color: RENKLER.metinIkincil, textAlign: 'center', marginTop: 2 },
  paylasUstSatir: { flexDirection: 'row', gap: 16, alignItems: 'center', marginTop: 18 },
  paylasIsim: { fontSize: 19, fontWeight: '900', color: RENKLER.metin },
  paylasRozetSatiri: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  paylasPozisyon: { fontSize: 11, fontWeight: '800', color: RENKLER.bg, backgroundColor: RENKLER.vurgu2, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5 },
  paylasRating: { fontSize: 18, fontWeight: '900', color: RENKLER.metin },
  paylasRarity: { fontSize: 11.5, color: RENKLER.metinIkincil, marginTop: 4 },
  paylasAttrEtiket: { fontSize: 11, fontWeight: '800', color: RENKLER.metinUcuncul, letterSpacing: 0.5 },
  paylasAttrDeger: { fontSize: 20, fontWeight: '900' },
  paylasDetayGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 18 },
  paylasDetayKart: { width: '47.5%', backgroundColor: RENKLER.bg2, borderRadius: 12, padding: 12 },
  paylasDetayUstSatir: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  paylasDetayCizgi: { height: 2.5, borderRadius: 2, marginTop: 6, marginBottom: 8 },
  paylasAltSatir: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  paylasAltEtiket: { fontSize: 10, color: RENKLER.metinIkincil, flex: 1 },
  paylasAltDeger: { fontSize: 11, fontWeight: '800', marginLeft: 6 },
  paylasPsBaslik: { fontSize: 10, fontWeight: '800', color: RENKLER.metinUcuncul, letterSpacing: 0.5, marginTop: 16 },
  paylasPsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  paylasPsChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: RENKLER.bg2, borderRadius: 16,
    paddingHorizontal: 8, paddingVertical: 5, borderWidth: 1, borderColor: RENKLER.ayrici,
  },
  paylasPsChipArtı: { borderColor: RENKLER.vurgu2, backgroundColor: `${RENKLER.vurgu2}1a` },
  paylasPsChipMetin: { fontSize: 9.5, fontWeight: '700', color: RENKLER.metinIkincil },
  paylasPsChipMetinArtı: { color: RENKLER.vurgu2 },
  paylasFiyatKutu: { marginTop: 20, backgroundColor: RENKLER.bg2, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  paylasFiyatEtiket: { fontSize: 10, fontWeight: '800', color: RENKLER.metinUcuncul, letterSpacing: 1 },
  paylasFiyatDeger: { fontSize: 26, fontWeight: '900', marginTop: 4 },
  paylasAltBilgiSatiri: { marginTop: 14, gap: 4 },
  paylasAltBilgi: { fontSize: 11, color: RENKLER.metinIkincil },
  });
}
