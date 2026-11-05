import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Siyah zemin, köşelerde altın parıltı: uygulamanın referans görsellerindeki kimlik.
const ALTIN = 'rgba(255,198,26,0.16)';
const SEFFAF = 'rgba(255,198,26,0)';

export default function NeonParilti() {
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <LinearGradient colors={[ALTIN, SEFFAF]} start={{ x: 1, y: 0 }} end={{ x: 0.45, y: 0.3 }} style={StyleSheet.absoluteFillObject} />
      <LinearGradient colors={[SEFFAF, ALTIN]} start={{ x: 0.55, y: 0.72 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFillObject} />
    </View>
  );
}
