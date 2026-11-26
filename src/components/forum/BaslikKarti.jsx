import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useRenkler, FONT } from '../../constants/theme';
import KesikPanel from '../KesikPanel';
import { kategoriAdi, tamGorselUrl, zamanFormatla } from '../../constants/forum';
import YazarSatiri from './YazarSatiri';
import Avatar from './Avatar';
import OyGrubu from './OyGrubu';
import ForumMetin from './ForumMetin';
import OyuncuKarti from '../OyuncuKarti';

export default function BaslikKarti({ baslik: b, islemler }) {
  const RENKLER = useRenkler();
  const styles = olusturStyles(RENKLER);
  const router = useRouter();
  const { oyla, kaydet, menuAc, benimId } = islemler;
  const benim = b.userId === benimId;

  return (
    <KesikPanel onPress={() => router.push(`/forum/${b.id}`)} onLongPress={() => menuAc(b)} vurgulu={b.isPinned} parilti={b.isPinned} style={styles.kart}>
      <View style={styles.ustSatir}>
        <Avatar ad={b.authorName} yetkili={b.isAdmin || b.isModerator} />
        <View style={{ flex: 1 }}>
          <View style={styles.yazarSatir}>
            <YazarSatiri ad={b.authorName} isAdmin={b.isAdmin} isModerator={b.isModerator} isVip={b.isVip} isAffiliate={b.isAffiliate} rozet={b.badge} />
            <Text style={styles.zaman} numberOfLines={1}>· {zamanFormatla(b.createdAt)}</Text>
          </View>
          <View style={styles.etiketSatir}>
            <Text style={styles.kategori}>{kategoriAdi(b.category).toLocaleUpperCase('tr-TR')}</Text>
            {b.isPinned ? <Text style={styles.etiket}>📌 Sabit</Text> : null}
            {b.isLocked ? <Text style={styles.etiket}>🔒 Kilitli</Text> : null}
            {b.hasPoll ? <Text style={styles.etiket}>📊 Anket</Text> : null}
          </View>
        </View>
        {!benim ? (
          <Pressable onPress={() => menuAc(b)} hitSlop={12} accessibilityRole="button" accessibilityLabel="Şikayet et veya engelle">
            <Text style={styles.menu}>•••</Text>
          </Pressable>
        ) : null}
      </View>

      <Text style={styles.baslik} numberOfLines={3}>{b.title}</Text>
      {b.body ? <ForumMetin style={styles.govde} numberOfLines={2}>{b.body}</ForumMetin> : null}

      {b.imageUrls.length > 0 ? (
        <View>
          <Image source={{ uri: tamGorselUrl(b.imageUrls[0]) }} style={styles.gorsel} resizeMode="cover" />
          {b.imageUrls.length > 1 ? <Text style={styles.gorselSayi}>+{b.imageUrls.length - 1}</Text> : null}
        </View>
      ) : null}
      {b.players.length > 0 ? (
        <View style={styles.kartlar}>
          {b.players.map((p) => (
            <OyuncuKarti key={p.futggId} yuzUrl={p.imageUrl} isim={p.name} nadirlik={p.rarity} rating={p.rating} pozisyon={p.position} genislik={b.imageUrls.length > 0 ? 64 : 92} />
          ))}
        </View>
      ) : null}

      <View style={styles.altSatir}>
        <OyGrubu sayi={b.voteCount} oyum={b.myVote} onOy={(d) => oyla(b, d)} kapali={benim} />
        <Text style={styles.yorum}>💬 {b.commentCount}</Text>
        <View style={{ flex: 1 }} />
        <Pressable onPress={() => kaydet(b)} hitSlop={12} accessibilityRole="button" accessibilityLabel={b.saved ? 'Kaydı kaldır' : 'Kaydet'}>
          <Text style={[styles.kaydet, b.saved && { color: RENKLER.vurgu }]}>{b.saved ? '★' : '☆'}</Text>
        </Pressable>
      </View>
    </KesikPanel>
  );
}

function olusturStyles(RENKLER) {
  return StyleSheet.create({
    kart: { padding: 13 },
    ustSatir: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    yazarSatir: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    zaman: { fontSize: 11, color: RENKLER.metinIkincil },
    etiketSatir: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 2 },
    kategori: { fontFamily: FONT.etiket, fontSize: 12.5, letterSpacing: 1, color: RENKLER.vurgu },
    etiket: { fontSize: 11, fontWeight: '600', color: RENKLER.metinIkincil },
    menu: { fontSize: 12, color: RENKLER.metinIkincil, letterSpacing: 1 },
    baslik: { fontFamily: FONT.baslik, fontSize: 21, color: RENKLER.metin, marginTop: 9, lineHeight: 23 },
    govde: { fontSize: 13.5, color: RENKLER.metinIkincil, marginTop: 5, lineHeight: 19 },
    kartlar: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 12 },
    gorsel: { width: '100%', height: 170, borderRadius: 4, marginTop: 12, backgroundColor: RENKLER.bg3 },
    gorselSayi: { position: 'absolute', right: 8, bottom: 8, color: '#fff', fontSize: 12, fontWeight: '800', backgroundColor: 'rgba(0,0,0,0.65)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, overflow: 'hidden' },
    altSatir: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
    yorum: { fontSize: 13, fontWeight: '700', color: RENKLER.metinIkincil },
    kaydet: { fontSize: 19, color: RENKLER.metinIkincil },
  });
}
