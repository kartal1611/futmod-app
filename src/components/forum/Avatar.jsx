import { View, Text } from 'react-native';
import { useRenkler } from '../../constants/theme';

/** Round initial for a member; staff get the accent ring. */
export default function Avatar({ ad, boyut = 36, yetkili = false }) {
  const RENKLER = useRenkler();
  return (
    <View style={{
      width: boyut, height: boyut, borderRadius: boyut / 2, alignItems: 'center', justifyContent: 'center',
      backgroundColor: RENKLER.bg3, borderWidth: 1.5, borderColor: yetkili ? RENKLER.vurgu : RENKLER.ayrici,
    }}>
      <Text style={{ fontSize: boyut * 0.42, fontWeight: '900', color: yetkili ? RENKLER.vurgu : RENKLER.metin }}>
        {String(ad || '?').charAt(0).toLocaleUpperCase('tr')}
      </Text>
    </View>
  );
}
