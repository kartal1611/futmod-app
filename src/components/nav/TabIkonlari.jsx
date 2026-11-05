import Svg, { Path, Circle } from 'react-native-svg';

// Neon outline icon set for the bottom tab bar — thin single-color stroke,
// no fills except the small accent marks (dots), matching the reference
// look: line-art glyphs that glow via the wrapping TabIkonu's shadow rather
// than any fill/gradient baked into the SVG itself.

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

export function ContentIkonu({ renk, boyut = 24 }) {
  return (
    <Svg width={boyut} height={boyut} viewBox="0 0 24 24" fill="none">
      <Path d="M5 5.5h14a1.5 1.5 0 0 1 1.5 1.5v12A1.5 1.5 0 0 1 19 20.5H5A1.5 1.5 0 0 1 3.5 19V7A1.5 1.5 0 0 1 5 5.5Z" stroke={renk} strokeWidth={1.6} />
      <Path d="M8 3.5v4M16 3.5v4M3.5 10.5h17" stroke={renk} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

export function AraIkonu({ renk, boyut = 24 }) {
  return (
    <Svg width={boyut} height={boyut} viewBox="0 0 24 24" fill="none">
      <Circle cx="10.8" cy="10.8" r="6.6" stroke={renk} strokeWidth={1.6} />
      <Path d="M15.8 15.8l4.4 4.4" stroke={renk} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

export function BildirimIkonu({ renk, boyut = 24 }) {
  return (
    <Svg width={boyut} height={boyut} viewBox="0 0 24 24" fill="none">
      <Path d="M6 10a6 6 0 0 1 12 0c0 6 2.5 7 2.5 7h-17S6 16 6 10Z" stroke={renk} strokeWidth={1.6} strokeLinejoin="round" />
      <Path d="M10 20.5a2.2 2.2 0 0 0 4 0" stroke={renk} strokeWidth={1.6} strokeLinecap="round" />
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
