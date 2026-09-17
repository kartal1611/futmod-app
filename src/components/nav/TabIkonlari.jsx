import Svg, { Path, Circle, Text as SvgText } from 'react-native-svg';

// Neon outline icon set for the bottom tab bar — thin single-color stroke,
// no fills except the small accent marks (star, dots), matching the
// reference look: line-art glyphs that glow via the wrapping TabIkonu's
// shadow rather than any fill/gradient baked into the SVG itself.

export function AnaSayfaIkonu({ renk, boyut = 24 }) {
  return (
    <Svg width={boyut} height={boyut} viewBox="0 0 24 24" fill="none">
      <Path d="M3 15.2c0-3.4 4-6.1 9-6.1s9 2.7 9 6.1" stroke={renk} strokeWidth={1.6} strokeLinecap="round" />
      <Path d="M3 15.2V17c0 1.9 4 3.4 9 3.4s9-1.5 9-3.4v-1.8" stroke={renk} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 9.1V4.6M7.2 10V6.3M16.8 10V6.3" stroke={renk} strokeWidth={1.4} strokeLinecap="round" />
      <Path d="M12 4.6l2.4 1.4-2.4 1.3V4.6ZM7.2 6.3l2 1.2-2 1V6.3ZM16.8 6.3l2 1.2-2 1V6.3Z" fill={renk} />
    </Svg>
  );
}

export function SbcIkonu({ renk, boyut = 24 }) {
  return (
    <Svg width={boyut} height={boyut} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2.8l6.5 2.3v5c0 4.4-2.8 7.8-6.5 9.1-3.7-1.3-6.5-4.7-6.5-9.1v-5L12 2.8Z" stroke={renk} strokeWidth={1.6} strokeLinejoin="round" />
      <SvgText x="12" y="12.3" fontSize="6.5" fontWeight="800" fill={renk} textAnchor="middle">UT</SvgText>
      <Circle cx="16" cy="15.2" r="3" fill="#000" stroke={renk} strokeWidth={1.2} />
      <Path d="M14.6 15.2l1 1 1.9-2.1" stroke={renk} strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function CoinIkonu({ renk, boyut = 24 }) {
  return (
    <Svg width={boyut} height={boyut} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="8.7" stroke={renk} strokeWidth={1.6} />
      <Circle cx="12" cy="12" r="6.9" stroke={renk} strokeWidth={0.9} opacity={0.55} />
      <SvgText x="12" y="15.2" fontSize="7.2" fontWeight="900" fontStyle="italic" fill={renk} textAnchor="middle">FC</SvgText>
    </Svg>
  );
}

export function PuanlarimIkonu({ renk, boyut = 24 }) {
  return (
    <Svg width={boyut} height={boyut} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2.4l8.2 4.7v9.8L12 21.6l-8.2-4.7V7.1L12 2.4Z" stroke={renk} strokeWidth={1.6} strokeLinejoin="round" />
      <Path d="M12 6.6l1.1 2.2 2.45.35-1.77 1.73.42 2.44L12 12.15l-2.2 1.17.42-2.44-1.77-1.73 2.45-.35L12 6.6Z" fill={renk} />
      <SvgText x="12" y="18.6" fontSize="5" fontWeight="800" fill={renk} textAnchor="middle">XP</SvgText>
    </Svg>
  );
}

export function ForumIkonu({ renk, boyut = 24 }) {
  return (
    <Svg width={boyut} height={boyut} viewBox="0 0 24 24" fill="none">
      <Path d="M3.4 5.8A2 2 0 0 1 5.4 3.8h7A2 2 0 0 1 14.4 5.8v4.8A2 2 0 0 1 12.4 12.6H9l-2.9 2.3a.4.4 0 0 1-.65-.31V12.6H5.4A2 2 0 0 1 3.4 10.6V5.8Z" stroke={renk} strokeWidth={1.4} strokeLinejoin="round" />
      <Path d="M9.6 9.7A2 2 0 0 1 11.6 7.7h5.9A2 2 0 0 1 19.5 9.7v3.9a2 2 0 0 1-2 2h-.4v2a.4.4 0 0 1-.65.31L14 15.6h-2.4a2 2 0 0 1-2-2V9.7Z" stroke={renk} strokeWidth={1.4} strokeLinejoin="round" />
      <Circle cx="6.6" cy="7.9" r="0.55" fill={renk} />
      <Circle cx="8.9" cy="7.9" r="0.55" fill={renk} />
      <Circle cx="11.2" cy="7.9" r="0.55" fill={renk} />
    </Svg>
  );
}

export function IletisimIkonu({ renk, boyut = 24 }) {
  return (
    <Svg width={boyut} height={boyut} viewBox="0 0 24 24" fill="none">
      <Path d="M4.2 13.2v-1.4a7.8 7.8 0 0 1 15.6 0v1.4" stroke={renk} strokeWidth={1.6} strokeLinecap="round" />
      <Path d="M3.2 13.6a1.6 1.6 0 0 1 1.6-1.6h.6a1.6 1.6 0 0 1 1.6 1.6v3.2a1.6 1.6 0 0 1-1.6 1.6h-.6a1.6 1.6 0 0 1-1.6-1.6v-3.2ZM17 13.6a1.6 1.6 0 0 1 1.6-1.6h.6a1.6 1.6 0 0 1 1.6 1.6v3.2a1.6 1.6 0 0 1-1.6 1.6h-.6A1.6 1.6 0 0 1 17 16.8v-3.2Z" stroke={renk} strokeWidth={1.5} />
      <Path d="M19.2 18.4v.5a2.3 2.3 0 0 1-2.3 2.3h-2.2" stroke={renk} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

export function KadroYorumIkonu({ renk, boyut = 24 }) {
  return (
    <Svg width={boyut} height={boyut} viewBox="0 0 24 24" fill="none">
      <Path d="M3.5 5.5A1.8 1.8 0 0 1 5.3 3.7h11.4A1.8 1.8 0 0 1 18.5 5.5v9A1.8 1.8 0 0 1 16.7 16.3H9.3l-3.6 2.6a.4.4 0 0 1-.64-.32v-2.28H5.3A1.8 1.8 0 0 1 3.5 14.5v-9Z" stroke={renk} strokeWidth={1.5} strokeLinejoin="round" />
      <Circle cx="7.6" cy="8.7" r="1.15" stroke={renk} strokeWidth={1.2} />
      <Path d="M4.6 13l3.2-3 2.3 2.1 2.9-3.4 3.9 4.3" stroke={renk} strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ProfilIkonu({ renk, boyut = 24 }) {
  return (
    <Svg width={boyut} height={boyut} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="8.6" stroke={renk} strokeWidth={1.6} />
      <Circle cx="12" cy="9.6" r="2.7" stroke={renk} strokeWidth={1.6} />
      <Path d="M5.7 18.2c1.25-2.65 3.75-4.1 6.3-4.1s5.05 1.45 6.3 4.1" stroke={renk} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}
