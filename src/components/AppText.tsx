import { Text as RNText, type TextProps } from 'react-native';

import { Fonts } from '@/constants/fonts';

// Drop-in replacement for RN's Text that defaults to Montserrat — React
// Native has no app-wide default-font mechanism, so every file that renders
// text imports this instead of 'react-native' directly. Styles that need a
// heavier weight still set their own `fontFamily` (see src/constants/fonts.ts);
// this only supplies the regular-weight fallback for everything else.
export function Text({ style, ...rest }: TextProps) {
  return <RNText style={[{ fontFamily: Fonts.regular }, style]} {...rest} />;
}
