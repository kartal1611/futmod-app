import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, Pattern, Path, Rect } from 'react-native-svg';

// Koyu zemin, ince çapraz çizgi dokusu ve sol üstte sıcak altın ışık (Torunbot paneli tarzı).
const ALTIN = 'rgba(244,194,77,0.14)';
const SEFFAF = 'rgba(244,194,77,0)';

export default function NeonParilti() {
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <Svg style={StyleSheet.absoluteFillObject} width="100%" height="100%">
        <Defs>
          <Pattern id="cizgi" width="14" height="14" patternUnits="userSpaceOnUse">
            <Path d="M-2 16L16 -2" stroke="#ffffff" strokeOpacity="0.028" strokeWidth="1.2" />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#cizgi)" />
      </Svg>
      <LinearGradient colors={[ALTIN, SEFFAF]} start={{ x: 0, y: 0 }} end={{ x: 0.6, y: 0.32 }} style={StyleSheet.absoluteFillObject} />
    </View>
  );
}
