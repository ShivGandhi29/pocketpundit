import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Text } from '@/components/AppText';

import { ButtonLabel, OutlinePillBorder } from '@/constants/onboardingTheme';
import { Colors, Elevation, Radius, Spacing } from '@/constants/theme';
import { Fonts } from '@/constants/fonts';

// Full-pill button with an uppercase, wide-tracked label — see
// onboardingTheme.ts for where this geometry comes from. `primary` carries a
// heavy drop shadow (the accent fill alone doesn't read as "elevated" on a
// near-black background); `outline` is a borderless-card alternative to a
// second solid button for secondary actions like "Back".
export function PillButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  style,
  accessibilityLabel,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'outline';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' ? styles.primary : styles.outline,
        variant === 'primary' && !disabled ? Elevation.high : null,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      <Text style={[styles.label, variant === 'primary' ? styles.labelPrimary : styles.labelOutline]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.s5,
  },
  primary: { backgroundColor: Colors.accent },
  outline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: OutlinePillBorder },
  disabled: { opacity: 0.4 },
  pressed: { opacity: 0.85 },
  label: {
    fontSize: ButtonLabel.fontSize,
    letterSpacing: ButtonLabel.letterSpacing,
    textTransform: ButtonLabel.textTransform,
    fontFamily: Fonts.bold,
    fontWeight: '700',
  },
  labelPrimary: { color: Colors.onAccent },
  labelOutline: { color: Colors.text },
});
