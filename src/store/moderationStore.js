import { create } from 'zustand';
import { api } from '../services/api';

// Blocked-user list: filters feeds (Forum, Kadro Yorumlama, SBC yorumları)
// client-side "instantly" per Apple Guideline 1.2 — block itself is recorded
// server-side too, so it also survives reinstall/other devices.
export const useModerationStore = create((set, get) => ({
  blockedIds: [],
  loaded: false,

  load: async () => {
    try {
      const data = await api.blockedUsers();
      set({ blockedIds: data.blockedUserIds || [], loaded: true });
    } catch {
      set({ loaded: true });
    }
  },

  reset: () => set({ blockedIds: [], loaded: false }),

  block: async (userId, context = {}) => {
    await api.blockUser(userId, context);
    set((s) => ({ blockedIds: [...new Set([...s.blockedIds, userId])] }));
  },

  unblock: async (userId) => {
    await api.unblockUser(userId);
    set((s) => ({ blockedIds: s.blockedIds.filter((id) => id !== userId) }));
  },

  isBlocked: (userId) => get().blockedIds.includes(userId),
}));
