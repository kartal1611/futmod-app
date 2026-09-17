import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { useAuthStore } from '../store/authStore';
import { useRenkler, useOrtakStil } from '../constants/theme';

export default function AdminLoginEkrani({ onGeri }) {
  const RENKLER = useRenkler();
  const ORTAK_STIL = useOrtakStil();
  const styles = olusturStyles(RENKLER);
  const { adminLogin, error } = useAuthStore();
  const [email, setEmail] = useState('');
  const [sifre, setSifre] = useState('');
  const [gonderiliyor, setGonderiliyor] = useState(false);

  const gonder = async () => {
    if (!email || !sifre) return;
    setGonderiliyor(true);
    await adminLogin({ email, password: sifre });
    setGonderiliyor(false);
  };

  return (
    <KeyboardAvoidingView style={ORTAK_STIL.ekran} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.icerik} keyboardShouldPersistTaps="handled">
        <Text style={styles.logo}>🛠️ Yönetici Girişi</Text>
        <Text style={styles.altBaslik}>Sadece yetkili hesaplar girebilir</Text>

        <View style={[ORTAK_STIL.kart, { marginTop: 32, width: '100%' }]}>
          <TextInput
            style={styles.input}
            placeholder="Yönetici e-posta"
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

          {error ? <Text style={styles.hata}>{error}</Text> : null}

          <TouchableOpacity style={[ORTAK_STIL.buyukButon, { marginTop: 16 }]} onPress={gonder} disabled={gonderiliyor}>
            {gonderiliyor ? <ActivityIndicator color={RENKLER.bg} /> : <Text style={styles.buttonMetin}>Giriş Yap</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={onGeri} style={{ marginTop: 16 }}>
            <Text style={styles.gecis}>‹ Üye girişine dön</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function olusturStyles(RENKLER) {
  return StyleSheet.create({
  icerik: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  logo: { fontSize: 24, fontWeight: '800', color: RENKLER.metin, marginTop: 24 },
  altBaslik: { fontSize: 13, color: RENKLER.metinIkincil, marginTop: 4 },
  input: {
    backgroundColor: RENKLER.bg3, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    color: RENKLER.metin, marginBottom: 12, borderWidth: 1, borderColor: RENKLER.ayrici,
  },
  buttonMetin: { color: RENKLER.bg, fontWeight: '700', fontSize: 16 },
  gecis: { color: RENKLER.vurgu2, textAlign: 'center' },
  hata: { color: RENKLER.hata, marginBottom: 8 },
  });
}
