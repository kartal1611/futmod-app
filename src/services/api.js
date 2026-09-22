import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

// Local dev default. Override by setting EXPO_PUBLIC_API_URL when starting
// Expo (e.g. `EXPO_PUBLIC_API_URL=http://192.168.1.5:4000/api npx expo start --tunnel`)
// so a physical device on the same network / tunnel can reach the API server.
const DEFAULT_BASE_URL = 'http://localhost:4000/api';

export function getBaseUrl() {
  return (
    process.env.EXPO_PUBLIC_API_URL ||
    Constants.expoConfig?.extra?.apiUrl ||
    DEFAULT_BASE_URL
  );
}

/** Server root (no /api suffix) — for resolving relative upload paths like /uploads/trade/x.jpg. */
export function getServerRootUrl() {
  return getBaseUrl().replace(/\/api\/?$/, '');
}

const ACCESS_KEY = 'futmod_access_token';
const REFRESH_KEY = 'futmod_refresh_token';

export async function getTokens() {
  const [accessToken, refreshToken] = await Promise.all([
    SecureStore.getItemAsync(ACCESS_KEY),
    SecureStore.getItemAsync(REFRESH_KEY),
  ]);
  return { accessToken, refreshToken };
}

export async function setTokens({ accessToken, refreshToken }) {
  await Promise.all([
    accessToken ? SecureStore.setItemAsync(ACCESS_KEY, accessToken) : SecureStore.deleteItemAsync(ACCESS_KEY),
    refreshToken ? SecureStore.setItemAsync(REFRESH_KEY, refreshToken) : SecureStore.deleteItemAsync(REFRESH_KEY),
  ]);
}

export async function clearTokens() {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_KEY),
    SecureStore.deleteItemAsync(REFRESH_KEY),
  ]);
}

const PANEL_MODE_KEY = 'futmod_panel_mode';

/** Persists whether the stored session is a member or admin-panel login, so reopening the app restores the right screen. */
export async function setPanelMode(mode) {
  await SecureStore.setItemAsync(PANEL_MODE_KEY, mode);
}

export async function getPanelMode() {
  return (await SecureStore.getItemAsync(PANEL_MODE_KEY)) || 'member';
}

let refreshing = null;

async function tryRefresh() {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    const { refreshToken } = await getTokens();
    if (!refreshToken) return null;
    const res = await fetch(`${getBaseUrl()}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    await setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
    return data.accessToken;
  })();
  try {
    return await refreshing;
  } finally {
    refreshing = null;
  }
}

/**
 * Fetch wrapper: attaches JWT, retries once on 401 after a token refresh.
 */
export async function apiFetch(path, { method = 'GET', body, auth = true, retry = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const { accessToken } = await getTokens();
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  }

  const res = await fetch(`${getBaseUrl()}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && auth && retry) {
    const newToken = await tryRefresh();
    if (newToken) {
      return apiFetch(path, { method, body, auth, retry: false });
    }
  }

  let data = null;
  try { data = await res.json(); } catch { /* no body */ }

  if (!res.ok) {
    const error = new Error(data?.error || `İstek başarısız (${res.status})`);
    error.status = res.status;
    error.data = data;
    throw error;
  }
  return data;
}

