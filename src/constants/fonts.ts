// Weight-to-family map for Montserrat (embedded at build time via the
// expo-font config plugin in app.json — see its `fonts` list for exactly
// which static weight files are bundled). React Native doesn't synthesize
// weights from a single variable font file the way CSS does, so each weight
// actually used in the app needs its own named family here.
export const Fonts = {
  regular: 'Montserrat_400Regular',
  semibold: 'Montserrat_600SemiBold',
  bold: 'Montserrat_700Bold',
  extrabold: 'Montserrat_800ExtraBold',
} as const;
