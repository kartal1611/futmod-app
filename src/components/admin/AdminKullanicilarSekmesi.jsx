import { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { api } from '../../services/api';
import { useRenkler, useOrtakStil } from '../../constants/theme';

export default function AdminKullanicilarSekmesi() {
  const RENKLER = useRenkler();
  const ORTAK_STIL = useOrtakStil();
  const styles = olusturStyles(RENKLER);
  const [email, setEmail] = useState('');
  const [kullanici, setKullanici] = useState(null);
  const [mesaj, setMesaj] = useState(null);
  const [isleniyor, setIsleniyor] = useState(false);

  const ara = async () => {
    if (!email.trim()) return;
    setIsleniyor(true);
    setMesaj(null);
    try {
      const data = await api.adminFindUser(email.trim().toLowerCase());
      setKullanici(data.user);
    } catch (err) {
      setKullanici(null);
      setMesaj(err.message);
    } finally {
      setIsleniyor(false);
    }
  };

  const moderatorDegistir = async () => {
    try {
      const data = await api.adminSetModerator(kullanici.id, !kullanici.isModerator);
      setKullanici(data.user);
    } catch (err) {
      setMesaj(err.message);
    }
  };

  const askiDegistir = () => {
    const askida = kullanici.isBanned;
    Alert.alert(askida ? 'Askıyı kaldır' : 'Hesabı askıya al', `${kullanici.displayName} için bu işlemi onaylıyor musun?`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Onayla', style: askida ? 'default' : 'destructive', onPress: async () => {
          try {
            await (askida ? api.adminUnbanUser(kullanici.id) : api.adminBanUser(kullanici.id));
            setKullanici((k) => ({ ...k, isBanned: !askida }));
          } catch (err) {
            setMesaj(err.message);
          }
        },
      },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
      <View style={ORTAK_STIL.kart}>
        <Text style={styles.baslik}>Kullanıcı Ara</Text>
        <TextInput
          style={styles.input}
          placeholder="E-posta"
          placeholderTextColor={RENKLER.metinUcuncul}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          onSubmitEditing={ara}
        />
        <Pressable style={[ORTAK_STIL.buyukButon, { marginTop: 12 }]} onPress={ara} disabled={isleniyor}>
          {isleniyor ? <ActivityIndicator color={RENKLER.bg} /> : <Text style={styles.butonMetin}>Ara</Text>}
        </Pressable>
        {mesaj ? <Text style={styles.mesaj}>{mesaj}</Text> : null}
      </View>

      {kullanici ? (
        <View style={[ORTAK_STIL.kart, { marginTop: 14 }]}>
          <Text style={styles.ad}>{kullanici.displayName}</Text>
          <Text style={styles.satir}>{kullanici.email}</Text>
          <Text style={styles.satir}>
            {kullanici.isAdmin ? 'Yönetici' : kullanici.isModerator ? 'Moderatör' : 'Üye'}{kullanici.isBanned ? ' · Askıda' : ''}
          </Text>
          {!kullanici.isAdmin ? (
            <>
              <Pressable style={styles.ikincilButon} onPress={moderatorDegistir}>
                <Text style={styles.ikincilMetin}>{kullanici.isModerator ? 'Moderatörlüğü kaldır' : 'Moderatör yap'}</Text>
              </Pressable>
              <Pressable style={[styles.ikincilButon, { borderColor: RENKLER.hata }]} onPress={askiDegistir}>
                <Text style={[styles.ikincilMetin, { color: RENKLER.hata }]}>{kullanici.isBanned ? 'Askıyı kaldır' : 'Hesabı askıya al'}</Text>
              </Pressable>
            </>
          ) : null}
        </View>
      ) : null}
    </ScrollView>
  );
}

function olusturStyles(RENKLER) {
  return StyleSheet.create({
    baslik: { fontSize: 14, fontWeight: '700', color: RENKLER.metin },
    input: {
      marginTop: 10, backgroundColor: RENKLER.bg3, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
      color: RENKLER.metin, borderWidth: 1, borderColor: RENKLER.ayrici,
    },
    butonMetin: { color: RENKLER.bg, fontWeight: '800', fontSize: 14 },
    mesaj: { marginTop: 12, color: RENKLER.vurgu2, textAlign: 'center', fontSize: 13 },
    ad: { fontSize: 17, fontWeight: '800', color: RENKLER.metin },
    satir: { fontSize: 13, color: RENKLER.metinIkincil, marginTop: 4 },
    ikincilButon: { marginTop: 12, minHeight: 46, borderRadius: 12, borderWidth: 1, borderColor: RENKLER.ayrici, alignItems: 'center', justifyContent: 'center' },
    ikincilMetin: { fontSize: 13.5, fontWeight: '700', color: RENKLER.metin },
  });
}
