import { Platform } from 'react-native';

// Weight-to-family map for Roboto (embedded at build time via the
// expo-font config plugin in app.json — see its `fonts` list for exactly
// which static weight files are bundled). React Native doesn't synthesize
// weights from a single variable font file the way CSS does, so each weight
// actually used in the app needs its own named family here.
//
// The string a custom font must be referenced by differs by platform, and
// neither one is the npm package's own export name:
// - iOS matches by the font's real internal PostScript name (read directly
//   from its `name` table) — e.g. "Roboto_800ExtraBold.ttf" is internally
//   named "Roboto-ExtraBold". Get this wrong and iOS silently falls back to
//   the system font instead of erroring, which is exactly what happened
//   here before this was split by platform.
// - Android matches by the asset file's own name instead (verified live on
//   the emulator: the PostScript-name strings above did nothing there) —
//   e.g. the same file needs "Roboto_800ExtraBold", not "Roboto-ExtraBold".
function fontFamily(iosName: string, androidName: string): string {
  return Platform.OS === 'ios' ? iosName : androidName;
}

export const Fonts = {
  regular: fontFamily('Roboto-Regular', 'Roboto_400Regular'),
  semibold: fontFamily('Roboto-SemiBold', 'Roboto_600SemiBold'),
  bold: fontFamily('Roboto-Bold', 'Roboto_700Bold'),
  extrabold: fontFamily('Roboto-ExtraBold', 'Roboto_800ExtraBold'),
  // Single-weight chunky rounded display face, used only for the "Huddl"
  // wordmark itself — kept separate from the rest of the app's type (Roboto)
  // so the brand mark reads as a deliberate identity choice rather than
  // just another text style.
  wordmark: fontFamily('LilitaOne', 'LilitaOne_400Regular'),
} as const;
