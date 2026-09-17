import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

// theme.js imports from this store, so the preset table itself has to live
// here (not in theme.js) to avoid a circular import.
const TEMEL = {
  bg: '#0a0b0a',
  bg2: '#121412',
  bg3: '#1b1e1b',
  metin: '#f3f7f3',
  metinIkincil: '#c3d6c9',
  metinUcuncul: '#82a08d',
  ayrici: '#1f3327',
  hata: '#ff6b5c',
};

// Neon Yeşil (the default theme) gets its own dark navy/indigo backgrounds
// instead of the neutral-gray TEMEL — matching the user's reference image
// (deep navy-purple base, not plain black) so the app reads as a colored
// "neon" theme at a glance, not a black-and-green app. A faint green tint
// alone (tried earlier) wasn't a strong enough departure from black to
// register — this is a real base-color change, not just a decorative
// overlay, so it can't end up invisible the way a top-layer glow effect
// can. The other theme presets keep TEMEL as-is.
const YESIL_ZEMIN = {
  bg: '#0a0a1f',
  bg2: '#13132f',
  bg3: '#1c1c42',
  ayrici: '#2a2a52',
};

export const TEMALAR = {
  yesil: { ad: 'Neon Yeşil', ornekRenk: '#39FF6E', renkler: { ...TEMEL, ...YESIL_ZEMIN, vurgu: '#39FF6E', vurgu2: '#ffcf5c', basari: '#3ecf8e', uyari: '#ffcf5c' } },
  mavi: { ad: 'Mavi', ornekRenk: '#38BDF8', renkler: { ...TEMEL, vurgu: '#38BDF8', vurgu2: '#ffcf5c', basari: '#3ecf8e', uyari: '#ffcf5c' } },
  altin: { ad: 'Altın', ornekRenk: '#F5B942', renkler: { ...TEMEL, vurgu: '#F5B942', vurgu2: '#6fe3ff', basari: '#3ecf8e', uyari: '#F5B942' } },
  mor: { ad: 'Mor', ornekRenk: '#A78BFA', renkler: { ...TEMEL, vurgu: '#A78BFA', vurgu2: '#ffcf5c', basari: '#3ecf8e', uyari: '#ffcf5c' } },
};

export const VARSAYILAN_TEMA = 'yesil';
const TEMA_KEY = 'futmod_tema';

export const useThemeStore = create((set) => ({
  temaAdi: VARSAYILAN_TEMA,
  renkler: TEMALAR[VARSAYILAN_TEMA].renkler,

  init: async () => {
    try {
      const kayitli = await SecureStore.getItemAsync(TEMA_KEY);
      const temaAdi = kayitli && TEMALAR[kayitli] ? kayitli : VARSAYILAN_TEMA;
      set({ temaAdi, renkler: TEMALAR[temaAdi].renkler });
    } catch { /* keep default */ }
  },

  temaSec: async (temaAdi) => {
    if (!TEMALAR[temaAdi]) return;
    set({ temaAdi, renkler: TEMALAR[temaAdi].renkler });
    try { await SecureStore.setItemAsync(TEMA_KEY, temaAdi); } catch { /* best-effort persistence */ }
  },
}));
