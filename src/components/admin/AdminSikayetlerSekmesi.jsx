import { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { api } from '../../services/api';
import { useRenkler, useOrtakStil } from '../../constants/theme';

const TIP_ADI = {
  forum: 'Forum mesajı',
  sbc_comment: 'SBC yorumu',
  squad_post: 'Kadro paylaşımı',
  squad_comment: 'Kadro yorumu',
  user_block: 'Kullanıcı engellendi',
};

// Apple Guideline 1.2: kullanıcı şikayetlerinin 24 saat içinde işlenmesi
// gerekiyor — bu ekran o kuyruk. İçeriği kaldır / kullanıcıyı at (ban),
// ikisini birden de yapabilirsin.
export default function AdminSikayetlerSekmesi() {
  const RENKLER = useRenkler();
  const ORTAK_STIL = useOrtakStil();
  const styles = olusturStyles(RENKLER);
  const [durum, setDurum] = useState('pending');
  const [liste, setListe] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  const yenile = () => {
    setYukleniyor(true);
    api.adminListReports(durum).then((data) => setListe(data.items || [])).finally(() => setYukleniyor(false));
  };

  useEffect(() => { yenile(); }, [durum]);

  const cozumle = (rapor, { removeContent, banUser }) => {
    const mesaj = [removeContent && 'içeriği kaldır', banUser && 'kullanıcıyı askıya al'].filter(Boolean).join(' + ') || 'yalnızca çözüldü olarak işaretle';
    Alert.alert('Şikayeti çözümle', `${mesaj}?`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Onayla',
        onPress: async () => {
          try {
            await api.adminResolveReport(rapor.id, { removeContent: !!removeContent, banUser: !!banUser });
            setListe((prev) => prev.filter((r) => r.id !== rapor.id));
          } catch (err) {
            Alert.alert('Hata', err.message || 'İşlem başarısız');
          }
        },
      },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
        {['pending', 'resolved'].map((d) => (
          <Pressable key={d} onPress={() => setDurum(d)} style={[styles.durumButon, durum === d && { backgroundColor: RENKLER.vurgu, borderColor: RENKLER.vurgu }]}>
            <Text style={[styles.durumMetin, durum === d && { color: RENKLER.bg }]}>{d === 'pending' ? 'Bekleyen' : 'Çözülen'}</Text>
          </Pressable>
        ))}
      </View>

      {yukleniyor ? (
        <ActivityIndicator color={RENKLER.vurgu} style={{ marginTop: 20 }} />
      ) : liste.length === 0 ? (
        <Text style={styles.bos}>{durum === 'pending' ? 'Bekleyen şikayet yok.' : 'Çözülmüş şikayet yok.'}</Text>
      ) : (
        liste.map((r) => (
          <View key={r.id} style={[ORTAK_STIL.kart, { marginBottom: 10 }]}>
            <Text style={styles.tip}>{TIP_ADI[r.contentType] || r.contentType}{r.contentId ? ` · #${r.contentId}` : ''}</Text>
            <Text style={styles.satir}>Şikayet eden: {r.reporterEmail || r.reporterUserId}</Text>
            <Text style={styles.satir}>İçerik sahibi: {r.ownerEmail || r.contentOwnerUserId || '—'}{r.ownerIsBanned ? ' (askıya alındı)' : ''}</Text>
            {r.reason ? <Text style={styles.sebep}>"{r.reason}"</Text> : null}
            <Text style={styles.tarih}>{new Date(r.createdAt).toLocaleString('tr-TR')}</Text>
            {durum === 'pending' && (
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                <Pressable style={[styles.aksiyon, { backgroundColor: RENKLER.bg3 }]} onPress={() => cozumle(r, {})}>
                  <Text style={styles.aksiyonMetin}>Sorun Yok, Kapat</Text>
                </Pressable>
                <Pressable style={[styles.aksiyon, { backgroundColor: RENKLER.uyari }]} onPress={() => cozumle(r, { removeContent: true })}>
                  <Text style={styles.aksiyonMetin}>İçeriği Kaldır</Text>
                </Pressable>
                <Pressable style={[styles.aksiyon, { backgroundColor: RENKLER.hata }]} onPress={() => cozumle(r, { removeContent: true, banUser: true })}>
                  <Text style={styles.aksiyonMetin}>Kaldır + Kullanıcıyı At</Text>
                </Pressable>
              </View>
            )}
          </View>
        ))
      )}
    </ScrollView>
  );
}

function olusturStyles(RENKLER) {
  return StyleSheet.create({
    durumButon: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 10, backgroundColor: RENKLER.bg2, borderWidth: 1, borderColor: RENKLER.ayrici },
    durumMetin: { color: RENKLER.metinIkincil, fontWeight: '700', fontSize: 12.5 },
    bos: { color: RENKLER.metinIkincil, fontSize: 12.5, marginTop: 20, textAlign: 'center' },
    tip: { fontSize: 13.5, fontWeight: '800', color: RENKLER.metin },
    satir: { fontSize: 12, color: RENKLER.metinIkincil, marginTop: 2 },
    sebep: { fontSize: 12.5, color: RENKLER.metin, marginTop: 6, fontStyle: 'italic' },
    tarih: { fontSize: 10.5, color: RENKLER.metinUcuncul, marginTop: 6 },
    aksiyon: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
    aksiyonMetin: { color: '#fff', fontWeight: '700', fontSize: 11.5 },
  });
}
