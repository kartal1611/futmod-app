import { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { api } from '../../services/api';
import { RENKLER, ORTAK_STIL } from '../../constants/theme';

const SURELER = [
  { key: '1', label: '1 Ay', durationMonths: 1 },
  { key: '2', label: '2 Ay', durationMonths: 2 },
  { key: '3', label: '3 Ay', durationMonths: 3 },
  { key: '12', label: 'Yıllık', durationMonths: 12 },
  { key: 'unlimited', label: 'Sınırsız', unlimited: true },
];

export default function AdminVipSekmesi() {
  const [email, setEmail] = useState('');
  const [bulunanKullanici, setBulunanKullanici] = useState(null);
  const [ariyor, setAriyor] = useState(false);
  const [not, setNot] = useState('');
  const [indirimYuzdesi, setIndirimYuzdesi] = useState('10');
  const [mesaj, setMesaj] = useState(null);
  const [islemde, setIslemde] = useState(false);

  const ara = async () => {
    if (!email.trim()) return;
    setAriyor(true);
    setMesaj(null);
    setBulunanKullanici(null);
    try {
      const data = await api.adminFindUser(email.trim());
      setBulunanKullanici(data.user);
      setNot(data.user.adminNote || '');
    } catch (err) {
      setMesaj(err.message);
    } finally {
      setAriyor(false);
    }
  };

  const vipVer = async (secim) => {
    setIslemde(true);
    setMesaj(null);
    try {
      const payload = {
        email: bulunanKullanici.email,
        discountPercent: Number(indirimYuzdesi) || 10,
        ...(secim.unlimited ? { unlimited: true } : { durationMonths: secim.durationMonths }),
      };
      const data = await api.adminSetVip(payload);
      setBulunanKullanici((onceki) => ({ ...onceki, ...data.user }));
      setMesaj(`✅ VIP verildi: ${secim.label}`);
    } catch (err) {
      setMesaj(err.message);
    } finally {
      setIslemde(false);
    }
  };

  const vipKaldir = async () => {
    setIslemde(true);
    setMesaj(null);
    try {
      await api.adminRemoveVip(bulunanKullanici.email);
      setBulunanKullanici((onceki) => ({ ...onceki, isVip: false, vipUntil: null }));
      setMesaj('VIP kaldırıldı');
    } catch (err) {
      setMesaj(err.message);
    } finally {
      setIslemde(false);
    }
  };

  const notKaydet = async () => {
    setIslemde(true);
    try {
      await api.adminSetNote(bulunanKullanici.email, not);
      setMesaj('Not kaydedildi');
    } catch (err) {
      setMesaj(err.message);
    } finally {
      setIslemde(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <View style={ORTAK_STIL.kart}>
        <Text style={styles.baslik}>Üye Ara</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
          <TextInput
            style={styles.input}
            placeholder="uye@ornek.com"
            placeholderTextColor={RENKLER.metinUcuncul}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <Pressable style={styles.aramaButon} onPress={ara} disabled={ariyor}>
            {ariyor ? <ActivityIndicator size="small" color={RENKLER.bg} /> : <Text style={styles.aramaButonMetin}>Ara</Text>}
          </Pressable>
        </View>
      </View>

      {bulunanKullanici ? (
        <>
          <View style={[ORTAK_STIL.kart, { marginTop: 16 }]}>
            <Text style={styles.uyeEmail}>{bulunanKullanici.email}</Text>
            {bulunanKullanici.displayName ? <Text style={styles.uyeIsim}>{bulunanKullanici.displayName}</Text> : null}
            <Text style={styles.durum}>
              {bulunanKullanici.isVip
                ? `⭐ VIP ${bulunanKullanici.vipUntil ? `· ${new Date(bulunanKullanici.vipUntil).toLocaleDateString('tr-TR')}'e kadar` : '· Sınırsız'}`
                : 'VIP değil'}
            </Text>
          </View>

          <View style={[ORTAK_STIL.kart, { marginTop: 16 }]}>
            <Text style={styles.baslik}>İndirim Yüzdesi</Text>
            <TextInput
              style={[styles.input, { marginTop: 10 }]}
              keyboardType="number-pad"
              value={indirimYuzdesi}
              onChangeText={setIndirimYuzdesi}
            />

            <Text style={[styles.baslik, { marginTop: 16 }]}>VIP Süresi Ver</Text>
            <View style={styles.sureSatiri}>
              {SURELER.map((s) => (
                <Pressable key={s.key} style={styles.sureButon} onPress={() => vipVer(s)} disabled={islemde}>
                  <Text style={styles.sureButonMetin}>{s.label}</Text>
                </Pressable>
              ))}
            </View>

            {bulunanKullanici.isVip ? (
              <Pressable style={styles.kaldirButon} onPress={vipKaldir} disabled={islemde}>
                <Text style={styles.kaldirButonMetin}>VIP'i Kaldır</Text>
              </Pressable>
            ) : null}
          </View>

          <View style={[ORTAK_STIL.kart, { marginTop: 16 }]}>
            <Text style={styles.baslik}>Not</Text>
            <TextInput
              style={[styles.input, { marginTop: 10, height: 80, textAlignVertical: 'top' }]}
              multiline
              placeholder="Bu üye hakkında not..."
              placeholderTextColor={RENKLER.metinUcuncul}
              value={not}
              onChangeText={setNot}
            />
            <Pressable style={[ORTAK_STIL.buyukButon, { marginTop: 10 }]} onPress={notKaydet} disabled={islemde}>
              <Text style={styles.aramaButonMetin}>Notu Kaydet</Text>
            </Pressable>
          </View>
        </>
      ) : null}

      {mesaj ? <Text style={styles.mesaj}>{mesaj}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  baslik: { fontSize: 14, fontWeight: '700', color: RENKLER.metin },
  input: {
    flex: 1, backgroundColor: RENKLER.bg3, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
    color: RENKLER.metin, borderWidth: 1, borderColor: RENKLER.ayrici,
  },
  aramaButon: { backgroundColor: RENKLER.vurgu, borderRadius: 10, paddingHorizontal: 18, justifyContent: 'center' },
  aramaButonMetin: { color: RENKLER.bg, fontWeight: '800', fontSize: 13 },
  uyeEmail: { fontSize: 16, fontWeight: '800', color: RENKLER.metin },
  uyeIsim: { fontSize: 13, color: RENKLER.metinIkincil, marginTop: 2 },
  durum: { fontSize: 13, color: RENKLER.vurgu2, fontWeight: '700', marginTop: 8 },
  sureSatiri: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  sureButon: { backgroundColor: RENKLER.bg3, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: RENKLER.ayrici },
  sureButonMetin: { color: RENKLER.metin, fontWeight: '700', fontSize: 12.5 },
  kaldirButon: { marginTop: 14, alignItems: 'center', paddingVertical: 10 },
  kaldirButonMetin: { color: RENKLER.hata, fontWeight: '700', fontSize: 13 },
  mesaj: { marginTop: 16, color: RENKLER.vurgu2, textAlign: 'center', fontSize: 13 },
});
