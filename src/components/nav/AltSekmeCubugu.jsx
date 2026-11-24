import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRenkler, FONT } from '../../constants/theme';
import { ForumIkonu, ContentIkonu, BildirimIkonu, ProfilIkonu } from './TabIkonlari';

// Yalnız bu rotalar çubukta görünür; diğerleri (index, sbc, evrimler, oyuncular) gizli.
const SEKMELER = {
  forum: { etiket: 'Forum', Ikon: ForumIkonu },
  content: { etiket: 'İçerik', Ikon: ContentIkonu },
  bildirimler: { etiket: 'Bildirim', Ikon: BildirimIkonu, rozetli: true },
  profil: { etiket: 'Profil', Ikon: ProfilIkonu },
};
const EGIM = 9;

/** Torunbot tarzı alt çubuk: eğik kutular, aktif sekme dolu altın. */
export default function AltSekmeCubugu({ state, navigation, rozet = 0 }) {
  const RENKLER = useRenkler();
  const insets = useSafeAreaInsets();
  const [genislik, setGenislik] = useState(0);
  const yukseklik = 52;

  return (
    <View style={[styles.cubuk, { backgroundColor: RENKLER.bg, borderTopColor: RENKLER.ayrici, paddingBottom: Math.max(insets.bottom, 10) }]}>
      {state.routes.map((route, index) => {
        const sekme = SEKMELER[route.name];
        if (!sekme) return null;
        const odakli = state.index === index;
        const renk = odakli ? RENKLER.bg : RENKLER.metinUcuncul;
        const bas = () => {
          const olay = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!odakli && !olay.defaultPrevented) navigation.navigate(route.name, route.params);
        };
        const w = genislik;
        return (
          <Pressable
            key={route.key}
            onPress={bas}
            onLayout={(e) => { if (!genislik) setGenislik(e.nativeEvent.layout.width); }}
            style={styles.oge}
            accessibilityRole="button"
            accessibilityState={odakli ? { selected: true } : {}}
            accessibilityLabel={sekme.etiket}
          >
            {w ? (
              <Svg width={w} height={yukseklik} style={StyleSheet.absoluteFill}>
                <Path
                  d={`M${EGIM + 0.5} 0.5H${w - 0.5}L${w - EGIM - 0.5} ${yukseklik - 0.5}H0.5Z`}
                  fill={odakli ? RENKLER.vurgu : RENKLER.bg2}
                  stroke={odakli ? RENKLER.vurgu : RENKLER.ayrici}
                />
              </Svg>
            ) : null}
            <View>
              <sekme.Ikon renk={renk} boyut={21} />
              {sekme.rozetli && rozet > 0 ? (
                <View style={[styles.rozet, { backgroundColor: RENKLER.hata }]}>
                  <Text style={styles.rozetMetin}>{rozet > 99 ? '99+' : rozet}</Text>
                </View>
              ) : null}
            </View>
            <Text numberOfLines={1} style={[styles.etiket, { color: renk }]}>{sekme.etiket.toLocaleUpperCase('tr-TR')}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  cubuk: { flexDirection: 'row', gap: 6, paddingHorizontal: 10, paddingTop: 10, borderTopWidth: 1 },
  oge: { flex: 1, height: 52, alignItems: 'center', justifyContent: 'center' },
  etiket: { fontFamily: FONT.etiketItalik, fontSize: 12.5, letterSpacing: 1, marginTop: 1 },
  rozet: { position: 'absolute', top: -4, right: -10, minWidth: 16, height: 16, borderRadius: 8, paddingHorizontal: 3, alignItems: 'center', justifyContent: 'center' },
  rozetMetin: { color: '#fff', fontSize: 10, fontWeight: '800' },
});
