import { Modal, View, Text, Pressable, Image, ActivityIndicator, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { useRenkler } from '../../constants/theme';

const EKRAN_GENISLIK = Dimensions.get('window').width;
const ONIZLEME_GENISLIK = Math.min(EKRAN_GENISLIK - 80, 300);

/** The picker → preview → share/save modal driven by usePaylasAkisi. */
export default function PaylasAkisiModal({ akis }) {
  const RENKLER = useRenkler();
  const styles = olusturStyles(RENKLER);
  if (!akis.acik) return null;

  const onizlemeYukseklik = akis.onizlemeBoyut
    ? ONIZLEME_GENISLIK * (akis.onizlemeBoyut.h / akis.onizlemeBoyut.w)
    : ONIZLEME_GENISLIK;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={akis.kapat}>
      <View style={styles.arkaPlan}>
        <View style={styles.kutu}>
          <View style={styles.ustSatir}>
            <Text style={styles.baslik}>
              {!akis.secim ? 'Paylaşım Görseli Seç' : (akis.sablonlar[akis.secim]?.baslik || 'Önizleme')}
            </Text>
            <Pressable onPress={akis.kapat} hitSlop={10}>
              <Text style={styles.kapatButon}>✕</Text>
            </Pressable>
          </View>

          {!akis.secim ? (
            <View style={styles.sablonGrid}>
              {akis.anahtarlar.map((key) => {
                const s = akis.sablonlar[key];
                return (
                  <Pressable key={key} onPress={() => akis.sablonSec(key)} style={styles.sablonKutu}>
                    <Text style={styles.sablonEmoji}>{s.emoji}</Text>
                    <Text style={styles.sablonBaslik}>{s.baslik}</Text>
                  </Pressable>
                );
              })}
            </View>
          ) : akis.yukleniyor ? (
            <View style={{ paddingVertical: 60, alignItems: 'center' }}>
              <ActivityIndicator color={RENKLER.vurgu} />
              <Text style={styles.yukleniyorMetin}>Görsel oluşturuluyor...</Text>
            </View>
          ) : akis.onizlemeUri ? (
            <>
              <ScrollView style={{ maxHeight: 440 }} contentContainerStyle={{ alignItems: 'center', paddingVertical: 12 }}>
                <Image
                  source={{ uri: akis.onizlemeUri }}
                  style={{ width: ONIZLEME_GENISLIK, height: onizlemeYukseklik, borderRadius: 12 }}
                  resizeMode="contain"
                />
              </ScrollView>
              <View style={styles.butonSatiri}>
                {!akis.tekSablonMu ? (
                  <Pressable onPress={akis.geriDon} style={styles.ikincilButon} hitSlop={8}>
                    <Text style={styles.ikincilButonMetin}>‹ Başka Şablon</Text>
                  </Pressable>
                ) : null}
                <Pressable onPress={akis.kaydet} disabled={akis.kaydediliyor} style={[styles.anaButon, { backgroundColor: RENKLER.bg3 }]}>
                  {akis.kaydediliyor ? <ActivityIndicator size="small" color={RENKLER.metin} /> : <Text style={styles.anaButonMetin}>💾 Kaydet</Text>}
                </Pressable>
                <Pressable onPress={akis.paylas} style={[styles.anaButon, { backgroundColor: RENKLER.vurgu }]}>
                  <Text style={[styles.anaButonMetin, { color: RENKLER.bg }]}>📤 Paylaş</Text>
                </Pressable>
              </View>
            </>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

function olusturStyles(RENKLER) {
  return StyleSheet.create({
    arkaPlan: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 },
    kutu: { backgroundColor: RENKLER.bg2, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: RENKLER.ayrici },
    ustSatir: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    baslik: { fontSize: 15, fontWeight: '800', color: RENKLER.metin },
    kapatButon: { fontSize: 18, color: RENKLER.metinIkincil, padding: 4 },
    sablonGrid: { flexDirection: 'row', gap: 12, marginTop: 18 },
    sablonKutu: { flex: 1, backgroundColor: RENKLER.bg3, borderRadius: 14, paddingVertical: 24, alignItems: 'center', borderWidth: 1, borderColor: RENKLER.ayrici },
    sablonEmoji: { fontSize: 30 },
    sablonBaslik: { fontSize: 12.5, fontWeight: '700', color: RENKLER.metin, marginTop: 8 },
    yukleniyorMetin: { color: RENKLER.metinIkincil, fontSize: 12, marginTop: 10 },
    butonSatiri: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
    anaButon: { flex: 1, borderRadius: 12, paddingVertical: 13, alignItems: 'center', justifyContent: 'center' },
    anaButonMetin: { fontWeight: '800', fontSize: 13, color: RENKLER.metin },
    ikincilButon: { paddingHorizontal: 6, paddingVertical: 8 },
    ikincilButonMetin: { color: RENKLER.metinIkincil, fontSize: 11.5, fontWeight: '700' },
  });
}
