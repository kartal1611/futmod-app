import { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Pressable, ScrollView, StyleSheet, Switch, Alert, Platform, ActivityIndicator, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { DESTEK_EPOSTA } from '../constants/contact';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { api, setTokens } from '../services/api';
import { useRenkler, useOrtakStil, VURGULAR, MODLAR, FONT } from '../constants/theme';

const KATEGORILER = [
  { key: 'forum', label: 'Forum Bildirimi', aciklama: 'Takip ettiğin başlıklara yanıt gelince haber ver' },
  { key: 'haberler', label: 'Duyuru Bildirimi', aciklama: 'Yönetimden gelen genel duyurular' },
];

const KURALLAR_URL = 'https://fc26.efendiler.net/torunfc/kurallar.html';
const GIZLILIK_URL = 'https://fc26.efendiler.net/torunfc/gizlilik.html';

export default function ProfilEkrani() {
  const RENKLER = useRenkler();
  const ORTAK_STIL = useOrtakStil();
  const styles = olusturStyles(RENKLER);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout, deleteAccount, refreshUser, panelDegistir } = useAuthStore();
  const [yeniAd, setYeniAd] = useState(user?.displayName || '');
  const [adHata, setAdHata] = useState(null);
  const [adKaydediliyor, setAdKaydediliyor] = useState(false);
  const { mod, vurgu, modSec, vurguSec } = useThemeStore();
  const [bildirimAcik, setBildirimAcik] = useState(false);
  const [islemde, setIslemde] = useState(false);
  const [tercihler, setTercihler] = useState(null);
  const [sifreAcik, setSifreAcik] = useState(false);
  const [sifreForm, setSifreForm] = useState({ mevcut: '', yeni: '', tekrar: '' });
  const [sifreHata, setSifreHata] = useState(null);
  const [sifreKaydediliyor, setSifreKaydediliyor] = useState(false);
  const [silmeAcik, setSilmeAcik] = useState(false);
  const [silmeSifre, setSilmeSifre] = useState('');
  const [silmeYukleniyor, setSilmeYukleniyor] = useState(false);
  const [silmeHata, setSilmeHata] = useState(null);

  useEffect(() => {
    api.notificationPreferences().then((data) => setTercihler(data.preferences)).catch(() => {});
    // The switch must reflect reality on every app open — if the OS already
    // granted permission (from a previous session), show it as ON instead
    // of resetting to a fresh, unrelated local default. Re-registering the
    // token here too keeps the backend copy fresh in case it ever rotates.
    Notifications.getPermissionsAsync().then(async ({ status }) => {
      if (status !== 'granted') return;
      setBildirimAcik(true);
      try {
        const tokenResp = await Notifications.getExpoPushTokenAsync();
        await api.registerPushToken(tokenResp.data, Platform.OS);
      } catch { /* best-effort refresh, ignore failures */ }
    });
  }, []);

  const bildirimAyarla = async (value) => {
    if (!value) { setBildirimAcik(false); return; }
    setIslemde(true);
    try {
      const { status: mevcut } = await Notifications.getPermissionsAsync();
      let status = mevcut;
      if (status !== 'granted') {
        const req = await Notifications.requestPermissionsAsync();
        status = req.status;
      }
      if (status !== 'granted') {
        Alert.alert('İzin gerekli', 'Bildirim gönderebilmemiz için izin vermelisin.');
        setIslemde(false);
        return;
      }
      const tokenResp = await Notifications.getExpoPushTokenAsync();
      await api.registerPushToken(tokenResp.data, Platform.OS);
      setBildirimAcik(true);
    } catch (err) {
      Alert.alert('Hata', err.message || 'Bildirim izni ayarlanamadı (fiziksel cihaz/Expo Go gerekebilir).');
    } finally {
      setIslemde(false);
    }
  };

  const adKaydet = async () => {
    setAdKaydediliyor(true);
    setAdHata(null);
    try {
      await api.updateDisplayName(yeniAd.trim());
      await refreshUser();
    } catch (err) {
      setAdHata(err.message || 'Kullanıcı adı değiştirilemedi');
    } finally {
      setAdKaydediliyor(false);
    }
  };

  const hesabiSilOnayla = () => {
    if (!silmeSifre) {
      setSilmeHata('Şifreni gir');
      return;
    }
    Alert.alert(
      'Hesabı sil',
      'Hesabın ve kişisel bilgilerin kalıcı olarak silinecek. Bu işlem geri alınamaz. Emin misin?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Hesabımı Sil',
          style: 'destructive',
          onPress: async () => {
            setSilmeYukleniyor(true);
            setSilmeHata(null);
            try {
              await deleteAccount(silmeSifre);
            } catch (err) {
              setSilmeHata(err.message || 'Hesap silinemedi');
              setSilmeYukleniyor(false);
            }
          },
        },
      ],
    );
  };

  const kategoriDegistir = async (key, value) => {
    setTercihler((onceki) => ({ ...onceki, [key]: value }));
    try {
      await api.updateNotificationPreferences({ [key]: value });
    } catch {
      setTercihler((onceki) => ({ ...onceki, [key]: !value }));
    }
  };

  const sifreDegistir = async () => {
    setSifreHata(null);
    if (sifreForm.yeni !== sifreForm.tekrar) { setSifreHata('Yeni şifreler aynı değil'); return; }
    setSifreKaydediliyor(true);
    try {
      const data = await api.changePassword(sifreForm.mevcut, sifreForm.yeni);
      // Diğer cihazlardaki oturumlar kapandı; bu cihaz yeni token'larla açık kalır.
      await setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
      setSifreAcik(false);
      setSifreForm({ mevcut: '', yeni: '', tekrar: '' });
      Alert.alert('Şifre değişti', 'Yeni şifren kaydedildi. Diğer cihazlardaki oturumların kapatıldı.');
    } catch (err) {
      setSifreHata(err.message || 'Şifre değiştirilemedi');
    } finally {
      setSifreKaydediliyor(false);
    }
  };

  return (
    <View style={ORTAK_STIL.ekran}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingTop: insets.top + 16, paddingBottom: 40 }}>
      <Text style={styles.baslik}>PROFİL</Text>

      <View style={[ORTAK_STIL.kart, { marginTop: 16 }]}>
        <Text style={styles.etiket}>E-posta</Text>
        <Text style={styles.deger}>{user?.email}</Text>
        <Text style={[styles.etiket, { marginTop: 12 }]}>Kullanıcı adı (forumda görünür)</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
          <TextInput
            value={yeniAd}
            onChangeText={(v) => { setYeniAd(v); setAdHata(null); }}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={20}
            style={[styles.silmeInput, { flex: 1, marginTop: 0 }]}
            accessibilityLabel="Kullanıcı adı"
          />
          {yeniAd.trim() !== (user?.displayName || '') ? (
            <TouchableOpacity style={[styles.silmeButon, { backgroundColor: RENKLER.vurgu, paddingHorizontal: 16 }]} onPress={adKaydet} disabled={adKaydediliyor}>
              {adKaydediliyor ? <ActivityIndicator color={RENKLER.vurguUstu} /> : <Text style={[styles.cikisMetin, { color: RENKLER.vurguUstu }]}>Kaydet</Text>}
            </TouchableOpacity>
          ) : null}
        </View>
        {adHata ? <Text style={styles.silmeHataMetin}>{adHata}</Text> : null}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
          {user?.isAdmin ? <Text style={styles.adminRozet}>Yönetici</Text> : null}
          {user?.isModerator && !user?.isAdmin ? <Text style={styles.adminRozet}>Moderatör</Text> : null}
        </View>
      </View>

      <View style={[ORTAK_STIL.kart, { marginTop: 16, paddingVertical: 4 }]}>
        {[
          { etiket: 'Profilim ve başlıklarım', onPress: () => router.push(`/forum/kullanici/${user?.id}`) },
          { etiket: 'Kaydedilenler', onPress: () => router.push('/forum/kaydedilenler') },
          { etiket: 'Engellenenler', onPress: () => router.push('/forum/engellenenler') },
          { etiket: 'Destek (E-posta)', onPress: () => Linking.openURL(`mailto:${DESTEK_EPOSTA}?subject=${encodeURIComponent('FutMod Destek')}`) },
          { etiket: 'Kullanım Şartları', onPress: () => Linking.openURL(KURALLAR_URL) },
          { etiket: 'Gizlilik Politikası', onPress: () => Linking.openURL(GIZLILIK_URL) },
        ].map((m) => (
          <Pressable key={m.etiket} onPress={m.onPress} style={styles.menuSatiri}>
            <Text style={styles.menuMetin}>{m.etiket}</Text>
            <Text style={styles.menuOk}>›</Text>
          </Pressable>
        ))}
      </View>

      <View style={[ORTAK_STIL.kart, { marginTop: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.bolumBaslik}>PUSH BİLDİRİMLERİ</Text>
          <Text style={styles.aciklama}>Bildirim almak için aç</Text>
        </View>
        <Switch value={bildirimAcik} onValueChange={bildirimAyarla} disabled={islemde} />
      </View>

      {tercihler ? (
        <View style={[ORTAK_STIL.kart, { marginTop: 16 }]}>
          <Text style={styles.bolumBaslik}>BİLDİRİM TÜRLERİ</Text>
          {KATEGORILER.map((k) => (
            <View key={k.key} style={styles.kategoriSatiri}>
              <View style={{ flex: 1 }}>
                <Text style={styles.kategoriBaslik}>{k.label}</Text>
                <Text style={styles.aciklama}>{k.aciklama}</Text>
              </View>
              <Switch value={!!tercihler[k.key]} onValueChange={(v) => kategoriDegistir(k.key, v)} />
            </View>
          ))}
        </View>
      ) : null}

      <View style={[ORTAK_STIL.kart, { marginTop: 16 }]}>
        <Text style={styles.bolumBaslik}>TEMA</Text>
        <Text style={styles.aciklama}>Görünüm</Text>
        <View style={styles.modSatiri}>
          {Object.entries(MODLAR).map(([key, ad]) => (
            <Pressable
              key={key}
              onPress={() => modSec(key)}
              style={[styles.modButon, mod === key && { backgroundColor: RENKLER.vurgu, borderColor: RENKLER.vurgu }]}
              accessibilityRole="button"
              accessibilityState={{ selected: mod === key }}
            >
              <Text style={[styles.modMetin, mod === key && { color: RENKLER.vurguUstu }]}>{key === 'koyu' ? '🌙' : '☀️'} {ad.toLocaleUpperCase('tr-TR')} MOD</Text>
            </Pressable>
          ))}
        </View>
        <Text style={[styles.aciklama, { marginTop: 14 }]}>Vurgu rengi</Text>
        <View style={styles.temaSatiri}>
          {Object.entries(VURGULAR).map(([key, t]) => (
            <Pressable key={key} onPress={() => vurguSec(key)} style={styles.temaSecenek} accessibilityRole="button" accessibilityLabel={t.ad}>
              <View style={[
                styles.temaDaire,
                { backgroundColor: mod === 'acik' ? t.acik : t.koyu },
                vurgu === key && styles.temaDaireSecili,
              ]}>
                {vurgu === key ? <Text style={[styles.temaTik, { color: mod === 'acik' ? t.ustuAcik : t.ustuKoyu }]}>✓</Text> : null}
              </View>
              <Text style={[styles.temaAd, vurgu === key && { color: RENKLER.metin, fontWeight: '800' }]}>{t.ad}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={[ORTAK_STIL.kart, { marginTop: 16 }]}>
        <Pressable onPress={() => { setSifreAcik((v) => !v); setSifreHata(null); }} style={styles.menuSatiri}>
          <Text style={styles.menuMetin}>🔑 Şifre değiştir</Text>
          <Text style={styles.menuOk}>{sifreAcik ? '⌄' : '›'}</Text>
        </Pressable>
        {sifreAcik ? (
          <View>
            {[['mevcut', 'Mevcut (veya geçici) şifre'], ['yeni', 'Yeni şifre (en az 6 karakter)'], ['tekrar', 'Yeni şifre tekrar']].map(([k, ph]) => (
              <TextInput
                key={k}
                style={styles.silmeInput}
                placeholder={ph}
                placeholderTextColor={RENKLER.metinUcuncul}
                secureTextEntry
                autoCapitalize="none"
                value={sifreForm[k]}
                onChangeText={(v) => setSifreForm((f) => ({ ...f, [k]: v }))}
              />
            ))}
            {sifreHata ? <Text style={styles.silmeHataMetin}>{sifreHata}</Text> : null}
            <TouchableOpacity style={[ORTAK_STIL.buyukButon, { marginTop: 12 }]} onPress={sifreDegistir} disabled={sifreKaydediliyor}>
              {sifreKaydediliyor ? <ActivityIndicator color={RENKLER.vurguUstu} /> : <Text style={{ color: RENKLER.vurguUstu, fontWeight: '800' }}>Şifreyi Kaydet</Text>}
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      {user?.isAdmin ? (
        <TouchableOpacity style={[ORTAK_STIL.buyukButon, { marginTop: 24 }]} onPress={() => panelDegistir('admin')}>
          <Text style={{ color: RENKLER.vurguUstu, fontFamily: FONT.etiketItalik, fontSize: 17, letterSpacing: 1 }}>🛠️ YÖNETİM PANELİ</Text>
        </TouchableOpacity>
      ) : null}

      <TouchableOpacity style={[styles.cikisButon, { marginTop: 24 }]} onPress={logout}>
        <Text style={styles.cikisMetin}>Çıkış Yap</Text>
      </TouchableOpacity>

      {!silmeAcik ? (
        <Pressable onPress={() => setSilmeAcik(true)} style={{ marginTop: 20 }}>
          <Text style={styles.hesapSilLink}>Hesabımı Sil</Text>
        </Pressable>
      ) : (
        <View style={[ORTAK_STIL.kart, { marginTop: 20, borderColor: RENKLER.hata, borderWidth: 1 }]}>
          <Text style={styles.bolumBaslik}>HESABI SİL</Text>
          <Text style={styles.aciklama}>
            Hesabın, e-postan ve kişisel bilgilerin kalıcı olarak silinir, tekrar giriş yapamazsın.
            Onaylamak için şifreni gir.
          </Text>
          <TextInput
            value={silmeSifre}
            onChangeText={(v) => { setSilmeSifre(v); setSilmeHata(null); }}
            placeholder="Şifren"
            placeholderTextColor={RENKLER.metinUcuncul}
            secureTextEntry
            style={styles.silmeInput}
          />
          {silmeHata ? <Text style={styles.silmeHataMetin}>{silmeHata}</Text> : null}
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
            <TouchableOpacity
              style={[styles.silmeButon, { backgroundColor: RENKLER.bg3, flex: 1 }]}
              onPress={() => { setSilmeAcik(false); setSilmeSifre(''); setSilmeHata(null); }}
              disabled={silmeYukleniyor}
            >
              <Text style={[styles.cikisMetin, { color: RENKLER.metin }]}>Vazgeç</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.silmeButon, { backgroundColor: RENKLER.hata, flex: 1 }]}
              onPress={hesabiSilOnayla}
              disabled={silmeYukleniyor}
            >
              {silmeYukleniyor ? <ActivityIndicator color="#fff" /> : <Text style={styles.cikisMetin}>HESABI SİL</Text>}
            </TouchableOpacity>
          </View>
        </View>
      )}
      </ScrollView>
    </View>
  );
}

function olusturStyles(RENKLER) {
  return StyleSheet.create({
  baslik: { fontFamily: FONT.dev, fontSize: 38, lineHeight: 40, color: RENKLER.metin, letterSpacing: 0.5 },
  bolumBaslik: { fontFamily: FONT.etiket, fontSize: 15, letterSpacing: 1.4, color: RENKLER.metinIkincil },
  etiket: { fontSize: 12, color: RENKLER.metinUcuncul },
  deger: { fontSize: 16, color: RENKLER.metin, marginTop: 2, fontWeight: '600' },
  aciklama: { fontSize: 12, color: RENKLER.metinIkincil, marginTop: 2 },
  adminRozet: {
    alignSelf: 'flex-start', backgroundColor: RENKLER.vurgu,
    color: '#fff', fontWeight: '700', fontSize: 11, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
  },
  menuSatiri: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 46 },
  menuMetin: { fontSize: 14.5, fontWeight: '600', color: RENKLER.metin },
  menuOk: { fontSize: 22, color: RENKLER.metinUcuncul },
  kategoriSatiri: { flexDirection: 'row', alignItems: 'center', marginTop: 14 },
  kategoriBaslik: { fontSize: 13.5, fontWeight: '700', color: RENKLER.metin },
  cikisButon: { backgroundColor: RENKLER.hata, borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  cikisMetin: { color: '#fff', fontWeight: '700', fontSize: 16 },
  hesapSilLink: { color: RENKLER.metinUcuncul, fontSize: 12.5, textAlign: 'center', textDecorationLine: 'underline' },
  silmeInput: {
    marginTop: 12, borderWidth: 1, borderColor: RENKLER.ayrici, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, color: RENKLER.metin, fontSize: 14,
  },
  silmeHataMetin: { color: RENKLER.hata, fontSize: 12, marginTop: 8 },
  silmeButon: { borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  temaSatiri: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 14 },
  temaSecenek: { alignItems: 'center', gap: 6 },
  modSatiri: { flexDirection: 'row', gap: 10, marginTop: 8 },
  modButon: { flex: 1, minHeight: 46, borderRadius: 3, borderWidth: 1, borderColor: RENKLER.ayrici, backgroundColor: RENKLER.bg3, alignItems: 'center', justifyContent: 'center', transform: [{ skewX: '-8deg' }] },
  modMetin: { fontFamily: FONT.etiketItalik, fontSize: 15, letterSpacing: 1, color: RENKLER.metin },
  temaDaire: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent' },
  temaDaireSecili: { borderColor: RENKLER.metin },
  temaTik: { color: RENKLER.vurguUstu, fontWeight: '900', fontSize: 16 },
  temaAd: { fontSize: 11, color: RENKLER.metinIkincil, fontWeight: '600' },
  });
}
