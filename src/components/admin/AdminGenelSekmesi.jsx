import { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useRenkler, FONT } from '../../constants/theme';
import KesikPanel from '../KesikPanel';
import { Buton, useAdminStil } from './adminOrtak';

const KUTULAR = [
  { k: 'users', e: 'Üye' },
  { k: 'usersToday', e: 'Bugün katılan' },
  { k: 'threads', e: 'Başlık' },
  { k: 'comments', e: 'Yorum' },
  { k: 'pendingReports', e: 'Bekleyen şikayet' },
  { k: 'banned', e: 'Yasaklı' },
  { k: 'sbcs', e: 'SBC' },
  { k: 'evolutions', e: 'Evrim' },
  { k: 'cards', e: 'Kart' },
];

/** Genel bakış: sayılar ve normal uygulamaya (admin yetkisiyle) geçiş. */
export default function AdminGenelSekmesi() {
  const RENKLER = useRenkler();
  const st = useAdminStil();
  const panelDegistir = useAuthStore((s) => s.panelDegistir);
  const [veri, setVeri] = useState(null);
  const [hata, setHata] = useState(null);
  const [yenileniyor, setYenileniyor] = useState(false);

  const yukle = useCallback(async () => {
    try {
      setVeri(await api.adminStats());
      setHata(null);
    } catch (err) {
      setHata(err.message);
    }
  }, []);

  useEffect(() => { yukle(); }, [yukle]);

  return (
    <ScrollView
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={yenileniyor} onRefresh={async () => { setYenileniyor(true); await yukle(); setYenileniyor(false); }} tintColor={RENKLER.vurgu} />}
    >
      <Text style={st.bolum}>GENEL BAKIŞ</Text>
      {hata ? <Text style={st.hata}>{hata}</Text> : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
        {KUTULAR.map((b) => (
          <KesikPanel key={b.k} kesik={10} vurgulu={b.k === 'pendingReports' && veri?.pendingReports > 0} style={{ width: '31.5%', padding: 10 }}>
            <Text style={{ fontFamily: FONT.dev, fontSize: 26, color: RENKLER.metin }}>{veri ? (veri[b.k] ?? 0).toLocaleString('tr-TR') : '–'}</Text>
            <Text style={{ fontFamily: FONT.etiket, fontSize: 11.5, letterSpacing: 0.8, color: RENKLER.metinIkincil }}>{b.e.toLocaleUpperCase('tr-TR')}</Text>
          </KesikPanel>
        ))}
      </View>

      <Text style={[st.bolum, { marginTop: 22 }]}>UYGULAMA</Text>
      <Text style={[st.satirAlt, { marginTop: 6 }]}>
        Uygulamayı yönetici olarak kullan: forumda her başlığı ve yorumu düzenleyebilir, silebilir, sabitleyebilir, kilitleyebilir, üyeleri yasaklayabilirsin.
        Profil sekmesinden tekrar bu panele dönebilirsin.
      </Text>
      <Buton metin="Uygulamaya geç" onPress={() => panelDegistir('member')} style={{ marginTop: 12 }} />
    </ScrollView>
  );
}
