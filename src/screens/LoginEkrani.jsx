import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { useAuthStore } from '../store/authStore';
import { RENKLER, ORTAK_STIL } from '../constants/theme';

export default function LoginEkrani({ onAdminGiris }) {
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
      <ScrollView contentContainerStyle={styles.icerik} keyboardShouldPersistTaps="handled">
        <Text style={styles.logo}>TorunFC ⚽</Text>
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
              <ActivityIndicator color="#fff" />
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

const styles = StyleSheet.create({
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
  buttonMetin: { color: '#fff', fontWeight: '700', fontSize: 16 },
  gecis: { color: RENKLER.vurgu2, textAlign: 'center' },
  hata: { color: RENKLER.hata, marginBottom: 8 },
  yoneticiLink: { color: RENKLER.metinUcuncul, fontSize: 12.5, textDecorationLine: 'underline' },
});
