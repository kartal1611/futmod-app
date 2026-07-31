import { create } from 'zustand';
import { api } from '../services/api';

export const usePointsStore = create((set, get) => ({
  balance: 0,
  history: [],
  wheelStatus: null,
  loading: false,
  error: null,

  fetchBalance: async () => {
    try {
      const data = await api.pointsBalance();
      set({ balance: data.balance });
    } catch (err) {
      set({ error: err.message });
    }
  },

  fetchHistory: async () => {
    try {
      const data = await api.pointsHistory();
      set({ history: data.history });
    } catch (err) {
      set({ error: err.message });
    }
  },

  fetchWheelStatus: async () => {
    try {
      const data = await api.wheelStatus();
      set({ wheelStatus: data });
    } catch (err) {
      set({ error: err.message });
    }
  },

  spinWheel: async () => {
    set({ error: null, loading: true });
    try {
      const result = await api.wheelSpin();
      await get().fetchBalance();
      await get().fetchWheelStatus();
      set({ loading: false });
      return result;
    } catch (err) {
      set({ error: err.message, loading: false });
      await get().fetchWheelStatus();
      throw err;
    }
  },

  redeem: async (code) => {
    set({ error: null, loading: true });
    try {
      const result = await api.redeemCode(code);
      await get().fetchBalance();
      set({ loading: false });
      return result;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },
}));
