import { StyleSheet } from 'react-native';
import { useThemeStore, renklerOlustur, VURGULAR, MODLAR, VARSAYILAN_MOD, VARSAYILAN_VURGU } from '../store/themeStore';

export { VURGULAR, MODLAR };

/** Barlow Condensed: Torunbot tarzı dar, italik, kalın başlıklar. _layout.jsx yükler. */
export const FONT = {
  dev: 'BarlowCondensed_900Black_Italic',
  baslik: 'BarlowCondensed_800ExtraBold_Italic',
  etiket: 'BarlowCondensed_700Bold',
  etiketItalik: 'BarlowCondensed_700Bold_Italic',
};

/** Static fallback — only for code paths that run before the theme store hydrates. */
export const RENKLER = renklerOlustur(VARSAYILAN_MOD, VARSAYILAN_VURGU);

/** Reactive hook: re-renders the component when the user changes theme. */
export function useRenkler() {
  return useThemeStore((s) => s.renkler);
}

export function olusturOrtakStil(RENKLER) {
  return StyleSheet.create({
    // Şeffaf: RootLayout artık NeonParilti'yi TEK bir global katman olarak
    // Tabs navigator'ının arkasına (dışına) koyuyor — her ekranın kendi kökü
    // bunu örtmesin diye buradaki eski opak arkaplan kaldırıldı. Tabs
    // dışında (Login/AdminLogin gibi) render edilen ekranlar kendi opak
    // arkaplanlarını ayrıca inline olarak belirtiyor.
    ekran: { flex: 1, backgroundColor: 'transparent' },
    kart: {
      backgroundColor: RENKLER.bg2,
      borderRadius: 4,
      padding: 16,
      borderWidth: 1,
      borderColor: RENKLER.ayrici,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.25,
      shadowRadius: 6,
      elevation: 3,
    },
    buyukButon: {
      backgroundColor: RENKLER.vurgu,
      borderRadius: 4,
      paddingVertical: 16,
      transform: [{ skewX: '-8deg' }],
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: RENKLER.vurgu,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 8,
      elevation: 4,
    },
  });
}

export function useOrtakStil() {
  const RENKLER = useRenkler();
  return olusturOrtakStil(RENKLER);
}

/** Static fallback matching the default theme — for any leftover static usage. */
export const ORTAK_STIL = olusturOrtakStil(RENKLER);
