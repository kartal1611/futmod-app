import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

// theme.js imports from this store, so the preset tables live here to avoid a circular import.
// Tema iki seçimden oluşur: mod (koyu/açık) ve vurgu rengi.

const ZEMINLER = {
  koyu: {
    bg: '#0c0d10', bg2: '#16181d', bg3: '#1f2229', ayrici: '#2b2f38',
    metin: '#f5f5f2', metinIkincil: '#a8adb8', metinUcuncul: '#767c88',
    hata: '#ff6b5c', basari: '#3DDC84',
    cizgi: '#ffffff', durumCubugu: 'light-content',
  },
  acik: {
    bg: '#f3f3f0', bg2: '#ffffff', bg3: '#e9e9e5', ayrici: '#d9dadf',
    metin: '#14151a', metinIkincil: '#4f5461', metinUcuncul: '#858a96',
    hata: '#d93a2b', basari: '#16a34a',
    cizgi: '#000000', durumCubugu: 'dark-content',
  },
};

// Her vurgunun koyu ve açık zemindeki tonu ile üstüne yazılan metin rengi.
export const VURGULAR = {
  altin: { ad: 'Altın', koyu: '#F4C24D', acik: '#B98410', ustuKoyu: '#111215', ustuAcik: '#ffffff' },
  mavi: { ad: 'Mavi', koyu: '#38BDF8', acik: '#0369A1', ustuKoyu: '#0b1620', ustuAcik: '#ffffff' },
  yesil: { ad: 'Yeşil', koyu: '#3DDC84', acik: '#15803D', ustuKoyu: '#0b1a10', ustuAcik: '#ffffff' },
  kirmizi: { ad: 'Kırmızı', koyu: '#FF5A5F', acik: '#C81E1E', ustuKoyu: '#ffffff', ustuAcik: '#ffffff' },
  mor: { ad: 'Mor', koyu: '#A78BFA', acik: '#6D28D9', ustuKoyu: '#130d24', ustuAcik: '#ffffff' },
};

export const MODLAR = { koyu: 'Koyu', acik: 'Açık' };
export const VARSAYILAN_MOD = 'koyu';
export const VARSAYILAN_VURGU = 'altin';

export function renklerOlustur(mod, vurgu) {
  const z = ZEMINLER[mod] || ZEMINLER[VARSAYILAN_MOD];
  const v = VURGULAR[vurgu] || VURGULAR[VARSAYILAN_VURGU];
  const acik = mod === 'acik';
  const renk = acik ? v.acik : v.koyu;
  return {
    ...z,
    mod: acik ? 'acik' : 'koyu',
    vurgu: renk,
    vurgu2: renk,
    uyari: renk,
    vurguUstu: acik ? v.ustuAcik : v.ustuKoyu,
  };
}

const MOD_KEY = 'futchat_mod';
const VURGU_KEY = 'futmod_tema'; // eski kayıt anahtarı: eski seçimler (altin/yesil/mavi/mor) aynen geçerli

export const useThemeStore = create((set, get) => ({
  mod: VARSAYILAN_MOD,
  vurgu: VARSAYILAN_VURGU,
  renkler: renklerOlustur(VARSAYILAN_MOD, VARSAYILAN_VURGU),

  init: async () => {
    try {
      const [m, v] = await Promise.all([SecureStore.getItemAsync(MOD_KEY), SecureStore.getItemAsync(VURGU_KEY)]);
      const mod = MODLAR[m] ? m : VARSAYILAN_MOD;
      const vurgu = VURGULAR[v] ? v : VARSAYILAN_VURGU;
      set({ mod, vurgu, renkler: renklerOlustur(mod, vurgu) });
    } catch { /* keep default */ }
  },

  modSec: async (mod) => {
    if (!MODLAR[mod]) return;
    set({ mod, renkler: renklerOlustur(mod, get().vurgu) });
    try { await SecureStore.setItemAsync(MOD_KEY, mod); } catch { /* best-effort persistence */ }
  },

  vurguSec: async (vurgu) => {
    if (!VURGULAR[vurgu]) return;
    set({ vurgu, renkler: renklerOlustur(get().mod, vurgu) });
    try { await SecureStore.setItemAsync(VURGU_KEY, vurgu); } catch { /* best-effort persistence */ }
  },
}));
