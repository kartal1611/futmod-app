import { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { api } from '../../services/api';
import { useRenkler, useOrtakStil } from '../../constants/theme';

const URUNLER = [
  { key: 'membership_99', label: 'Üyelik (99 ₺)' },
  { key: 'vip_trade_149', label: 'VIP Trade Açma (149 ₺)' },
];

const DURUM_METIN = { pending: 'Bekliyor', paid: 'Onaylandı', failed: 'Başarısız' };

export default function AdminOdemelerSekmesi() {
  const RENKLER = useRenkler();
  const ORTAK_STIL = useOrtakStil();
  const styles = olusturStyles(RENKLER);
  const DURUM_RENGI = { pending: RENKLER.uyari, paid: RENKLER.basari, failed: RENKLER.hata };
  const [liste, setListe] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [email, setEmail] = useState('');
  const [urun, setUrun] = useState('membership_99');
  const [not, setNot] = useState('');
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [mesaj, setMesaj] = useState(null);
  const [inviteLinkTaslak, setInviteLinkTaslak] = useState({});

  const listeyiGetir = () => {
    setYukleniyor(true);
    api.adminListPayments().then((data) => setListe(data.items)).finally(() => setYukleniyor(false));
  };

  useEffect(() => { listeyiGetir(); }, []);

  const kaydiOlustur = async () => {
    if (!email.trim()) return;
    setKaydediliyor(true);
    setMesaj(null);
    try {
      await api.adminCreatePayment({ email: email.trim(), product: urun, adminNote: not.trim() || null });
      setMesaj('✅ Ödeme kaydı oluşturuldu (bekliyor).');
      setEmail('');
      setNot('');
      listeyiGetir();
    } catch (err) {
      setMesaj(err.message);
    } finally {
      setKaydediliyor(false);
    }
  };

  const onayla = (item) => {
    const link = inviteLinkTaslak[item.id] || '';
    Alert.alert(
      'Ödemeyi onayla',
      `${item.amount} ₺ (${item.product}) ödemesini onaylıyor musun? ${item.product === 'vip_trade_149' ? 'Kullanıcı otomatik VIP olacak.' : ''}`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Onayla',
          onPress: async () => {
            try {
              await api.adminMarkPaymentPaid(item.id, { telegramInviteLink: link.trim() || null });
              listeyiGetir();
            } catch (err) {
              setMesaj(err.message);
            }
          },
        },
      ]
    );
  };

  const basarisizYap = (item) => {
    Alert.alert('Başarısız işaretle', 'Bu ödeme kaydını başarısız olarak işaretlemek istiyor musun?', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Evet', style: 'destructive', onPress: async () => { await api.adminMarkPaymentFailed(item.id); listeyiGetir(); } },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <View style={ORTAK_STIL.kart}>
        <Text style={styles.baslik}>Yeni Ödeme Kaydı</Text>
        <Text style={styles.aciklama}>
          Henüz canlı ödeme sağlayıcı (iyzico) bağlı değil — kullanıcı banka havalesi vb. ile ödediğinde burada kaydını oluştur, onaylayınca sistem otomatik VIP açar (VIP Trade ürünü için).
        </Text>

        <TextInput
          style={[styles.input, { marginTop: 10 }]}
          placeholder="Kullanıcı e-postası"
          placeholderTextColor={RENKLER.metinUcuncul}
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <View style={[styles.chipSatiri, { marginTop: 10 }]}>
          {URUNLER.map((u) => (
            <Pressable key={u.key} onPress={() => setUrun(u.key)} style={[styles.chip, urun === u.key && styles.chipSecili]}>
              <Text style={[styles.chipMetin, urun === u.key && styles.chipMetinSecili]}>{u.label}</Text>
            </Pressable>
          ))}
        </View>

        <TextInput
          style={[styles.input, { marginTop: 10 }]}
          placeholder="Not (opsiyonel, örn: havale dekontu no)"
          placeholderTextColor={RENKLER.metinUcuncul}
          value={not}
          onChangeText={setNot}
        />

        <Pressable style={[ORTAK_STIL.buyukButon, { marginTop: 14 }]} onPress={kaydiOlustur} disabled={kaydediliyor}>
          {kaydediliyor ? <ActivityIndicator color={RENKLER.bg} /> : <Text style={styles.buttonMetin}>Kayıt Oluştur</Text>}
        </Pressable>
        {mesaj ? <Text style={styles.mesaj}>{mesaj}</Text> : null}
      </View>

      <Text style={styles.listeBaslik}>Ödemeler</Text>
      {yukleniyor ? (
        <ActivityIndicator style={{ marginTop: 20 }} color={RENKLER.vurgu} />
      ) : liste.length === 0 ? (
        <Text style={styles.bos}>Henüz ödeme kaydı yok.</Text>
      ) : (
        liste.map((item) => (
          <View key={item.id} style={[ORTAK_STIL.kart, { marginTop: 10 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.satirBaslik}>#{item.id} · {item.amount} ₺ · {item.product}</Text>
              <Text style={[styles.durumRozet, { color: DURUM_RENGI[item.status], borderColor: DURUM_RENGI[item.status] }]}>
                {DURUM_METIN[item.status]}
              </Text>
            </View>
            <Text style={styles.satirAlt}>Kullanıcı ID: {item.userId} · {new Date(item.createdAt).toLocaleString('tr-TR')}</Text>
            {item.adminNote ? <Text style={styles.satirAlt}>Not: {item.adminNote}</Text> : null}
            {item.telegramInviteLink ? <Text style={styles.satirAlt}>Davet linki: {item.telegramInviteLink}</Text> : null}

            {item.status === 'pending' ? (
              <>
                <TextInput
                  style={[styles.input, { marginTop: 10, fontSize: 12 }]}
                  placeholder="Telegram davet linki (varsa, elle yapıştır)"
                  placeholderTextColor={RENKLER.metinUcuncul}
                  value={inviteLinkTaslak[item.id] || ''}
                  onChangeText={(v) => setInviteLinkTaslak((s) => ({ ...s, [item.id]: v }))}
                />
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                  <Pressable style={[styles.onayButon, { flex: 1 }]} onPress={() => onayla(item)}>
                    <Text style={styles.onayMetin}>Onayla</Text>
                  </Pressable>
                  <Pressable style={styles.reddetButon} onPress={() => basarisizYap(item)}>
                    <Text style={styles.reddetMetin}>Başarısız</Text>
                  </Pressable>
                </View>
              </>
            ) : null}
          </View>
        ))
      )}
    </ScrollView>
  );
}

function olusturStyles(RENKLER) {
  return StyleSheet.create({
  baslik: { fontSize: 15, fontWeight: '700', color: RENKLER.metin },
  aciklama: { fontSize: 11.5, color: RENKLER.metinIkincil, marginTop: 6, lineHeight: 16 },
  input: {
    backgroundColor: RENKLER.bg3, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    color: RENKLER.metin, borderWidth: 1, borderColor: RENKLER.ayrici, fontSize: 13.5,
  },
  chipSatiri: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18, backgroundColor: RENKLER.bg3, borderWidth: 1, borderColor: RENKLER.ayrici },
  chipSecili: { backgroundColor: RENKLER.vurgu, borderColor: RENKLER.vurgu },
  chipMetin: { fontSize: 12, fontWeight: '700', color: RENKLER.metinIkincil },
  chipMetinSecili: { color: RENKLER.bg },
  buttonMetin: { color: RENKLER.bg, fontWeight: '800', fontSize: 14 },
  mesaj: { marginTop: 12, color: RENKLER.vurgu2, textAlign: 'center', fontSize: 13 },
  listeBaslik: { fontSize: 14, fontWeight: '700', color: RENKLER.metin, marginTop: 20, marginBottom: 6 },
  bos: { color: RENKLER.metinIkincil, fontSize: 12.5, marginTop: 8 },
  satirBaslik: { fontSize: 13, fontWeight: '700', color: RENKLER.metin },
  satirAlt: { fontSize: 11, color: RENKLER.metinUcuncul, marginTop: 4 },
  durumRozet: { fontSize: 10.5, fontWeight: '800', borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  onayButon: { backgroundColor: RENKLER.basari, borderRadius: 10, paddingVertical: 11, alignItems: 'center' },
  onayMetin: { color: RENKLER.bg, fontWeight: '800', fontSize: 13 },
  reddetButon: { backgroundColor: RENKLER.bg3, borderRadius: 10, paddingVertical: 11, paddingHorizontal: 16, alignItems: 'center' },
  reddetMetin: { color: RENKLER.hata, fontWeight: '700', fontSize: 13 },
  });
}
