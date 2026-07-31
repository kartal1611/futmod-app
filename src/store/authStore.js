import { create } from 'zustand';
import { api } from '../services/api';
import { getTokens, setTokens, clearTokens } from '../services/api';

export const useAuthStore = create((set, get) => ({
  user: null,
  loading: true,
  error: null,
  // 'member' = normal Tabs UI, 'admin' = admin panel UI (set only via adminLogin).
  panelMode: 'member',

  init: async () => {
    set({ loading: true });
    try {
      const { accessToken } = await getTokens();
      if (!accessToken) {
        set({ user: null, loading: false });
        return;
      }
      // Slow/unstable tunnel connections must not hang the app on launch —
      // fall back to "not logged in" and let the user retry via login.
      const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000));
      const data = await Promise.race([api.me(), timeout]);
      set({ user: data.user, loading: false });
    } catch {
      set({ user: null, loading: false });
    }
  },

  register: async ({ email, password, displayName, referralCode }) => {
    set({ error: null });
    try {
      const data = await api.register({ email, password, displayName, referralCode });
      await setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
      set({ user: data.user, panelMode: 'member' });
      return true;
    } catch (err) {
      set({ error: err.message });
      return false;
    }
  },

  login: async ({ email, password }) => {
    set({ error: null });
    try {
      const data = await api.login({ email, password });
      await setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
      set({ user: data.user, panelMode: 'member' });
      return true;
    } catch (err) {
      set({ error: err.message });
      return false;
    }
  },

  adminLogin: async ({ email, password }) => {
    set({ error: null });
    try {
      const data = await api.adminLogin({ email, password });
      await setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
      set({ user: data.user, panelMode: 'admin' });
      return true;
    } catch (err) {
      set({ error: err.message });
      return false;
    }
  },

  logout: async () => {
    await clearTokens();
    set({ user: null, panelMode: 'member' });
  },

  // Re-fetches the user so VIP/streak discount fields reflect a just-earned
  // reward (e.g. right after a wheel spin) without needing to log out/in.
  refreshUser: async () => {
    try {
      const data = await api.me();
      set({ user: data.user });
    } catch { /* ignore — next natural refresh will catch up */ }
  },
}));
