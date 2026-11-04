import { Alert } from 'react-native';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { icerikMenusuAc } from '../components/moderation/moderasyonYardimci';

/** Vote, save and report/block actions shared by every list that shows thread cards. */
export function useBaslikIslemleri(setBasliklar) {
  const { user } = useAuthStore();

  const guncelle = (item) => setBasliklar((prev) => prev.map((b) => (b.id === item.id ? item : b)));

  const oyla = async (baslik) => {
    try {
      guncelle((await api.forumVote(baslik.id)).item);
    } catch (err) {
      Alert.alert('Hata', err.message || 'Oy verilemedi');
    }
  };

  const kaydet = async (baslik) => {
    try {
      guncelle((await api.forumSave(baslik.id, !baslik.saved)).item);
    } catch (err) {
      Alert.alert('Hata', err.message || 'Kaydedilemedi');
    }
  };

  const menuAc = (baslik) => {
    icerikMenusuAc({
      hedefUserId: baslik.userId,
      hedefAd: baslik.authorName,
      contentType: 'forum_thread',
      contentId: baslik.id,
      benimUserId: user?.id,
      afterBlock: () => setBasliklar((prev) => prev.filter((b) => b.userId !== baslik.userId)),
    });
  };

  return { oyla, kaydet, menuAc, benimId: user?.id };
}
