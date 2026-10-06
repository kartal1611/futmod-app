// Apple Guideline 1.2: her kullanıcı üretimi içerikte (forum mesajı, kadro
// yorumu, SBC yorumu) uzun-basınca çıkan "Şikayet Et" / "Kullanıcıyı
// Engelle" menüsü. Tek yerden yönetilir, tüm ekranlarda aynı davranış.
import { Alert } from 'react-native';
import { api } from '../../services/api';
import { useModerationStore } from '../../store/moderationStore';

const SEBEPLER = ['Spam / alakasız içerik', 'Taciz / hakaret', 'Uygunsuz içerik', 'Diğer'];

function sikayetEt({ contentType, contentId, hedefUserId }) {
  Alert.alert('Şikayet sebebi', 'Bu içeriği neden şikayet ediyorsun?', [
    ...SEBEPLER.map((sebep) => ({
      text: sebep,
      onPress: async () => {
        try {
          await api.reportContent({ contentType, contentId, contentOwnerUserId: hedefUserId, reason: sebep });
          Alert.alert('Teşekkürler', 'Şikayetin ekibimize iletildi, 24 saat içinde incelenecek.');
        } catch (err) {
          Alert.alert('Hata', err.message || 'Şikayet gönderilemedi');
        }
      },
    })),
    { text: 'Vazgeç', style: 'cancel' },
  ]);
}

function kullaniciyiEngelle({ hedefUserId, hedefAd, contentType, contentId, afterBlock }) {
  Alert.alert(
    'Kullanıcıyı Engelle',
    `${hedefAd || 'Bu kullanıcıyı'} engellemek istediğine emin misin? İçerikleri akışından kaldırılır ve ekibimize bildirilir.`,
    [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Engelle',
        style: 'destructive',
        onPress: async () => {
          try {
            await useModerationStore.getState().block(hedefUserId, { contentType, contentId });
            afterBlock?.();
          } catch (err) {
            Alert.alert('Hata', err.message || 'Engellenemedi');
          }
        },
      },
    ],
  );
}

/** hedefUserId === kendi kullanıcın ise menü açılmaz (kendini şikayet/engelleme). */
export function icerikMenusuAc({ hedefUserId, hedefAd, contentType, contentId, benimUserId, afterBlock }) {
  if (!hedefUserId || hedefUserId === benimUserId) return;
  Alert.alert(hedefAd || 'Kullanıcı', 'Ne yapmak istersin?', [
    { text: 'Vazgeç', style: 'cancel' },
    { text: 'Şikayet Et', onPress: () => sikayetEt({ contentType, contentId, hedefUserId }) },
    { text: 'Kullanıcıyı Engelle', style: 'destructive', onPress: () => kullaniciyiEngelle({ hedefUserId, hedefAd, contentType, contentId, afterBlock }) },
  ]);
}
