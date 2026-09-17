import { useEffect, useState } from 'react';
import { View, Text, Image, Pressable, ActivityIndicator, TextInput, Linking, ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../services/api';
import { telegramSatinAlLinki } from '../constants/contact';
import { useAuthStore } from '../store/authStore';
import { useRenkler, useOrtakStil } from '../constants/theme';
import NeonParilti from '../components/NeonParilti';

const PLATFORM_BASLIK = { pc: 'PC', 'ps-xbox': 'PS-Xbox' };

export default function ToruncoinUrunDetayEkrani() {
  const RENKLER = useRenkler();
  const ORTAK_STIL = useOrtakStil();
  const styles = olusturStyles(RENKLER);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { id } = useLocalSearchParams();
  const [urun, setUrun] = useState(null);
  const [loading, setLoading] = useState(true);
  const [kod, setKod] = useState('');
  const [kodDurumu, setKodDurumu] = useState(null); // { percentOff } | { error }
  const [kodKontrolEdiliyor, setKodKontrolEdiliyor] = useState(false);

  useEffect(() => {
    api.coinItem(id).then((data) => setUrun(data.coin)).finally(() => setLoading(false));
  }, [id]);

  const kodDogrula = async () => {
    if (!kod.trim()) return;
    setKodKontrolEdiliyor(true);
    setKodDurumu(null);
    try {
      const data = await api.validateCoinDiscount(kod.trim());
      setKodDurumu({ percentOff: data.percentOff });
    } catch (err) {
      setKodDurumu({ error: err.message || 'Geçersiz kod' });
    } finally {
      setKodKontrolEdiliyor(false);
    }
  };

  if (loading || !urun) {
    return (
      <View style={[ORTAK_STIL.ekran, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={RENKLER.vurgu} />
      </View>
    );
  }

  const vipYuzdesi = user?.isVip ? (user.vipDiscountPercent || 0) : 0;
  const streakYuzdesi = user?.streakDiscountPercent || 0;
  const kodYuzdesi = kodDurumu?.percentOff || 0;
  const indirimYuzdesi = Math.max(kodYuzdesi, vipYuzdesi, streakYuzdesi);
  const indirimKaynagi = indirimYuzdesi === kodYuzdesi && kodYuzdesi > 0 ? 'kod'
    : indirimYuzdesi === streakYuzdesi && streakYuzdesi > 0 ? 'streak'
    : 'vip';
  const indirimliFiyat = indirimYuzdesi ? urun.price * (1 - indirimYuzdesi / 100) : urun.price;
  const platformBaslik = PLATFORM_BASLIK[urun.platform] || urun.platform;

  const satinAl = () => {
    const link = telegramSatinAlLinki({
      platformBaslik,
      coinAdi: urun.coinName,
      indirimliFiyat: indirimYuzdesi ? indirimliFiyat : null,
      currency: urun.currency,
    });
    Linking.openURL(link);
  };

  return (
    <View style={ORTAK_STIL.ekran}>
      <NeonParilti />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={[styles.ustBar, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={styles.geriOk}>‹</Text>
        </Pressable>
        <Text style={styles.baslik} numberOfLines={1}>{urun.coinName}</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={{ padding: 16 }}>
        {urun.imageUrl ? (
          <Image source={{ uri: urun.imageUrl }} style={styles.gorsel} resizeMode="cover" />
        ) : null}

        <View style={styles.fiyatKutusu}>
          {indirimYuzdesi > 0 ? (
            <>
              <Text style={styles.eskiFiyat}>{urun.price.toLocaleString('tr-TR')} {urun.currency}</Text>
              <Text style={styles.fiyat}>{indirimliFiyat.toLocaleString('tr-TR', { maximumFractionDigits: 2 })} {urun.currency}</Text>
              <Text style={styles.indirimEtiket}>
                %{indirimYuzdesi} indirim uygulandı{indirimKaynagi === 'vip' ? ' (VIP)' : indirimKaynagi === 'streak' ? ' (7 gün ödülü)' : ''}
              </Text>
            </>
          ) : (
            <Text style={styles.fiyat}>{urun.price.toLocaleString('tr-TR')} {urun.currency}</Text>
          )}
        </View>

        <View style={[ORTAK_STIL.kart, { marginTop: 16 }]}>
          <Text style={styles.bolumBaslik}>İndirim Kodun mu var? 🎁</Text>
          {vipYuzdesi > 0 ? (
            <Text style={styles.vipNot}>VIP olarak %{vipYuzdesi} indirimin zaten uygulanıyor. Daha yüksek bir kodun varsa onu da deneyebilirsin.</Text>
          ) : streakYuzdesi > 0 ? (
            <Text style={styles.vipNot}>7 gün ödülünle %{streakYuzdesi} indirimin zaten uygulanıyor — bugün kullanmalısın!</Text>
          ) : null}
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
            <TextInput
              style={styles.kodInput}
              placeholder="Kodu gir"
              placeholderTextColor={RENKLER.metinUcuncul}
              autoCapitalize="characters"
              value={kod}
              onChangeText={setKod}
            />
            <Pressable onPress={kodDogrula} disabled={kodKontrolEdiliyor || !kod.trim()} style={[styles.kodButon, (!kod.trim() || kodKontrolEdiliyor) && { opacity: 0.5 }]}>
              {kodKontrolEdiliyor ? <ActivityIndicator size="small" color={RENKLER.bg} /> : <Text style={styles.kodButonMetin}>Uygula</Text>}
            </Pressable>
          </View>
          {kodDurumu?.error ? <Text style={styles.kodHata}>{kodDurumu.error}</Text> : null}
        </View>

        <Pressable style={[ORTAK_STIL.buyukButon, { marginTop: 20 }]} onPress={satinAl}>
          <Text style={styles.satinAlMetin}>Almak İçin Tıkla ↗</Text>
        </Pressable>
        <Text style={styles.telegramNot}>Telegram üzerinden ekibimizle bağlantıya geçersin, ödeme ve teslimat orada yapılır.</Text>
      </View>
      </ScrollView>
    </View>
  );
}

function olusturStyles(RENKLER) {
  return StyleSheet.create({
  ustBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 24, paddingBottom: 12,
  },
  geriOk: { fontSize: 28, color: RENKLER.metin, fontWeight: '300', width: 24 },
  baslik: { fontSize: 18, fontWeight: '800', color: RENKLER.metin, flex: 1, textAlign: 'center' },
  gorsel: { width: '100%', height: 160, borderRadius: 16, backgroundColor: RENKLER.bg3 },
  fiyatKutusu: { alignItems: 'center', marginTop: 20 },
  eskiFiyat: { fontSize: 15, color: RENKLER.metinUcuncul, textDecorationLine: 'line-through' },
  fiyat: { fontSize: 34, fontWeight: '900', color: RENKLER.uyari, marginTop: 2 },
  indirimEtiket: { fontSize: 12, color: RENKLER.basari, fontWeight: '700', marginTop: 4 },
  bolumBaslik: { fontSize: 15, fontWeight: '700', color: RENKLER.metin },
  kodInput: {
    flex: 1, backgroundColor: RENKLER.bg3, borderRadius: 10, paddingHorizontal: 14,
    color: RENKLER.metin, borderWidth: 1, borderColor: RENKLER.ayrici,
  },
  kodButon: { backgroundColor: RENKLER.vurgu, borderRadius: 10, paddingHorizontal: 18, justifyContent: 'center' },
  kodButonMetin: { color: RENKLER.bg, fontWeight: '800', fontSize: 13 },
  kodHata: { color: RENKLER.hata, fontSize: 12.5, marginTop: 8 },
  vipNot: { color: RENKLER.vurgu2, fontSize: 12, marginTop: 8 },
  satinAlMetin: { color: RENKLER.bg, fontWeight: '800', fontSize: 16 },
  telegramNot: { fontSize: 11.5, color: RENKLER.metinUcuncul, textAlign: 'center', marginTop: 10, paddingHorizontal: 8 },
  });
}
