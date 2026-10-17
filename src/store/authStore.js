import { create } from 'zustand';
import { api } from '../services/api';
import { getTokens, setTokens, clearTokens, getPanelMode, setPanelMode } from '../services/api';
import { useModerationStore } from './moderationStore';

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
      const [data, panelMode] = await Promise.all([
        Promise.race([api.me(), timeout]),
        getPanelMode(),
      ]);
      set({ user: data.user, panelMode, loading: false });
      useModerationStore.getState().load();
    } catch {
      set({ user: null, loading: false });
    }
  },

  register: async ({ email, password, displayName, referralCode, termsAccepted }) => {
    set({ error: null });
    try {
      const data = await api.register({ email, password, displayName, referralCode, termsAccepted });
      await setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
      await setPanelMode('member');
      set({ user: data.user, panelMode: 'member' });
      useModerationStore.getState().load();
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
      await setPanelMode('member');
      set({ user: data.user, panelMode: 'member' });
      useModerationStore.getState().load();
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
      await setPanelMode('admin');
      set({ user: data.user, panelMode: 'admin' });
      return true;
    } catch (err) {
      set({ error: err.message });
      return false;
    }
  },

  logout: async () => {
    await clearTokens();
    await setPanelMode('member');
    set({ user: null, panelMode: 'member' });
    useModerationStore.getState().reset();
  },

  deleteAccount: async (password) => {
    await api.deleteAccount(password);
    await clearTokens();
    await setPanelMode('member');
    set({ user: null, panelMode: 'member' });
    useModerationStore.getState().reset();
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
