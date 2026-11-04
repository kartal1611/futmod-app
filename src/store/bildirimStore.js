import { create } from 'zustand';
import { api } from '../services/api';

// Unread forum notifications, shown as the badge on the Bildirim tab.
export const useBildirimStore = create((set) => ({
  okunmamis: 0,

  ayarla: (okunmamis) => set({ okunmamis }),

  yenile: async () => {
    try {
      const data = await api.forumUnreadCount();
      set({ okunmamis: data.unread });
    } catch { /* rozet en iyi çaba — sonraki yenilemede düzelir */ }
  },
}));
