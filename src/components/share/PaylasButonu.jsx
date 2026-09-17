import { Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

function KameraIkon({ boyut = 18 }) {
  return (
    <Svg width={boyut} height={boyut} viewBox="0 0 24 24">
      <Path
        d="M9.2 4.5 8 6H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-3l-1.2-1.5a1 1 0 0 0-.8-.5H10a1 1 0 0 0-.8.5Z"
        fill="#fff"
      />
      <Circle cx="12" cy="13" r="3.3" fill="#000" />
    </Svg>
  );
}

/** Round black "paylaşım görseli oluştur" action — drop next to a screen's own header icons. */
export default function PaylasButonu({ onPress, calisiyor }) {
  return (
    <Pressable onPress={onPress} disabled={calisiyor} hitSlop={8} style={styles.buton}>
      {calisiyor ? <ActivityIndicator size="small" color="#fff" /> : <KameraIkon />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  buton: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' },
});
