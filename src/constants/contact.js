export const TELEGRAM_USERNAME = 'haintorun';
export const TELEGRAM_URL = `https://t.me/${TELEGRAM_USERNAME}`;

export function telegramSatinAlLinki({ platformBaslik, coinAdi, indirimliFiyat, currency }) {
  let mesaj = `Merhaba, ${platformBaslik} platformundan ${coinAdi} almak istiyordum.`;
  if (indirimliFiyat != null) {
    mesaj += ` (İndirimli fiyat: ${indirimliFiyat.toLocaleString('tr-TR', { maximumFractionDigits: 2 })} ${currency})`;
  }
  return `${TELEGRAM_URL}?text=${encodeURIComponent(mesaj)}`;
}
