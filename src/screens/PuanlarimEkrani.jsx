import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator, ScrollView, Share, Alert, ImageBackground } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePointsStore } from '../store/pointsStore';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';
import { useRenkler, useOrtakStil } from '../constants/theme';

function kalanSureHesapla(hedefIso) {
  if (!hedefIso) return null;
  const ms = new Date(hedefIso).getTime() - Date.now();
  if (ms <= 0) return null;
  const saat = Math.floor(ms / 3600000);
  const dakika = Math.floor((ms % 3600000) / 60000);
  const saniye = Math.floor((ms % 60000) / 1000);
  return { saat, dakika, saniye };
}

function ikiHane(n) {
  return String(n).padStart(2, '0');
}

/** Canlı, saniyede bir güncellenen geri sayım. */
function useCanliGeriSayim(hedefIso) {
  const [kalan, setKalan] = useState(() => kalanSureHesapla(hedefIso));

  useEffect(() => {
    setKalan(kalanSureHesapla(hedefIso));
    if (!hedefIso) return;
    const zamanlayici = setInterval(() => {
      setKalan(kalanSureHesapla(hedefIso));
    }, 1000);
    return () => clearInterval(zamanlayici);
  }, [hedefIso]);

  return kalan;
}

export default function PuanlarimEkrani() {
  const RENKLER = useRenkler();
  const ORTAK_STIL = useOrtakStil();
  const styles = olusturStyles(RENKLER);
  const insets = useSafeAreaInsets();
  const { user, refreshUser } = useAuthStore();
  const { balance, wheelStatus, loading, fetchBalance, fetchWheelStatus, spinWheel, redeem, error } = usePointsStore();
  const [kod, setKod] = useState('');
  const [kodMesaj, setKodMesaj] = useState(null);
  const [spinMesaj, setSpinMesaj] = useState(null);
  const [affiliate, setAffiliate] = useState(null);

  const kalanSure = useCanliGeriSayim(wheelStatus?.nextSpinAvailableAt);

  useEffect(() => {
    fetchBalance();
    fetchWheelStatus();
    api.affiliateMe().then(setAffiliate).catch(() => {});
  }, []);

  // Geri sayım tam bitince otomatik olarak "çevir" butonunu tekrar göster.
  useEffect(() => {
    if (!wheelStatus?.canSpin && wheelStatus?.nextSpinAvailableAt && !kalanSure) {
      fetchWheelStatus();
    }
  }, [kalanSure]);

  const cevir = async () => {
    setSpinMesaj(null);
    try {
      const result = await spinWheel();
      if (result.streak?.rewardGranted) {
        setSpinMesaj(`🎉 ${result.streak.targetDays} gün üst üste çevirdin! %${result.streak.discountPercent} indirimin hazır — bugün kullan.`);
      } else {
        setSpinMesaj(`${result.streak.streakDays}/${result.streak.targetDays} gün tamamlandı — yarın da unutma!`);
      }
      refreshUser();
    } catch (err) {
      setSpinMesaj(err.message);
    }
  };

  const kodGonder = async () => {
    if (!kod.trim()) return;
    setKodMesaj(null);
    try {
      const result = await redeem(kod.trim());
      setKodMesaj(`${result.pointsAwarded} puan eklendi!`);
      setKod('');
    } catch (err) {
      setKodMesaj(err.message);
    }
  };

  const paylas = async () => {
    if (!user?.referralCode) return;
    try {
      await Share.share({ message: `FutMod'a katıl, referans kodum: ${user.referralCode}` });
    } catch { /* ignore */ }
  };

  return (
    <View style={ORTAK_STIL.ekran}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingTop: insets.top + 16, paddingBottom: 40 }}>
      <Text style={styles.baslik}>Puanlarım 🏆</Text>

      <View style={[ORTAK_STIL.kart, { marginTop: 16, alignItems: 'center' }]}>
        <Text style={styles.bakiyeEtiket}>Toplam Puan</Text>
        <Text style={styles.bakiye}>{balance}</Text>
      </View>

      <ImageBackground
        source={require('../../assets/cark-gorseli.png')}
        style={[ORTAK_STIL.kart, styles.carkKart]}
        imageStyle={styles.carkGorsel}
      >
        <View style={styles.carkKarartma} />
        <Text style={styles.bolumBaslik}>Günlük Çark 🎡</Text>
        {wheelStatus?.vip ? <Text style={styles.vipNot}>⭐ VIP olarak 3 günde bir %5 indirim kazanırsın</Text> : null}

        {typeof wheelStatus?.streakDays === 'number' ? (
          <View style={{ marginTop: 10 }}>
            <View style={styles.streakBar}>
              <View style={[styles.streakDoluBar, { width: `${Math.min(100, (wheelStatus.streakDays / wheelStatus.streakTargetDays) * 100)}%` }]} />
            </View>
            <Text style={styles.streakMetin}>
              {wheelStatus.streakDays}/{wheelStatus.streakTargetDays} gün · art arda {wheelStatus.streakTargetDays} gün çevirirsen %5 indirim kazanırsın
            </Text>
          </View>
        ) : null}

        {user?.streakDiscountPercent ? (
          <View style={styles.streakOdulKutu}>
            <Text style={styles.streakOdulMetin}>🎁 %{user.streakDiscountPercent} indirimin hazır! Toruncoin'de bugün kullan.</Text>
          </View>
        ) : null}

        {wheelStatus?.lockedOut ? (
          <View style={[styles.devreDisiButon, { marginTop: 12 }]}>
            <Text style={styles.kilitMetin}>🔒 2 indirim çevrimini art arda tamamladın</Text>
            <Text style={styles.devreDisiMetin}>Çark bugün kilitli — yarın tekrar deneyebilirsin</Text>
          </View>
        ) : wheelStatus?.canSpin ? (
          <TouchableOpacity style={[ORTAK_STIL.buyukButon, { marginTop: 12 }]} onPress={cevir} disabled={loading}>
            {loading ? <ActivityIndicator color={RENKLER.bg} /> : <Text style={styles.buttonMetin}>Çarkı Çevir ve Kazan</Text>}
          </TouchableOpacity>
        ) : (
          <View style={[styles.devreDisiButon, { marginTop: 12 }]}>
            <Text style={styles.devreDisiMetin}>Bugünkü şansını kullandın</Text>
            {kalanSure ? (
              <Text style={styles.geriSayimMetin}>
                {ikiHane(kalanSure.saat)}:{ikiHane(kalanSure.dakika)}:{ikiHane(kalanSure.saniye)}
              </Text>
            ) : null}
          </View>
        )}
        {spinMesaj ? <Text style={styles.bilgiMesaj}>{spinMesaj}</Text> : null}
      </ImageBackground>

      <View style={[ORTAK_STIL.kart, { marginTop: 16 }]}>
        <Text style={styles.bolumBaslik}>Kodun mu var? 🎁</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
          <TextInput
            style={styles.kodInput}
            placeholder="ÖRN: WELCOME50"
            placeholderTextColor={RENKLER.metinUcuncul}
            autoCapitalize="characters"
            value={kod}
            onChangeText={setKod}
          />
          <TouchableOpacity style={styles.kodButon} onPress={kodGonder}>
            <Text style={styles.buttonMetin}>Kullan</Text>
          </TouchableOpacity>
        </View>
        {kodMesaj ? <Text style={styles.bilgiMesaj}>{kodMesaj}</Text> : null}
      </View>

      <View style={[ORTAK_STIL.kart, { marginTop: 16 }]}>
        <Text style={styles.bolumBaslik}>Arkadaşını Davet Et 🤝</Text>
        <Text style={styles.aciklama}>Referans kodun:</Text>
        <Text style={styles.referansKodu}>{user?.referralCode}</Text>
        {affiliate ? (
          <Text style={styles.aciklama}>{affiliate.referredCount} kişi senin sayende katıldı · her davet {affiliate.awardPerReferral} puan kazandırır</Text>
        ) : null}
        <TouchableOpacity style={[ORTAK_STIL.buyukButon, { marginTop: 12 }]} onPress={paylas}>
          <Text style={styles.buttonMetin}>Kodu Paylaş</Text>
        </TouchableOpacity>
      </View>
      </ScrollView>
    </View>
  );
}

