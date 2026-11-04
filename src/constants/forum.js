import { getServerRootUrl } from '../services/api';

export const FORUM_KATEGORILERI = [
  { key: 'genel', label: 'Genel' },
  { key: 'kadro', label: 'Kadro' },
  { key: 'sbc-evo', label: 'SBC & Evrim' },
  { key: 'oyuncu', label: 'Oyuncu' },
  { key: 'taktik', label: 'Taktik' },
  { key: 'market', label: 'Market' },
  { key: 'leak', label: 'Leak' },
  { key: 'yardim', label: 'Yardım' },
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
