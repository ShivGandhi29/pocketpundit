import { Ionicons } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { Colors, Radius } from '@/constants/theme';

// GlassView renders Apple's iOS 26 Liquid Glass material and falls back to a
// plain (transparent) View on older iOS, Android, and web on its own — no
// Platform check needed here. Reserved for chrome/controls per Apple HIG
// ("apply Liquid Glass to navigation and controls, keep content on its own
// layer"), not for dense content surfaces like game cards or stat tables.
export function GlassIconButton({
  name,
  size = 22,
  color = Colors.text,
  active = false,
  disabled = false,
  onPress,
  accessibilityLabel,
  hitSlop = 12,
}: {
  name: ComponentProps<typeof Ionicons>['name'];
  size?: number;
  color?: string;
  active?: boolean;
  disabled?: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
  hitSlop?: number;
}) {
  return (
    // The glass element's own bounds clip its interactive press-bloom
    // animation — a *surrounding* Pressable/View with extra padding doesn't
    // help, since the bloom is rendered inside the GlassView's own native
    // layer and clips to that layer's frame regardless of parent size. The
    // fix is to make the GlassView itself bigger than the icon needs (icon
    // stays visually the same size, just inset with more room around it),
    // not to pad something outside it. The native isInteractive animation
    // already supplies press feedback, so no manual opacity-on-press either.
    <Pressable onPress={onPress} disabled={disabled} hitSlop={hitSlop} accessibilityLabel={accessibilityLabel}>
      <GlassView
        glassEffectStyle="regular"
        isInteractive
        tintColor={active ? Colors.accent : undefined}
        style={[styles.circle, disabled && styles.disabled]}
      >
        <Ionicons name={name} size={size} color={active ? Colors.onAccent : color} />
      </GlassView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  circle: { width: 48, height: 48, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.35 },
});
