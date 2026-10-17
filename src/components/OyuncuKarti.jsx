import { View, Text, Image, StyleSheet } from 'react-native';
import { useRenkler } from '../constants/theme';

// FutMod'un kendi kart tasarımı: dairesel foto + rating rozeti üstte, isim/
// pozisyon altında, 6 stat yatay çubuk olarak. EA'nın Ultimate Team kart
// şablonuyla (kesik köşeli madalyon, yüz kartın tamamını kaplayan, 2x3 stat
// grid) hiçbir ortak geometrisi yok — Apple'ın Guideline 5.2.1 reddine konu
// olan "FIFA'ya benzeyen içerik" buydu, bu yüzden görsel şablon FutMod'a
// özgü, bağımsız bir tasarımla değiştirildi (veri kaynağı aynı kalıyor).
// Rozet/çubuk rengi kullanıcının seçtiği tema vurgu rengini takip eder.
const KART_ORAN = 0.71527778; // grid/liste yerleşimleri bu oranla hizalı, değiştirmedik

const STAT_SIRASI = [
  ['pace', 'PAC'], ['shooting', 'SHO'], ['passing', 'PAS'],
  ['dribbling', 'DRI'], ['defending', 'DEF'], ['physicality', 'PHY'],
];

/**
 * Oyuncu kartını render eder. `genislik` küçükse (liste thumbnail'leri)
 * stat çubukları sığmadığından yalnızca foto+rating+isim gösterilir.
 */
export default function OyuncuKarti({
  yuzUrl, rating, pozisyon, attrs, isim, nationIconUrl, leagueIconUrl,
  weakFoot, skillMoves, genislik, style,
}) {
  const RENKLER = useRenkler();
  const olcek = genislik / 168;
  const detayli = genislik >= 100 && !!attrs;

  return (
    <View style={[{
      backgroundColor: RENKLER.bg2, borderRadius: 12, borderWidth: 1, borderColor: RENKLER.ayrici,
      width: genislik, aspectRatio: KART_ORAN, padding: 8 * olcek,
    }, style]}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{
          width: 32 * olcek, height: 32 * olcek, borderRadius: 16 * olcek, backgroundColor: RENKLER.bg3,
          overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
        }}>
          {yuzUrl ? (
            <Image source={{ uri: yuzUrl }} style={{ width: '100%', height: '100%', borderRadius: 16 * olcek }} resizeMode="cover" />
          ) : (
            <Text style={{ fontSize: 15 * olcek }}>⚽</Text>
          )}
        </View>
        {rating != null ? (
          <View style={{ backgroundColor: RENKLER.vurgu, marginLeft: 6 * olcek, paddingHorizontal: 6 * olcek, paddingVertical: 2 * olcek, borderRadius: 6 * olcek }}>
            <Text style={{ color: RENKLER.bg, fontWeight: '900', fontSize: 13 * olcek, lineHeight: 15 * olcek }}>{rating}</Text>
          </View>
        ) : null}
        <View style={{ flex: 1 }} />
        {(skillMoves || weakFoot) ? (
          <Text style={{ fontSize: 7 * olcek, color: RENKLER.metinUcuncul, fontWeight: '700' }}>
            {skillMoves ? `${skillMoves}★` : ''}{weakFoot ? ` ${weakFoot}★` : ''}
          </Text>
        ) : null}
      </View>

      {isim ? (
        <Text numberOfLines={1} style={{ marginTop: 5 * olcek, fontSize: 10 * olcek, fontWeight: '800', color: RENKLER.metin }}>{isim}</Text>
      ) : null}
      {pozisyon ? (
        <Text numberOfLines={1} style={{ fontSize: 7.5 * olcek, color: RENKLER.metinUcuncul, fontWeight: '600' }}>{pozisyon}</Text>
      ) : null}

      {detayli ? (
        <View style={{ marginTop: 6 * olcek, flex: 1, justifyContent: 'space-evenly' }}>
          {STAT_SIRASI.map(([anahtar, kisa]) => {
            const deger = attrs[anahtar]?.value ?? 0;
            return (
              <View key={anahtar} style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ width: 20 * olcek, fontSize: 6.5 * olcek, fontWeight: '800', color: RENKLER.metinUcuncul }}>{kisa}</Text>
                <View style={{ flex: 1, height: 3 * olcek, borderRadius: 2, backgroundColor: RENKLER.bg3, marginHorizontal: 4 * olcek, overflow: 'hidden' }}>
                  <View style={{ width: `${Math.max(0, Math.min(100, deger))}%`, height: '100%', backgroundColor: RENKLER.vurgu }} />
                </View>
                <Text style={{ width: 16 * olcek, fontSize: 6.5 * olcek, fontWeight: '800', color: RENKLER.metin, textAlign: 'right' }}>{deger}</Text>
              </View>
            );
          })}
        </View>
      ) : null}

      {(nationIconUrl || leagueIconUrl) ? (
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5 * olcek, marginTop: detayli ? 4 * olcek : 'auto' }}>
          {nationIconUrl ? <Image source={{ uri: nationIconUrl }} style={{ width: 12 * olcek, height: 8 * olcek }} resizeMode="contain" /> : null}
          {leagueIconUrl ? <Image source={{ uri: leagueIconUrl }} style={{ width: 8 * olcek, height: 8 * olcek }} resizeMode="contain" /> : null}
        </View>
      ) : null}
    </View>
  );
}
