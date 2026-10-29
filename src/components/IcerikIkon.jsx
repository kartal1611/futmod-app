import { View, Text } from 'react-native';
import { useRenkler } from '../constants/theme';

// SBC/Evrim görselleri daha önce EA'nın kendi game-assets.fut.gg sunucusundan
// çekilen resmi kategori rozetleriydi (üçüncü taraf, izinsiz EA içeriği —
// Apple Guideline 5.2.1). Bunun yerine FutMod'a özgü, basit bir ikon kutusu.
const KATEGORI_EMOJI = {
  players: '🧑', upgrades: '⬆️', challenges: '🧩', icons: '👑',
  foundations: '🏗️', swaps: '🔄', evo: '🧬',
};

export default function IcerikIkon({ kategori, boyut = 56, style }) {
  const RENKLER = useRenkler();
  const emoji = KATEGORI_EMOJI[kategori] || '📋';
  return (
    <View style={[{
      width: boyut, height: boyut, borderRadius: Math.round(boyut * 0.18),
      backgroundColor: RENKLER.bg3, borderWidth: 1, borderColor: RENKLER.ayrici,
      alignItems: 'center', justifyContent: 'center',
    }, style]}>
      <Text style={{ fontSize: Math.round(boyut * 0.45) }}>{emoji}</Text>
    </View>
  );
}
