import { getServerRootUrl } from '../services/api';

export const FORUM_KATEGORILERI = [
  { key: 'genel', label: 'Genel', emoji: '💬' },
  { key: 'kadro', label: 'Kadro', emoji: '🧩' },
  { key: 'sbc-evo', label: 'SBC & Evrim', emoji: '🛡️' },
  { key: 'market', label: 'Trade', emoji: '📈' },
  { key: 'oyuncu', label: 'Oyuncu', emoji: '⚽' },
  { key: 'taktik', label: 'Taktik', emoji: '🧠' },
  { key: 'leak', label: 'Leak', emoji: '👀' },
  { key: 'yardim', label: 'Yardım', emoji: '❓' },
];

export function kategoriAdi(key) {
  return FORUM_KATEGORILERI.find((k) => k.key === key)?.label || key;
}

export function tamGorselUrl(url) {
  if (!url) return null;
  return url.startsWith('http') ? url : `${getServerRootUrl()}${url}`;
}

export function zamanFormatla(iso) {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso.replace(' ', 'T') + 'Z').getTime();
  const dk = Math.floor(ms / 60000);
  if (dk < 1) return 'az önce';
  if (dk < 60) return `${dk} dk önce`;
  const saat = Math.floor(dk / 60);
  if (saat < 24) return `${saat} sa önce`;
  return `${Math.floor(saat / 24)} gün önce`;
}
