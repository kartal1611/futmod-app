import { create } from 'zustand';
import { api } from '../services/api';

// Keyed by type ('sbc' | 'evolution' | 'all') so screens that stay mounted
// at the same time (Ana Sayfa + SBC + Evrimler are all persistent bottom
// tabs, kept alive by the tab navigator instead of unmounting) don't race
// to overwrite a single shared `items` array with each other's results.
const anahtar = (type) => type || 'all';

// Stable reference: returning a fresh `[]` literal from the selector below
// would make useSyncExternalStore think the snapshot changes on every call
// (before the fetch resolves), causing an infinite render loop.
const BOS_LISTE = [];

export const useContentStore = create((set) => ({
  itemsByType: {},
  loading: false,
  error: null,

  fetchFeed: async (type = null) => {
    const key = anahtar(type);
    set({ loading: true, error: null });
    try {
      // The API defaults to 30 most-recent items; SBC Merkezi needs every
      // active SBC (currently ~77), so ask for a limit well above that.
      const data = await api.content({ limit: 200, ...(type ? { type } : {}) });
      set((state) => ({ itemsByType: { ...state.itemsByType, [key]: data.items }, loading: false }));
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },
}));

/** Convenience: read the current items for a given type (or 'all'), defaulting to []. */
export function useContentItems(type = null) {
  return useContentStore((s) => s.itemsByType[anahtar(type)] || BOS_LISTE);
}
