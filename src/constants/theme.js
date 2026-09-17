import { StyleSheet } from 'react-native';
import { useThemeStore, TEMALAR, VARSAYILAN_TEMA } from '../store/themeStore';

export { TEMALAR, VARSAYILAN_TEMA };

/** Static fallback — only for code paths that run before the theme store hydrates. */
export const RENKLER = TEMALAR[VARSAYILAN_TEMA].renkler;

/** Reactive hook: re-renders the component when the user changes theme. */
export function useRenkler() {
  return useThemeStore((s) => s.renkler);
}

export function olusturOrtakStil(RENKLER) {
  return StyleSheet.create({
    ekran: { flex: 1, backgroundColor: RENKLER.bg },
    kart: {
      backgroundColor: RENKLER.bg2,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: RENKLER.ayrici,
      borderLeftWidth: 3,
      borderLeftColor: RENKLER.vurgu,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.25,
      shadowRadius: 6,
      elevation: 3,
    },
    buyukButon: {
      backgroundColor: RENKLER.vurgu,
      borderRadius: 14,
      paddingVertical: 16,
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
