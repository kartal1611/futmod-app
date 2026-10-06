import { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, ScrollView, Linking, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useRenkler, useOrtakStil } from '../constants/theme';

const KURALLAR_URL = 'https://fc26.efendiler.net/torunfc/kurallar.html';

// Apple Guideline 1.2: mevcut hesaplar (bu ekran eklenmeden önce kayıt
// olmuş kullanıcılar) uygulamayı kullanmaya devam etmeden önce güncel
// Kullanım Şartları'nı bir kez kabul etmek zorunda — yeni kayıtlarda aynı
// onay LoginEkrani'ndaki zorunlu kutucukla alınıyor.
export default function KurallarOnayEkrani() {
  const RENKLER = useRenkler();
  const ORTAK_STIL = useOrtakStil();
  const styles = olusturStyles(RENKLER);
  const insets = useSafeAreaInsets();
  const refreshUser = useAuthStore((s) => s.refreshUser);
  const logout = useAuthStore((s) => s.logout);
  const [gonderiliyor, setGonderiliyor] = useState(false);

  const kabulEt = async () => {
    setGonderiliyor(true);
    try {
      await api.acceptTerms();
      await refreshUser();
    } catch {
      setGonderiliyor(false);
    }
  };

  return (
    <View style={[ORTAK_STIL.ekran, { paddingTop: insets.top + 24, paddingHorizontal: 20 }]}>
      <Text style={styles.baslik}>Kullanım Şartları güncellendi</Text>
      <Text style={styles.aciklama}>
        Devam etmeden önce güncellenen Kullanım Şartları ve Topluluk Kurallarımızı kabul etmen gerekiyor.
        Özetle: taciz, nefret söylemi, uygunsuz içerik ve kötüye kullanıma sıfır toleransımız var; kuralları
        ihlal eden hesaplar askıya alınır.
      </Text>
      <ScrollView style={styles.kutu}>
        <Text style={styles.link} onPress={() => Linking.openURL(KURALLAR_URL)}>
          Kullanım Şartları ve Topluluk Kurallarını oku →
        </Text>
      </ScrollView>
      <Pressable style={ORTAK_STIL.buyukButon} onPress={kabulEt} disabled={gonderiliyor}>
        {gonderiliyor ? <ActivityIndicator color={RENKLER.bg} /> : <Text style={styles.butonMetin}>Okudum, Kabul Ediyorum</Text>}
      </Pressable>
      <Pressable onPress={logout} style={{ marginTop: 16 }}>
        <Text style={styles.cikis}>Kabul etmek istemiyorum, çıkış yap</Text>
      </Pressable>
    </View>
  );
}

function olusturStyles(RENKLER) {
  return StyleSheet.create({
    baslik: { fontSize: 20, fontWeight: '800', color: RENKLER.metin, marginBottom: 10 },
    aciklama: { fontSize: 14, color: RENKLER.metinIkincil, lineHeight: 20, marginBottom: 16 },
    kutu: { maxHeight: 60, marginBottom: 20 },
    link: { color: RENKLER.vurgu2, fontSize: 14, fontWeight: '700' },
    butonMetin: { color: RENKLER.bg, fontWeight: '800', fontSize: 15 },
    cikis: { color: RENKLER.metinUcuncul, fontSize: 12.5, textAlign: 'center', textDecorationLine: 'underline' },
  });
}
