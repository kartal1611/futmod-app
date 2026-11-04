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
/** Yükleme yanıtını güvenle okur: sunucu (ör. nginx 413) JSON yerine HTML döndürürse "Unexpected character: <" yerine anlaşılır hata verir. */
async function yuklemeYaniti(res, varsayilanHata) {
  let data = null;
  try { data = await res.json(); } catch { /* JSON değil (HTML hata sayfası olabilir) */ }
  if (!res.ok) {
    const mesaj = data?.error || (res.status === 413 ? 'Görsel çok büyük (en fazla 15 MB).' : `${varsayilanHata} (sunucu yanıtı ${res.status})`);
    throw new Error(mesaj);
  }
  if (!data) throw new Error(`${varsayilanHata} (sunucu geçersiz yanıt verdi)`);
  return data;
}

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

  comments: (contentId) => apiFetch(`/comments/${contentId}`),
  addComment: (contentId, body) => apiFetch(`/comments/${contentId}`, { method: 'POST', body: { body } }),
  deleteComment: (commentId) => apiFetch(`/comments/${commentId}`, { method: 'DELETE' }),

  registerPushToken: (expoPushToken, platform) =>
    apiFetch('/push/register', { method: 'POST', body: { expoPushToken, platform } }),

  // Admin panel
  adminFindUser: (email) => apiFetch(`/admin/users/${encodeURIComponent(email)}`),
  adminSetNote: (email, note) => apiFetch(`/admin/users/${encodeURIComponent(email)}/note`, { method: 'PUT', body: { note } }),

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
    return yuklemeYaniti(res, 'Görsel yüklenemedi');
  },

  acceptTerms: () => apiFetch('/auth/accept-terms', { method: 'POST' }),
  deleteAccount: (password) => apiFetch('/auth/delete-account', { method: 'POST', body: { password } }),

  blockedUsers: () => apiFetch('/moderation/blocked'),
  blockUser: (userId, context = {}) => apiFetch('/moderation/block', { method: 'POST', body: { userId, ...context } }),
  unblockUser: (userId) => apiFetch(`/moderation/block/${userId}`, { method: 'DELETE' }),
  reportContent: (payload) => apiFetch('/moderation/report', { method: 'POST', body: payload }),

  adminListReports: (status = 'pending') => apiFetch(`/admin/reports?status=${status}`),
  adminResolveReport: (id, payload) => apiFetch(`/admin/reports/${id}/resolve`, { method: 'POST', body: payload }),

  forumThreads: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/forum/threads${qs ? `?${qs}` : ''}`);
  },
  forumThread: (id) => apiFetch(`/forum/threads/${id}`),
  forumCreateThread: (payload) => apiFetch('/forum/threads', { method: 'POST', body: payload }),
  forumDeleteThread: (id) => apiFetch(`/forum/threads/${id}`, { method: 'DELETE' }),
  forumVote: (id) => apiFetch(`/forum/threads/${id}/vote`, { method: 'POST' }),
  forumFollow: (id, following) => apiFetch(`/forum/threads/${id}/follow`, { method: 'PUT', body: { following } }),
  forumAddComment: (id, payload) => apiFetch(`/forum/threads/${id}/comments`, { method: 'POST', body: payload }),
  forumDeleteComment: (id) => apiFetch(`/forum/threads/comments/${id}`, { method: 'DELETE' }),

  adminSendNotification: (payload) => apiFetch('/admin/notifications/send', { method: 'POST', body: payload }),
  adminSyncFutgg: () => apiFetch('/admin/sync-futgg', { method: 'POST' }),
};