export const api = {
  register: (payload) => apiFetch('/auth/register', { method: 'POST', body: payload, auth: false }),
  login: (payload) => apiFetch('/auth/login', { method: 'POST', body: payload, auth: false }),
  adminLogin: (payload) => apiFetch('/auth/admin-login', { method: 'POST', body: payload, auth: false }),
  me: () => apiFetch('/auth/me'),

  trade: () => apiFetch('/trade'),
  tradeItem: (id) => apiFetch(`/trade/${id}`),

  notificationPreferences: () => apiFetch('/notification-preferences'),
  updateNotificationPreferences: (prefs) => apiFetch('/notification-preferences', { method: 'PUT', body: prefs }),

  content: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/content${qs ? `?${qs}` : ''}`);
  },
  contentItem: (id) => apiFetch(`/content/${id}`),
  contentCounts: () => apiFetch('/content/counts'),
  contentNewToday: () => apiFetch('/content/new-today'),
  playerCounts: () => apiFetch('/players/counts'),

  players: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/players${qs ? `?${qs}` : ''}`);
  },
  playerItem: (futggId, src) => apiFetch(`/players/${futggId}${src ? `?src=${encodeURIComponent(src)}` : ''}`),
  playerFilterOptions: () => apiFetch('/players/filter-options'),
  playerVersions: (futggId) => apiFetch(`/players/${futggId}/versions`),
  playerTrend: (limit = 8) => apiFetch(`/players/trend?limit=${limit}`),
  playerPriceWatch: (futggId) => apiFetch(`/players/${futggId}/price-watch`),
  playerPriceWatchAdd: (futggId) => apiFetch(`/players/${futggId}/price-watch`, { method: 'POST' }),
  playerPriceWatchRemove: (futggId) => apiFetch(`/players/${futggId}/price-watch`, { method: 'DELETE' }),

  coins: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/coin${qs ? `?${qs}` : ''}`);
  },
  coinItem: (id) => apiFetch(`/coin/${id}`),
  validateCoinDiscount: (code) => apiFetch('/coin/discount/validate', { method: 'POST', body: { code } }),

  pointsBalance: () => apiFetch('/points'),
  pointsHistory: () => apiFetch('/points/history'),

  wheelStatus: () => apiFetch('/wheel/status'),
  wheelSpin: () => apiFetch('/wheel/spin', { method: 'POST' }),

  redeemCode: (code) => apiFetch('/redeem', { method: 'POST', body: { code } }),

  affiliateMe: () => apiFetch('/affiliate/me'),

  comments: (contentId) => apiFetch(`/comments/${contentId}`),
  addComment: (contentId, body) => apiFetch(`/comments/${contentId}`, { method: 'POST', body: { body } }),
  deleteComment: (commentId) => apiFetch(`/comments/${commentId}`, { method: 'DELETE' }),

  registerPushToken: (expoPushToken, platform) =>
    apiFetch('/push/register', { method: 'POST', body: { expoPushToken, platform } }),

  // Admin panel
  adminFindUser: (email) => apiFetch(`/admin/users/${encodeURIComponent(email)}`),
  adminSetNote: (email, note) => apiFetch(`/admin/users/${encodeURIComponent(email)}/note`, { method: 'PUT', body: { note } }),
  adminSetVip: (payload) => apiFetch('/admin/vip', { method: 'POST', body: payload }),
  adminRemoveVip: (email) => apiFetch(`/admin/vip/${encodeURIComponent(email)}`, { method: 'DELETE' }),
  adminListVip: () => apiFetch('/admin/vip'),
  adminListTrade: () => apiFetch('/admin/trade'),
  adminCreateTrade: (payload) => apiFetch('/admin/trade', { method: 'POST', body: payload }),
  adminUpdateTrade: (id, payload) => apiFetch(`/admin/trade/${id}`, { method: 'PUT', body: payload }),
  adminDeleteTrade: (id) => apiFetch(`/admin/trade/${id}`, { method: 'DELETE' }),

  kadroPosts: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/squad${qs ? `?${qs}` : ''}`);
  },
  kadroPostItem: (id) => apiFetch(`/squad/${id}`),
  kadroCreatePost: (payload) => apiFetch('/squad', { method: 'POST', body: payload }),
  kadroDeletePost: (id) => apiFetch(`/squad/${id}`, { method: 'DELETE' }),
  kadroAddComment: (id, body) => apiFetch(`/squad/${id}/comments`, { method: 'POST', body: { body } }),
  kadroDeleteComment: (id) => apiFetch(`/squad/comments/${id}`, { method: 'DELETE' }),
  kadroUploadImage: async (fileUri, fileName) => {
    const { accessToken } = await getTokens();
    const form = new FormData();
    // RN'in Yeni Mimarisi (Fabric/bridgeless — bu proje RN 0.86, zorunlu) eski
    // `{ uri, name, type }` nesne şeklini FormData parçası olarak tanımıyor ve
    // "Unsupported FormDataPart implementation" hatasıyla patlıyor. Dosyayı
    // önce gerçek bir Blob'a çevirip onu eklemek gerekiyor.
    const blob = await (await fetch(fileUri)).blob();
    form.append('image', blob, fileName || 'kadro.jpg');
    const res = await fetch(`${getBaseUrl()}/squad/upload-image`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: form,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || 'Görsel yüklenemedi');
    return data;
  },

  forumMessages: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/forum${qs ? `?${qs}` : ''}`);
  },
  forumSend: (body) => apiFetch('/forum', { method: 'POST', body: { body } }),
  forumDelete: (id) => apiFetch(`/forum/${id}`, { method: 'DELETE' }),

  services: () => apiFetch('/services'),
  adminListServices: () => apiFetch('/admin/services'),
  adminCreateService: (payload) => apiFetch('/admin/services', { method: 'POST', body: payload }),
  adminUpdateService: (id, payload) => apiFetch(`/admin/services/${id}`, { method: 'PUT', body: payload }),
  adminDeleteService: (id) => apiFetch(`/admin/services/${id}`, { method: 'DELETE' }),

  adminListPayments: (status) => apiFetch(`/admin/payments${status ? `?status=${status}` : ''}`),
  adminCreatePayment: (payload) => apiFetch('/admin/payments', { method: 'POST', body: payload }),
  adminMarkPaymentPaid: (id, payload) => apiFetch(`/admin/payments/${id}/mark-paid`, { method: 'POST', body: payload }),
  adminMarkPaymentFailed: (id) => apiFetch(`/admin/payments/${id}/mark-failed`, { method: 'POST' }),
  adminUploadTradeImage: async (fileUri, fileName) => {
    const { accessToken } = await getTokens();
    const form = new FormData();
    // Aynı Yeni Mimari FormData sorunu (bkz. kadroUploadImage) — Blob'a çevir.
    const blob = await (await fetch(fileUri)).blob();
    form.append('image', blob, fileName || 'trade.jpg');
    const res = await fetch(`${getBaseUrl()}/admin/trade/upload-image`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: form,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || 'Görsel yüklenemedi');
    return data;
  },
  adminSendNotification: (payload) => apiFetch('/admin/notifications/send', { method: 'POST', body: payload }),
  adminCreateRedeemCode: (payload) => apiFetch('/admin/redeem-codes', { method: 'POST', body: payload }),
  adminCreateCoinDiscount: (payload) => apiFetch('/admin/coin-discount-codes', { method: 'POST', body: payload }),
  adminSyncFutgg: () => apiFetch('/admin/sync-futgg', { method: 'POST' }),
  adminSyncToruncoin: () => apiFetch('/admin/sync-toruncoin', { method: 'POST' }),
};
