import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRenkler, FONT } from '../../constants/theme';
import { ForumIkonu, ContentIkonu, BildirimIkonu, ProfilIkonu } from './TabIkonlari';

// Yalnız bu rotalar çubukta görünür; diğerleri (index, sbc, evrimler, oyuncular) gizli.
const SEKMELER = {
  forum: { etiket: 'FORUM', Ikon: ForumIkonu },
  content: { etiket: 'İÇERİK', Ikon: ContentIkonu },
  bildirimler: { etiket: 'BİLDİRİM', Ikon: BildirimIkonu, rozetli: true },
  profil: { etiket: 'PROFİL', Ikon: ProfilIkonu },
};

/**
 * Torunbot tarzı alt çubuk: eğik kutular, aktif sekme dolu altın.
 * Eğim düz View + skewX ile; içerik ters eğimle düz tutulur. SVG ölçüm adımı yok,
 * ilk karede bile her şey görünür.
 */
export default function AltSekmeCubugu({ state, navigation, rozet = 0 }) {
  const RENKLER = useRenkler();
  const insets = useSafeAreaInsets();

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
        const Ikon = sekme.Ikon;
        return (
          <Pressable
            key={route.key}
            onPress={bas}
            style={[styles.oge, odakli
              ? { backgroundColor: RENKLER.vurgu, borderColor: RENKLER.vurgu }
              : { backgroundColor: RENKLER.bg2, borderColor: RENKLER.ayrici }]}
            accessibilityRole="button"
            accessibilityState={odakli ? { selected: true } : {}}
            accessibilityLabel={sekme.etiket}
          >
            <View style={styles.duz}>
              <View>
                <Ikon renk={renk} boyut={21} />
                {sekme.rozetli && rozet > 0 ? (
                  <View style={[styles.rozet, { backgroundColor: RENKLER.hata }]}>
                    <Text style={styles.rozetMetin}>{rozet > 99 ? '99+' : rozet}</Text>
                  </View>
                ) : null}
              </View>
              <Text numberOfLines={1} style={[styles.etiket, { color: renk }]}>{sekme.etiket}</Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  cubuk: { flexDirection: 'row', gap: 8, paddingHorizontal: 14, paddingTop: 10, borderTopWidth: 1 },
  oge: { flex: 1, height: 52, borderWidth: 1, borderRadius: 3, alignItems: 'center', justifyContent: 'center', transform: [{ skewX: '-10deg' }] },
  duz: { alignItems: 'center', transform: [{ skewX: '10deg' }] },
  etiket: { fontFamily: FONT.etiketItalik, fontSize: 12.5, letterSpacing: 1, marginTop: 1 },
  rozet: { position: 'absolute', top: -4, right: -10, minWidth: 16, height: 16, borderRadius: 8, paddingHorizontal: 3, alignItems: 'center', justifyContent: 'center' },
  rozetMetin: { color: '#fff', fontSize: 10, fontWeight: '800' },
});
