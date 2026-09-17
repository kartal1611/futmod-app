import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import NeonParilti from '../components/NeonParilti';
import { useAuthStore } from '../store/authStore';
import { useRenkler, useOrtakStil } from '../constants/theme';

export default function LoginEkrani({ onAdminGiris }) {
  const RENKLER = useRenkler();
  const ORTAK_STIL = useOrtakStil();
  const styles = olusturStyles(RENKLER);
  const { login, register, error } = useAuthStore();
  const [kayitModu, setKayitModu] = useState(false);
  const [email, setEmail] = useState('');
  const [sifre, setSifre] = useState('');
  const [ad, setAd] = useState('');
  const [referansKodu, setReferansKodu] = useState('');
  const [gonderiliyor, setGonderiliyor] = useState(false);

  const gonder = async () => {
    if (!email || !sifre) return;
    setGonderiliyor(true);
    if (kayitModu) {
      await register({ email, password: sifre, displayName: ad, referralCode: referansKodu });
    } else {
      await login({ email, password: sifre });
    }
    setGonderiliyor(false);
  };

  return (
    <KeyboardAvoidingView
      style={ORTAK_STIL.ekran}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <NeonParilti />
      <ScrollView contentContainerStyle={styles.icerik} keyboardShouldPersistTaps="handled">
        <Text style={styles.logo}>FutMod ⚽</Text>
        <Text style={styles.altBaslik}>EAFC 27'de bir adım önde ol</Text>

        <View style={[ORTAK_STIL.kart, { marginTop: 32, width: '100%' }]}>
          <Text style={styles.formBaslik}>{kayitModu ? 'Kayıt Ol' : 'Giriş Yap'}</Text>

          {kayitModu && (
            <TextInput
              style={styles.input}
              placeholder="Görünen isim (opsiyonel)"
              placeholderTextColor={RENKLER.metinUcuncul}
              value={ad}
              onChangeText={setAd}
            />
          )}

          <TextInput
            style={styles.input}
            placeholder="E-posta"
            placeholderTextColor={RENKLER.metinUcuncul}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Şifre"
            placeholderTextColor={RENKLER.metinUcuncul}
            secureTextEntry
            value={sifre}
            onChangeText={setSifre}
          />

          {kayitModu && (
            <TextInput
              style={styles.input}
              placeholder="Referans kodu (opsiyonel)"
              placeholderTextColor={RENKLER.metinUcuncul}
              autoCapitalize="characters"
              value={referansKodu}
              onChangeText={setReferansKodu}
            />
          )}

          {error ? <Text style={styles.hata}>{error}</Text> : null}

          <TouchableOpacity style={[ORTAK_STIL.buyukButon, { marginTop: 16 }]} onPress={gonder} disabled={gonderiliyor}>
            {gonderiliyor ? (
              <ActivityIndicator color={RENKLER.bg} />
            ) : (
              <Text style={styles.buttonMetin}>{kayitModu ? 'Kayıt Ol' : 'Giriş Yap'}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setKayitModu(!kayitModu)} style={{ marginTop: 16 }}>
            <Text style={styles.gecis}>
              {kayitModu ? 'Zaten hesabın var mı? Giriş yap' : 'Hesabın yok mu? Kayıt ol'}
            </Text>
          </TouchableOpacity>
        </View>

        {onAdminGiris ? (
          <TouchableOpacity onPress={onAdminGiris} style={{ marginTop: 28 }}>
            <Text style={styles.yoneticiLink}>Yönetici Girişi</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function olusturStyles(RENKLER) {
  return StyleSheet.create({
  neonParilti: { position: 'absolute', top: 0, left: 0, right: 0, height: 320 },
  icerik: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  logo: { fontSize: 36, fontWeight: '800', color: RENKLER.vurgu, marginTop: 24 },
  altBaslik: { fontSize: 14, color: RENKLER.metinIkincil, marginTop: 4 },
  formBaslik: { fontSize: 18, fontWeight: '700', color: RENKLER.metin, marginBottom: 16 },
  input: {
    backgroundColor: RENKLER.bg3,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: RENKLER.metin,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: RENKLER.ayrici,
  },
  buttonMetin: { color: RENKLER.bg, fontWeight: '700', fontSize: 16 },
  gecis: { color: RENKLER.vurgu2, textAlign: 'center' },
  hata: { color: RENKLER.hata, marginBottom: 8 },
  yoneticiLink: { color: RENKLER.metinUcuncul, fontSize: 12.5, textDecorationLine: 'underline' },
  });
}
