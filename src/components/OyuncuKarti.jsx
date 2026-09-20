import { useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

// fut.gg composites its player card client-side via CSS: a rarity/tier
// frame image filling the whole card, with the bare face cutout absolutely
// positioned on top (64.32687% width, 17.4% from top, horizontally centered
// at 56% — converted here to a plain `left` offset of 56% minus half that
// width, since RN transforms don't support percentage translateX).
const KART_ORAN = 0.71527778; // card width / height
const YUZ_GENISLIK_YUZDE = 64.32687;
const YUZ_TOP_YUZDE = 17.4;
const YUZ_LEFT_YUZDE = 56 - YUZ_GENISLIK_YUZDE / 2;

const STAT_SIRASI = [
  ['pace', 'PAC'], ['shooting', 'SHO'], ['passing', 'PAS'],
  ['dribbling', 'DRI'], ['defending', 'DEF'], ['physicality', 'PHY'],
];

// easysbc'nin hazır kartı (…/playercards/small/<id>.png) orijinalde 644px /
// ~640KB; sunucu `?width=N` ile yeniden boyutlandırıyor (160px ≈ 60KB). Liste
// küçük resimlerinde 40'ar kart yüklendiği için, ekranda çizilen genişliğin
// ~3 katı (retina) kadar iste — gereksiz büyük dosya indirilmesin. fut.gg
// URL'lerinin genişliği zaten yolunda gömülü, onlara dokunma.
function boyutluUrl(url, genislik) {
  // Kendi sunucumuzun çizdiği kart (…/cards/<id>.png) ya da easysbc'nin hazır kartı.
  if (!url || !(url.includes('/cards/') || (url.includes('assets.easysbc.io') && url.includes('/playercards/')))) return url;
  if (url.includes('game-assets.fut.gg')) return url;
  const w = Math.min(516, Math.max(120, Math.ceil((genislik * 3) / 40) * 40));
  return `${url}${url.includes('?') ? '&' : '?'}width=${w}`;
}

const KOYU = '#1a1400';
const KOYU_SOLUK = '#4a3f10';

/**
 * Renders a player's full card image. Prefers the pre-flattened list-scrape
 * render (`duzGorselUrl` — frame baked in already); when that's not yet
 * available (e.g. a brand-new SBC reward player seeded before the next
 * daily list sync reaches them), composites the detail page's own bare face
 * cutout (`yuzUrl`) over its rarity frame (`cerceveUrl`) to reproduce the
 * same look instead of showing a frameless face crop.
 *
 * Text/icon overlay order (top to bottom, matching easysbc's own card
 * layout): rating+position top-left, skill-move/weak-foot stars top-right,
 * name, PAC/SHO/PAS/DRI/DEF/PHY row, then a small nation/league icon row
 * right at the bottom point — each block given generous vertical clearance
 * from its neighbors (a cramped gap was rendering the tiny nation flag
 * overlapping the stat row in an earlier version).
 */
export default function OyuncuKarti({
  duzGorselUrl, yuzUrl, cerceveUrl, rating, pozisyon, attrs,
  isim, nationIconUrl, leagueIconUrl, weakFoot, skillMoves, genislik, style,
}) {
  // Hazır kart görseli yüklenemezse (ör. henüz render edilmemiş çok yeni bir
  // kart) sessizce boş kalmak yerine aşağıdaki yüz+çerçeve birleştirmesine düş.
  const [duzHata, setDuzHata] = useState(false);
  if (duzGorselUrl && !duzHata) {
    return (
      <Image
        source={{ uri: boyutluUrl(duzGorselUrl, genislik) }}
        style={[{ width: genislik, aspectRatio: KART_ORAN }, style]}
        resizeMode="contain"
        onError={() => setDuzHata(true)}
      />
    );
  }
  if (yuzUrl && cerceveUrl) {
    const olcek = genislik / 168; // font/spacing tuned at genislik=168, scaled for smaller thumbnail/share-card uses
    return (
      <View style={[{ width: genislik, aspectRatio: KART_ORAN }, style]}>
        <Image source={{ uri: cerceveUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        <Image
          source={{ uri: yuzUrl }}
          style={{
            position: 'absolute',
            top: `${YUZ_TOP_YUZDE}%`,
            left: `${YUZ_LEFT_YUZDE}%`,
            width: `${YUZ_GENISLIK_YUZDE}%`,
            aspectRatio: 1,
          }}
          resizeMode="contain"
        />

        {rating != null ? (
          <View style={{ position: 'absolute', top: '16%', left: '19%', alignItems: 'center' }}>
            <Text style={{ fontSize: 16 * olcek, fontWeight: '900', color: KOYU, lineHeight: 16 * olcek }}>{rating}</Text>
            {pozisyon ? <Text style={{ fontSize: 8.5 * olcek, fontWeight: '800', color: KOYU, lineHeight: 9 * olcek }}>{pozisyon}</Text> : null}
          </View>
        ) : null}

        {(skillMoves || weakFoot) ? (
          <View style={{ position: 'absolute', top: '19%', right: '10%', alignItems: 'flex-end' }}>
            {skillMoves ? <Text style={{ fontSize: 7.5 * olcek, fontWeight: '800', color: KOYU, lineHeight: 9 * olcek }}>{skillMoves}★</Text> : null}
            {weakFoot ? <Text style={{ fontSize: 7.5 * olcek, fontWeight: '800', color: KOYU, lineHeight: 9 * olcek }}>{weakFoot}★</Text> : null}
          </View>
        ) : null}

        {isim ? (
          <View style={{ position: 'absolute', top: '61%', left: '8%', right: '8%' }}>
            <Text numberOfLines={1} style={{ fontSize: 9 * olcek, fontWeight: '900', color: KOYU, textAlign: 'center' }}>{isim}</Text>
          </View>
        ) : null}

        {attrs ? (
          <View style={{ position: 'absolute', top: '68%', left: '10%', right: '10%', flexDirection: 'row', justifyContent: 'space-between' }}>
            {STAT_SIRASI.map(([anahtar, kisa]) => (
              <View key={anahtar} style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 8.5 * olcek, fontWeight: '900', color: KOYU, lineHeight: 9 * olcek }}>{attrs[anahtar]?.value ?? '-'}</Text>
                <Text style={{ fontSize: 5.5 * olcek, fontWeight: '700', color: KOYU_SOLUK, lineHeight: 7 * olcek }}>{kisa}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {(nationIconUrl || leagueIconUrl) ? (
          <View style={{ position: 'absolute', top: '80%', left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 * olcek }}>
            {nationIconUrl ? <Image source={{ uri: nationIconUrl }} style={{ width: 16 * olcek, height: 11 * olcek }} resizeMode="contain" /> : null}
            {leagueIconUrl ? <Image source={{ uri: leagueIconUrl }} style={{ width: 11 * olcek, height: 11 * olcek }} resizeMode="contain" /> : null}
          </View>
        ) : null}
      </View>
    );
  }
  if (yuzUrl) {
    return <Image source={{ uri: yuzUrl }} style={[{ width: genislik, aspectRatio: 1 }, style]} resizeMode="contain" />;
  }
  // Hiçbir kaynak yoksa (çok eski/hayalet kayıt — easysbc'de artık 404): koyu
  // arkaplanda tamamen kaybolan boş/siyah bir alan yerine görünür bir kutu.
  return (
    <View style={[{ width: genislik, aspectRatio: KART_ORAN, borderRadius: 10, borderWidth: 1.5, borderColor: '#ffffff22', backgroundColor: '#ffffff0d', alignItems: 'center', justifyContent: 'center' }, style]}>
      <Text style={{ fontSize: 22 * (genislik / 168) }}>⚽</Text>
    </View>
  );
}
