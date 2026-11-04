import { Text } from 'react-native';
import { useRenkler } from '../../constants/theme';

const BAHSETME = /(@[\p{L}\p{N}_.]{3,20})/gu;

/** Post text with @mentions picked out in the accent color. */
export default function ForumMetin({ children, style, numberOfLines }) {
  const RENKLER = useRenkler();
  const parcalar = String(children || '').split(BAHSETME);
  return (
    <Text style={style} numberOfLines={numberOfLines}>
      {parcalar.map((p, i) => (
        // split() with a capture group puts the mentions at odd positions.
        i % 2 === 1 ? <Text key={i} style={{ color: RENKLER.vurgu, fontWeight: '700' }}>{p}</Text> : p
      ))}
    </Text>
  );
}
