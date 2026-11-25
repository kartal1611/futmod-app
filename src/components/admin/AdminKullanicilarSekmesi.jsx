import { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { api } from '../../services/api';
import { useRenkler, useOrtakStil } from '../../constants/theme';

// Moderatör "küçük admin"dir: forumda silme, sabitleme, kilitleme ve üye yasaklama yapabilir.
const ROLLER = [
  { anahtar: 'isModerator', ver: '🛡️ Moderatör yap', kaldir: 'Moderatörlüğü kaldır' },
  { anahtar: 'isVip', ver: '💎 VIP yap', kaldir: "VIP'liği kaldır" },
  { anahtar: 'isAffiliate', ver: 'Partner yap', kaldir: 'Partnerliği kaldır' },
];

export default function AdminKullanicilarSekmesi() {
  const RENKLER = useRenkler();
  const ORTAK_STIL = useOrtakStil();
  const styles = olusturStyles(RENKLER);
  const [email, setEmail] = useState('');
  const [liste, setListe] = useState([]);
  const [kullanici, setKullanici] = useState(null);
  const [mesaj, setMesaj] = useState(null);
  const [isleniyor, setIsleniyor] = useState(false);

  // Boş arama en yeni üyeleri getirir; e-posta ya da kullanıcı adının bir parçası yeter.
  const ara = async () => {
    setIsleniyor(true);
    setMesaj(null);
    try {
      const data = await api.adminUsers(email.trim());
      setListe(data.items || []);
      if (!data.items?.length) setMesaj('Kullanıcı bulunamadı');
    } catch (err) {
      setMesaj(err.message);
    } finally {
      setIsleniyor(false);
    }
  };

  useEffect(() => { ara(); }, []);

  const guncelle = (u) => {
    setKullanici(u);
    setListe((l) => l.map((x) => (x.id === u.id ? u : x)));
  };

  const rolDegistir = async (anahtar) => {
    try {
      const data = await api.adminSetRoles(kullanici.id, { [anahtar]: !kullanici[anahtar] });
      guncelle(data.user);
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
            guncelle({ ...kullanici, isBanned: !askida });
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
          placeholder="E-posta veya kullanıcı adı (boşsa en yeniler)"
          placeholderTextColor={RENKLER.metinUcuncul}
          autoCapitalize="none"
          returnKeyType="search"
          value={email}
          onChangeText={setEmail}
          onSubmitEditing={ara}
        />
        <Pressable style={[ORTAK_STIL.buyukButon, { marginTop: 12 }]} onPress={ara} disabled={isleniyor}>
          {isleniyor ? <ActivityIndicator color={RENKLER.vurguUstu} /> : <Text style={styles.butonMetin}>Ara</Text>}
        </Pressable>
        {mesaj ? <Text style={styles.mesaj}>{mesaj}</Text> : null}
      </View>

      {kullanici ? (
        <View style={[ORTAK_STIL.kart, { marginTop: 14 }]}>
          <Pressable onPress={() => setKullanici(null)} hitSlop={10}>
            <Text style={{ color: RENKLER.vurgu, fontWeight: '800', marginBottom: 8 }}>‹ Listeye dön</Text>
          </Pressable>
          <Text style={styles.ad}>{kullanici.displayName}</Text>
          <Text style={styles.satir}>{kullanici.email}</Text>
          <Text style={styles.satir}>
            {[kullanici.isAdmin ? 'Admin' : kullanici.isModerator ? 'Moderatör' : 'Üye', kullanici.isVip && 'VIP', kullanici.isAffiliate && 'Partner', kullanici.isBanned && 'Askıda'].filter(Boolean).join(' · ')}
          </Text>
          {!kullanici.isAdmin ? (
            <>
              {ROLLER.map((r) => (
                <Pressable key={r.anahtar} style={[styles.ikincilButon, kullanici[r.anahtar] && { borderColor: RENKLER.vurgu }]} onPress={() => rolDegistir(r.anahtar)}>
                  <Text style={styles.ikincilMetin}>{kullanici[r.anahtar] ? r.kaldir : r.ver}</Text>
                </Pressable>
              ))}
              <Pressable style={[styles.ikincilButon, { borderColor: RENKLER.hata }]} onPress={askiDegistir}>
                <Text style={[styles.ikincilMetin, { color: RENKLER.hata }]}>{kullanici.isBanned ? 'Askıyı kaldır' : 'Hesabı askıya al'}</Text>
              </Pressable>
            </>
          ) : null}
        </View>
      ) : (
        <View style={{ marginTop: 14, gap: 8 }}>
          {liste.map((u) => (
            <Pressable key={u.id} onPress={() => setKullanici(u)} style={styles.listeSatir}>
              <Text style={styles.listeAd} numberOfLines={1}>{u.displayName}</Text>
              <Text style={styles.satir} numberOfLines={1}>
                {u.email} · {[u.isAdmin ? 'Admin' : u.isModerator ? 'Moderatör' : 'Üye', u.isVip && 'VIP', u.isAffiliate && 'Partner', u.isBanned && 'Yasaklı'].filter(Boolean).join(' · ')}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
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
    butonMetin: { color: RENKLER.vurguUstu, fontWeight: '800', fontSize: 14 },
    mesaj: { marginTop: 12, color: RENKLER.vurgu2, textAlign: 'center', fontSize: 13 },
    ad: { fontSize: 17, fontWeight: '800', color: RENKLER.metin },
    satir: { fontSize: 13, color: RENKLER.metinIkincil, marginTop: 4 },
    ikincilButon: { marginTop: 12, minHeight: 46, borderRadius: 12, borderWidth: 1, borderColor: RENKLER.ayrici, alignItems: 'center', justifyContent: 'center' },
    listeSatir: { backgroundColor: RENKLER.bg2, borderRadius: 4, borderWidth: 1, borderColor: RENKLER.ayrici, padding: 12 },
    listeAd: { fontSize: 15, fontWeight: '800', color: RENKLER.metin },
    ikincilMetin: { fontSize: 13.5, fontWeight: '700', color: RENKLER.metin },
  });
}
