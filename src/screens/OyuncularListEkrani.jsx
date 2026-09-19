import OyuncuKarti from '../components/OyuncuKarti';
import { useEffect, useRef, useState } from 'react';
import { View, Text, FlatList, Image, Pressable, ActivityIndicator, TextInput, Modal, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../services/api';
import { useRenkler, useOrtakStil } from '../constants/theme';
import NeonParilti from '../components/NeonParilti';

const SIRALAMA_SECENEKLERI = [
  { key: 'rating', label: 'Rating' },
  { key: 'price', label: 'Fiyat' },
  { key: 'name', label: 'İsim' },
];

const POZISYON_GRUPLARI = [
  { baslik: 'Forvet', pozisyonlar: ['LW', 'ST', 'RW'] },
  { baslik: 'Orta Saha', pozisyonlar: ['LM', 'CAM', 'RM', 'CDM', 'CM'] },
  { baslik: 'Defans', pozisyonlar: ['LB', 'RB', 'CB', 'GK'] },
];

const AYAK_SECENEKLERI = [{ key: 'R', label: 'Sağ' }, { key: 'L', label: 'Sol' }];
const YILDIZ_SECENEKLERI = ['1', '2', '3', '4', '5'];

const VARSAYILAN_FILTRE = {
  sortBy: 'rating', sortDir: 'desc', positions: [], minRating: '', maxRating: '', minPrice: '', maxPrice: '',
  clubs: [], leagues: [], nations: [], rarities: [], accelerateTypes: [], bodyTypes: [], preferredFeet: [], skillMoves: [], weakFoot: [],
};

export default function OyuncularListEkrani() {
  const RENKLER = useRenkler();
  const ORTAK_STIL = useOrtakStil();
  const styles = olusturStyles(RENKLER);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState('');
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filtre, setFiltre] = useState(VARSAYILAN_FILTRE);
  const [taslakFiltre, setTaslakFiltre] = useState(VARSAYILAN_FILTRE);
  const [panelAcik, setPanelAcik] = useState(false);
  const [secenekler, setSecenekler] = useState({ clubs: [], leagues: [], nations: [], rarities: [], accelerateTypes: [], bodyTypes: [] });
  const debounceRef = useRef(null);

  const ara = (query, f) => {
    setLoading(true);
    api.players({
      q: query,
      limit: 40,
      sortBy: f.sortBy,
      sortDir: f.sortDir,
      positions: f.positions.join(','),
      minRating: f.minRating,
      maxRating: f.maxRating,
      minPrice: f.minPrice,
      maxPrice: f.maxPrice,
      clubs: f.clubs.join(','),
      leagues: f.leagues.join(','),
      nations: f.nations.join(','),
      rarities: f.rarities.join(','),
      accelerateTypes: f.accelerateTypes.join(','),
      bodyTypes: f.bodyTypes.join(','),
      preferredFeet: f.preferredFeet.join(','),
      skillMoves: f.skillMoves.join(','),
      weakFoot: f.weakFoot.join(','),
    })
      .then((data) => { setItems(data.items); setTotal(data.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { ara(q, filtre); }, [filtre]);
  // Club/Nation/League/Rarity/AcceleRATE/Body Type options fill in as the
  // background detail backfill scrapes more of the ~10k catalog — refetched
  // each time the filter panel opens so the list keeps growing.
  useEffect(() => {
    if (panelAcik) api.playerFilterOptions().then(setSecenekler).catch(() => {});
  }, [panelAcik]);

  const metinDegisti = (text) => {
    setQ(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => ara(text, filtre), 350);
  };

  const panelAc = () => { setTaslakFiltre(filtre); setPanelAcik(true); };
  const panelUygula = () => { setFiltre(taslakFiltre); setPanelAcik(false); };
  const panelSifirla = () => { setTaslakFiltre(VARSAYILAN_FILTRE); };

  const cokluSecToggle = (alan, deger) => {
    setTaslakFiltre((f) => ({
      ...f,
      [alan]: f[alan].includes(deger) ? f[alan].filter((v) => v !== deger) : [...f[alan], deger],
    }));
  };

  const COKLU_ALANLAR = ['positions', 'clubs', 'leagues', 'nations', 'rarities', 'accelerateTypes', 'bodyTypes', 'preferredFeet', 'skillMoves', 'weakFoot'];
  const aktifFiltreSayisi = COKLU_ALANLAR.reduce((sum, alan) => sum + filtre[alan].length, 0)
    + [filtre.minRating, filtre.maxRating, filtre.minPrice, filtre.maxPrice].filter((v) => v !== '').length;

  return (
    <View style={ORTAK_STIL.ekran}>
      <NeonParilti />
      <View style={[styles.ustBar, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={styles.geriOk}>‹</Text>
        </Pressable>
        <Text style={styles.baslik}>Oyuncular ⚽</Text>
        <View style={{ width: 24 }} />
      </View>
      {total > 0 ? <Text style={styles.sayac}>{total.toLocaleString('tr-TR')} oyuncu · canlı veri</Text> : null}

      <View style={styles.aramaSatiri}>
        <TextInput
          style={styles.aramaInput}
          placeholder="Oyuncu ara (ör. Wirtz)"
          placeholderTextColor={RENKLER.metinUcuncul}
          value={q}
          onChangeText={metinDegisti}
        />
        <Pressable onPress={panelAc} style={[styles.filtreButon, aktifFiltreSayisi > 0 && styles.filtreButonAktif]}>
          <Text style={styles.filtreButonMetin}>⚙️{aktifFiltreSayisi > 0 ? ` ${aktifFiltreSayisi}` : ''}</Text>
        </Pressable>
      </View>

      {loading && items.length === 0 ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={RENKLER.vurgu} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.futggId}
          contentContainerStyle={{ padding: 16, paddingTop: 8, paddingBottom: 40 }}
          refreshing={loading}
          onRefresh={() => ara(q, filtre)}
          ListEmptyComponent={<Text style={styles.bos}>Oyuncu bulunamadı.</Text>}
          renderItem={({ item }) => (
            <Pressable onPress={() => router.push(`/oyuncular/${item.futggId}`)} style={({ pressed }) => [ORTAK_STIL.kart, { marginBottom: 10, flexDirection: 'row', gap: 12, alignItems: 'center' }, pressed && { opacity: 0.85 }]}>
              {item.imageUrl && item.cardFrameUrl ? (
                <OyuncuKarti duzGorselUrl={item.flatCardUrl || item.cardImageUrl} yuzUrl={item.imageUrl} cerceveUrl={item.cardFrameUrl} genislik={52} />
              ) : item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={styles.gorsel} resizeMode="contain" />
              ) : (
                <View style={[styles.gorsel, { backgroundColor: RENKLER.bg3 }]} />
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.isim}>{item.name}</Text>
                <View style={{ flexDirection: 'row', gap: 6, marginTop: 3 }}>
                  {item.position ? <Text style={styles.pozisyon}>{item.position}</Text> : null}
                  {item.rating ? <Text style={styles.rating}>{item.rating} OVR</Text> : null}
                </View>
                {item.priceCoins ? <Text style={styles.fiyat}>{item.priceCoins.toLocaleString('tr-TR')} coin</Text> : null}
              </View>
              <Text style={styles.ok}>›</Text>
            </Pressable>
          )}
        />
      )}

      <Modal visible={panelAcik} animationType="slide" transparent onRequestClose={() => setPanelAcik(false)}>
        <View style={styles.modalArkaplan}>
          <View style={styles.panel}>
            <View style={styles.panelUstBar}>
              <Text style={styles.panelBaslik}>Sırala ve Filtrele</Text>
              <Pressable onPress={() => setPanelAcik(false)} hitSlop={10}>
                <Text style={styles.panelKapat}>✕</Text>
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 12 }}>
              <Text style={styles.bolumBaslik}>Sıralama</Text>
              <View style={styles.chipSatiri}>
                {SIRALAMA_SECENEKLERI.map((s) => (
                  <Pressable
                    key={s.key}
                    onPress={() => setTaslakFiltre((f) => ({ ...f, sortBy: s.key }))}
                    style={[styles.chip, taslakFiltre.sortBy === s.key && styles.chipSecili]}
                  >
                    <Text style={[styles.chipMetin, taslakFiltre.sortBy === s.key && styles.chipMetinSecili]}>{s.label}</Text>
                  </Pressable>
                ))}
              </View>
              <View style={[styles.chipSatiri, { marginTop: 8 }]}>
                <Pressable
                  onPress={() => setTaslakFiltre((f) => ({ ...f, sortDir: 'desc' }))}
                  style={[styles.chip, taslakFiltre.sortDir === 'desc' && styles.chipSecili]}
                >
                  <Text style={[styles.chipMetin, taslakFiltre.sortDir === 'desc' && styles.chipMetinSecili]}>Yüksekten Düşüğe ↓</Text>
                </Pressable>
                <Pressable
                  onPress={() => setTaslakFiltre((f) => ({ ...f, sortDir: 'asc' }))}
                  style={[styles.chip, taslakFiltre.sortDir === 'asc' && styles.chipSecili]}
                >
                  <Text style={[styles.chipMetin, taslakFiltre.sortDir === 'asc' && styles.chipMetinSecili]}>Düşükten Yükseğe ↑</Text>
                </Pressable>
              </View>

              <Text style={[styles.bolumBaslik, { marginTop: 18 }]}>OVR</Text>
              <View style={styles.aralikSatiri}>
                <TextInput
                  style={styles.aralikInput}
                  placeholder="Min"
                  placeholderTextColor={RENKLER.metinUcuncul}
                  keyboardType="number-pad"
                  value={String(taslakFiltre.minRating)}
                  onChangeText={(v) => setTaslakFiltre((f) => ({ ...f, minRating: v.replace(/[^\d]/g, '') }))}
                />
                <Text style={styles.aralikCizgi}>—</Text>
                <TextInput
                  style={styles.aralikInput}
                  placeholder="Max"
                  placeholderTextColor={RENKLER.metinUcuncul}
                  keyboardType="number-pad"
                  value={String(taslakFiltre.maxRating)}
                  onChangeText={(v) => setTaslakFiltre((f) => ({ ...f, maxRating: v.replace(/[^\d]/g, '') }))}
                />
              </View>

              <Text style={[styles.bolumBaslik, { marginTop: 18 }]}>Fiyat (coin)</Text>
              <View style={styles.aralikSatiri}>
                <TextInput
                  style={styles.aralikInput}
                  placeholder="Min"
                  placeholderTextColor={RENKLER.metinUcuncul}
                  keyboardType="number-pad"
                  value={String(taslakFiltre.minPrice)}
                  onChangeText={(v) => setTaslakFiltre((f) => ({ ...f, minPrice: v.replace(/[^\d]/g, '') }))}
                />
                <Text style={styles.aralikCizgi}>—</Text>
                <TextInput
                  style={styles.aralikInput}
                  placeholder="Max"
                  placeholderTextColor={RENKLER.metinUcuncul}
                  keyboardType="number-pad"
                  value={String(taslakFiltre.maxPrice)}
                  onChangeText={(v) => setTaslakFiltre((f) => ({ ...f, maxPrice: v.replace(/[^\d]/g, '') }))}
                />
              </View>

              {POZISYON_GRUPLARI.map((grup) => (
                <View key={grup.baslik}>
                  <Text style={[styles.bolumBaslik, { marginTop: 18 }]}>{grup.baslik}</Text>
                  <View style={styles.chipSatiri}>
                    {grup.pozisyonlar.map((poz) => (
                      <Pressable
                        key={poz}
                        onPress={() => cokluSecToggle('positions', poz)}
                        style={[styles.chip, taslakFiltre.positions.includes(poz) && styles.chipSecili]}
                      >
                        <Text style={[styles.chipMetin, taslakFiltre.positions.includes(poz) && styles.chipMetinSecili]}>{poz}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              ))}

              <Text style={[styles.bolumBaslik, { marginTop: 18 }]}>Skill Moves</Text>
              <View style={styles.chipSatiri}>
                {YILDIZ_SECENEKLERI.map((y) => (
                  <Pressable key={y} onPress={() => cokluSecToggle('skillMoves', y)} style={[styles.chip, taslakFiltre.skillMoves.includes(y) && styles.chipSecili]}>
                    <Text style={[styles.chipMetin, taslakFiltre.skillMoves.includes(y) && styles.chipMetinSecili]}>{y}★</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={[styles.bolumBaslik, { marginTop: 18 }]}>Weak Foot</Text>
              <View style={styles.chipSatiri}>
                {YILDIZ_SECENEKLERI.map((y) => (
                  <Pressable key={y} onPress={() => cokluSecToggle('weakFoot', y)} style={[styles.chip, taslakFiltre.weakFoot.includes(y) && styles.chipSecili]}>
                    <Text style={[styles.chipMetin, taslakFiltre.weakFoot.includes(y) && styles.chipMetinSecili]}>{y}★</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={[styles.bolumBaslik, { marginTop: 18 }]}>Kuvvetli Ayak</Text>
              <View style={styles.chipSatiri}>
                {AYAK_SECENEKLERI.map((a) => (
                  <Pressable key={a.key} onPress={() => cokluSecToggle('preferredFeet', a.key)} style={[styles.chip, taslakFiltre.preferredFeet.includes(a.key) && styles.chipSecili]}>
                    <Text style={[styles.chipMetin, taslakFiltre.preferredFeet.includes(a.key) && styles.chipMetinSecili]}>{a.label}</Text>
                  </Pressable>
                ))}
              </View>

              {secenekler.accelerateTypes.length > 0 ? (
                <>
                  <Text style={[styles.bolumBaslik, { marginTop: 18 }]}>İvme Tipi (AcceleRATE)</Text>
                  <View style={styles.chipSatiri}>
                    {secenekler.accelerateTypes.map((v) => (
                      <Pressable key={v} onPress={() => cokluSecToggle('accelerateTypes', v)} style={[styles.chip, taslakFiltre.accelerateTypes.includes(v) && styles.chipSecili]}>
                        <Text style={[styles.chipMetin, taslakFiltre.accelerateTypes.includes(v) && styles.chipMetinSecili]}>{v}</Text>
                      </Pressable>
                    ))}
                  </View>
                </>
              ) : null}

              {secenekler.bodyTypes.length > 0 ? (
                <>
                  <Text style={[styles.bolumBaslik, { marginTop: 18 }]}>Vücut Tipi</Text>
                  <View style={styles.chipSatiri}>
                    {secenekler.bodyTypes.slice(0, 40).map((v) => (
                      <Pressable key={v} onPress={() => cokluSecToggle('bodyTypes', v)} style={[styles.chip, taslakFiltre.bodyTypes.includes(v) && styles.chipSecili]}>
                        <Text style={[styles.chipMetin, taslakFiltre.bodyTypes.includes(v) && styles.chipMetinSecili]}>{v}</Text>
                      </Pressable>
                    ))}
                  </View>
                </>
              ) : null}

              {secenekler.rarities.length > 0 ? (
                <>
                  <Text style={[styles.bolumBaslik, { marginTop: 18 }]}>Rarity</Text>
                  <View style={styles.chipSatiri}>
                    {secenekler.rarities.slice(0, 40).map((v) => (
                      <Pressable key={v} onPress={() => cokluSecToggle('rarities', v)} style={[styles.chip, taslakFiltre.rarities.includes(v) && styles.chipSecili]}>
                        <Text style={[styles.chipMetin, taslakFiltre.rarities.includes(v) && styles.chipMetinSecili]}>{v}</Text>
                      </Pressable>
                    ))}
                  </View>
                </>
              ) : null}

              {secenekler.nations.length > 0 ? (
                <>
                  <Text style={[styles.bolumBaslik, { marginTop: 18 }]}>Ülke</Text>
                  <View style={styles.chipSatiri}>
                    {secenekler.nations.slice(0, 60).map((v) => (
                      <Pressable key={v} onPress={() => cokluSecToggle('nations', v)} style={[styles.chip, taslakFiltre.nations.includes(v) && styles.chipSecili]}>
                        <Text style={[styles.chipMetin, taslakFiltre.nations.includes(v) && styles.chipMetinSecili]}>{v}</Text>
                      </Pressable>
                    ))}
                  </View>
                </>
              ) : null}

              {secenekler.leagues.length > 0 ? (
                <>
                  <Text style={[styles.bolumBaslik, { marginTop: 18 }]}>Lig</Text>
                  <View style={styles.chipSatiri}>
                    {secenekler.leagues.slice(0, 60).map((v) => (
                      <Pressable key={v} onPress={() => cokluSecToggle('leagues', v)} style={[styles.chip, taslakFiltre.leagues.includes(v) && styles.chipSecili]}>
                        <Text style={[styles.chipMetin, taslakFiltre.leagues.includes(v) && styles.chipMetinSecili]}>{v}</Text>
                      </Pressable>
                    ))}
                  </View>
                </>
              ) : null}

              {secenekler.clubs.length > 0 ? (
                <>
                  <Text style={[styles.bolumBaslik, { marginTop: 18 }]}>Kulüp</Text>
                  <View style={styles.chipSatiri}>
                    {secenekler.clubs.slice(0, 80).map((v) => (
                      <Pressable key={v} onPress={() => cokluSecToggle('clubs', v)} style={[styles.chip, taslakFiltre.clubs.includes(v) && styles.chipSecili]}>
                        <Text style={[styles.chipMetin, taslakFiltre.clubs.includes(v) && styles.chipMetinSecili]}>{v}</Text>
                      </Pressable>
                    ))}
                  </View>
                </>
              ) : null}

              {secenekler.clubs.length === 0 ? (
                <Text style={styles.bilgiNotu}>Kulüp/Ülke/Lig/Rarity/İvme Tipi/Vücut Tipi filtreleri, arka planda çalışan tüm katalog taraması ilerledikçe burada belirecek.</Text>
              ) : null}
            </ScrollView>

            <View style={styles.panelAltButonlar}>
              <Pressable onPress={panelSifirla} style={styles.sifirlaButon}>
                <Text style={styles.sifirlaMetin}>Sıfırla</Text>
              </Pressable>
              <Pressable onPress={panelUygula} style={styles.uygulaButon}>
                <Text style={styles.uygulaMetin}>Uygula</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function olusturStyles(RENKLER) {
  return StyleSheet.create({
  ustBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 24, paddingBottom: 4 },
  sayac: { textAlign: 'center', color: RENKLER.metinUcuncul, fontSize: 11.5, marginTop: 4 },
  geriOk: { fontSize: 28, color: RENKLER.metin, fontWeight: '300', width: 24 },
  baslik: { fontSize: 18, fontWeight: '800', color: RENKLER.metin, flex: 1, textAlign: 'center' },
  aramaSatiri: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginTop: 10 },
  aramaInput: {
    flex: 1, backgroundColor: RENKLER.bg2, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    color: RENKLER.metin, borderWidth: 1, borderColor: RENKLER.ayrici, fontSize: 14,
  },
  filtreButon: { backgroundColor: RENKLER.bg2, borderRadius: 12, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: RENKLER.ayrici },
  filtreButonAktif: { backgroundColor: RENKLER.vurgu, borderColor: RENKLER.vurgu },
  filtreButonMetin: { fontSize: 15, fontWeight: '700', color: RENKLER.metin },
  gorsel: { width: 52, height: 52 },
  isim: { fontSize: 14.5, fontWeight: '700', color: RENKLER.metin },
  pozisyon: { fontSize: 10.5, fontWeight: '800', color: RENKLER.bg, backgroundColor: RENKLER.vurgu2, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  rating: { fontSize: 11.5, fontWeight: '700', color: RENKLER.metinIkincil },
  fiyat: { fontSize: 11.5, color: RENKLER.uyari, fontWeight: '700', marginTop: 3 },
  ok: { fontSize: 24, color: RENKLER.metinUcuncul, fontWeight: '300' },
  bos: { color: RENKLER.metinIkincil, textAlign: 'center', marginTop: 40, paddingHorizontal: 24 },
  modalArkaplan: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  panel: { backgroundColor: RENKLER.bg2, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, maxHeight: '82%' },
  panelUstBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  panelBaslik: { fontSize: 17, fontWeight: '800', color: RENKLER.metin },
  panelKapat: { fontSize: 18, color: RENKLER.metinIkincil, padding: 4 },
  bolumBaslik: { fontSize: 12.5, fontWeight: '800', color: RENKLER.metinIkincil, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  chipSatiri: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, backgroundColor: RENKLER.bg3, borderWidth: 1, borderColor: RENKLER.ayrici },
  chipSecili: { backgroundColor: RENKLER.vurgu, borderColor: RENKLER.vurgu },
  chipMetin: { fontSize: 12.5, fontWeight: '700', color: RENKLER.metinIkincil },
  chipMetinSecili: { color: RENKLER.bg },
  aralikSatiri: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  aralikInput: {
    flex: 1, backgroundColor: RENKLER.bg3, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
    color: RENKLER.metin, borderWidth: 1, borderColor: RENKLER.ayrici, fontSize: 13,
  },
  aralikCizgi: { color: RENKLER.metinUcuncul },
  bilgiNotu: { fontSize: 11, color: RENKLER.metinUcuncul, marginTop: 18, fontStyle: 'italic', lineHeight: 16 },
  panelAltButonlar: { flexDirection: 'row', gap: 10, marginTop: 14 },
  sifirlaButon: { flex: 1, backgroundColor: RENKLER.bg3, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  sifirlaMetin: { color: RENKLER.metinIkincil, fontWeight: '700', fontSize: 14 },
  uygulaButon: { flex: 2, backgroundColor: RENKLER.vurgu, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  uygulaMetin: { color: RENKLER.bg, fontWeight: '800', fontSize: 14 },
  });
}
