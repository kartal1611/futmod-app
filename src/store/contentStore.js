import { create } from 'zustand';
import { api } from '../services/api';

export const useContentStore = create((set) => ({
  items: [],
  loading: false,
  error: null,

  fetchFeed: async (type = null) => {
    set({ loading: true, error: null });
    try {
      // The API defaults to 30 most-recent items; SBC Merkezi needs every
      // active SBC (currently ~54), so ask for a limit well above that.
      const data = await api.content({ limit: 100, ...(type ? { type } : {}) });
      set({ items: data.items, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },
}));