function olusturStyles(RENKLER) {
  return StyleSheet.create({
  baslik: { fontSize: 24, fontWeight: '800', color: RENKLER.metin },
  bolumBaslik: { fontSize: 16, fontWeight: '700', color: RENKLER.metin },
  bakiyeEtiket: { fontSize: 13, color: RENKLER.metinIkincil },
  bakiye: { fontSize: 40, fontWeight: '800', color: RENKLER.vurgu, marginTop: 4 },
  buttonMetin: { color: RENKLER.bg, fontWeight: '700', fontSize: 15 },
  devreDisiButon: { backgroundColor: RENKLER.bg3, borderRadius: 12, padding: 14, alignItems: 'center' },
  devreDisiMetin: { color: RENKLER.metinIkincil, fontSize: 13, textAlign: 'center' },
  kilitMetin: { color: RENKLER.uyari, fontSize: 13, fontWeight: '700', textAlign: 'center', marginBottom: 4 },
  geriSayimMetin: { color: RENKLER.vurgu2, fontSize: 22, fontWeight: '800', marginTop: 6, fontVariant: ['tabular-nums'] },
  bilgiMesaj: { marginTop: 10, color: RENKLER.vurgu2, fontSize: 13 },
  kodInput: {
    flex: 1, backgroundColor: RENKLER.bg3, borderRadius: 10, paddingHorizontal: 14,
    color: RENKLER.metin, borderWidth: 1, borderColor: RENKLER.ayrici,
  },
  kodButon: { backgroundColor: RENKLER.vurgu, borderRadius: 10, paddingHorizontal: 18, justifyContent: 'center' },
  aciklama: { color: RENKLER.metinIkincil, fontSize: 13, marginTop: 8 },
  referansKodu: { color: RENKLER.metin, fontSize: 22, fontWeight: '800', letterSpacing: 2, marginTop: 4 },
  carkKart: { marginTop: 16, overflow: 'hidden' },
  carkGorsel: { opacity: 0.22, right: -40, top: -30 },
  carkKarartma: { ...StyleSheet.absoluteFillObject, backgroundColor: RENKLER.bg2, opacity: 0.55 },
  vipNot: { fontSize: 11.5, color: RENKLER.vurgu2, fontWeight: '700', marginTop: 4 },
  streakBar: { height: 6, borderRadius: 3, backgroundColor: RENKLER.bg3, overflow: 'hidden' },
  streakDoluBar: { height: 6, backgroundColor: RENKLER.vurgu2 },
  streakMetin: { fontSize: 11, color: RENKLER.metinIkincil, marginTop: 6 },
  streakOdulKutu: { marginTop: 10, backgroundColor: `${RENKLER.basari}22`, borderRadius: 10, padding: 10, borderWidth: 1, borderColor: RENKLER.basari },
  streakOdulMetin: { fontSize: 12.5, color: RENKLER.basari, fontWeight: '700', textAlign: 'center' },
  });
}
