import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useRenkler } from '../../constants/theme';
import { kategoriAdi, tamGorselUrl, zamanFormatla } from '../../constants/forum';

export default function BaslikKarti({ baslik: b, islemler }) {
  const RENKLER = useRenkler();
  const styles = olusturStyles(RENKLER);
  const router = useRouter();
  const { oyla, kaydet, menuAc, benimId } = islemler;

  return (
    <View style={[styles.kart, b.isPinned && { borderColor: RENKLER.vurgu2 }]}>
      <Pressable onPress={() => oyla(b)} style={styles.oySutunu} accessibilityRole="button" accessibilityLabel="Yukarı oyla">
        <Text style={[styles.oyOk, b.voted && { color: RENKLER.vurgu }]}>▲</Text>
        <Text style={[styles.oySayi, b.voted && { color: RENKLER.vurgu }]}>{b.voteCount}</Text>
      </Pressable>
      <Pressable onPress={() => router.push(`/forum/${b.id}`)} onLongPress={() => menuAc(b)} style={styles.icerik}>
        <View style={styles.ustSatir}>
          <Text style={styles.kategori}>{kategoriAdi(b.category)}</Text>
          {b.isPinned ? <Text style={styles.etiket}>📌 Sabit</Text> : null}
          {b.isLocked ? <Text style={styles.etiket}>🔒 Kilitli</Text> : null}
          {b.hasPoll ? <Text style={styles.etiket}>📊 Anket</Text> : null}
        </View>
        <Text style={styles.baslik} numberOfLines={3}>{b.title}</Text>
        {b.imageUrl ? <Image source={{ uri: tamGorselUrl(b.imageUrl) }} style={styles.gorsel} resizeMode="cover" /> : null}
        <View style={styles.altSatir}>
          <Text style={[styles.yazar, b.isAdmin && { color: RENKLER.uyari }]} numberOfLines={1}>
            {b.isAdmin ? '🛡️ ' : ''}{b.authorName} · {zamanFormatla(b.createdAt)}
          </Text>
          <Text style={styles.yorum}>💬 {b.commentCount}</Text>
          <Pressable onPress={() => kaydet(b)} hitSlop={10} accessibilityRole="button" accessibilityLabel={b.saved ? 'Kaydı kaldır' : 'Kaydet'}>
            <Text style={[styles.kaydet, b.saved && { color: RENKLER.vurgu2 }]}>{b.saved ? '★' : '☆'}</Text>
          </Pressable>
          {b.userId !== benimId ? (
            <Pressable onPress={() => menuAc(b)} hitSlop={10} accessibilityRole="button" accessibilityLabel="Şikayet et veya engelle">
              <Text style={styles.menu}>•••</Text>
            </Pressable>
          ) : null}
        </View>
      </Pressable>
    </View>
  );
}

function olusturStyles(RENKLER) {
  return StyleSheet.create({
    kart: { flexDirection: 'row', backgroundColor: RENKLER.bg2, borderRadius: 14, borderWidth: 1, borderColor: RENKLER.ayrici, overflow: 'hidden' },
    oySutunu: { width: 48, alignItems: 'center', paddingTop: 14, backgroundColor: RENKLER.bg3 },
    oyOk: { fontSize: 15, color: RENKLER.metinIkincil },
    oySayi: { fontSize: 14, fontWeight: '800', color: RENKLER.metinIkincil, marginTop: 4 },
    icerik: { flex: 1, padding: 12 },
    ustSatir: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
    kategori: { fontSize: 11, fontWeight: '700', color: RENKLER.vurgu2 },
    etiket: { fontSize: 11, fontWeight: '600', color: RENKLER.metinIkincil },
    baslik: { fontSize: 15.5, fontWeight: '800', color: RENKLER.metin, marginTop: 4, lineHeight: 20 },
    gorsel: { width: '100%', height: 150, borderRadius: 10, marginTop: 10, backgroundColor: RENKLER.bg3 },
    altSatir: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 10 },
    yazar: { flex: 1, fontSize: 11.5, color: RENKLER.metinIkincil },
    yorum: { fontSize: 12, fontWeight: '700', color: RENKLER.metinIkincil },
    kaydet: { fontSize: 17, color: RENKLER.metinIkincil },
    menu: { fontSize: 11, color: RENKLER.metinIkincil, letterSpacing: 1 },
  });
}
