import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';

// Kullanıcının referans görseline birebir: sol üstte mor/mavi, sağ altta
// pembe/magenta neon parıltı + devre çizgileri, koyu lacivert-siyah zemin
// üzerinde. Tema rengiyle değil, bu sabit iki tonla çalışıyor (vurgu rengi
// ayrı, sadece butonlar/rozetler için kalıyor).
const MOR = '#7c3aed';
const PEMBE = '#ec1cae';
const KOSE_BOYUT = 220;

function KoseCizgiler({ renk, ayna }) {
  return (
    <Svg width={KOSE_BOYUT} height={KOSE_BOYUT} viewBox="0 0 220 220" style={ayna ? { transform: [{ scaleX: -1 }, { scaleY: -1 }] } : undefined}>
      <Path d="M-10,50 L50,50 L78,78 L138,78 L165,105" stroke={renk} strokeWidth={16} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={0.4} />
      <Path d="M-10,50 L50,50 L78,78 L138,78 L165,105" stroke="#f5f3ff" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={0.95} />
      <Path d="M-10,110 L22,110 L38,126 L38,175" stroke={renk} strokeWidth={13} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={0.35} />
      <Path d="M-10,110 L22,110 L38,126 L38,175" stroke="#f5f3ff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={0.85} />
      <Circle cx={165} cy={105} r={7} fill={renk} opacity={1} />
      <Circle cx={38} cy={175} r={5} fill={renk} opacity={0.85} />
      <Circle cx={138} cy={78} r={4} fill={renk} opacity={0.7} />
    </Svg>
  );
}

/**
 * Ekranın tamamını (görünen viewport'un tamamı, StyleSheet.absoluteFillObject
 * ile) kaplayan iki ayrı dikey LinearGradient: üstteki mor tondan başlayıp
 * aşağı soluklaşarak iniyor, alttaki de simetrik şekilde aşağıdan pembe
 * tona kalınlaşıyor — ikisi ekranın TAMAMI yüksekliğinde (build #14'teki
 * gibi sabit 340px'lik bir şerit değil), üst üste binerek ortada ikisi de
 * soluk kalıyor. Bilerek en basit, daha önce build #11-14'te GERÇEKTEN
 * görünür olduğu doğrulanmış 3-durak/dikey desene sadık kalındı — bir
 * önceki denemede (çok durak + köşegen yön + iç içe geçen 00-alfa
 * duraklar) gradyan tamamen görünmez hale gelmişti (ekran görüntüsünde
 * sadece köşe süs çizgileri kalmış, ana renk geçişi hiç yoktu).
 */
export default function NeonParilti() {
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <LinearGradient
        colors={[`${MOR}80`, `${MOR}30`, `${MOR}00`]}
        locations={[0, 0.45, 1]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <LinearGradient
        colors={[`${PEMBE}00`, `${PEMBE}30`, `${PEMBE}80`]}
        locations={[0, 0.55, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={{ position: 'absolute', top: -10, left: -10 }}>
        <KoseCizgiler renk={MOR} />
      </View>
      <View style={{ position: 'absolute', bottom: -10, right: -10 }}>
        <KoseCizgiler renk={PEMBE} ayna />
      </View>
    </View>
  );
}
