import { Ionicons } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';
import type { ComponentProps } from 'react';
import { Platform, Pressable, StyleSheet } from 'react-native';

import { Colors, Radius } from '@/constants/theme';

// GlassView renders Apple's iOS 26 Liquid Glass material and falls back to a
// plain (transparent) View on older iOS, Android, and web on its own — no
// Platform check needed here for the *decorative* glass look. Reserved for
// chrome/controls per Apple HIG ("apply Liquid Glass to navigation and
// controls, keep content on its own layer"), not for dense content surfaces
// like game cards or stat tables.
//
// `tintColor` is the exception: it's an iOS-only GlassView prop that a plain
// View silently drops, so the `active` accent fill needs an explicit
// non-iOS backgroundColor fallback below — without it, `onAccent` icon color
// is invisible with no accent circle behind it.
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
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={hitSlop}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled, selected: active }}
    >
      <GlassView
        glassEffectStyle="clear"
        isInteractive
        tintColor={active ? Colors.accent : undefined}
        style={[
          styles.circle,
          active && Platform.OS !== 'ios' && styles.activeFallback,
          disabled && styles.disabled,
        ]}
      >
        <Ionicons name={name} size={size} color={active ? Colors.onAccent : color} />
      </GlassView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // A rounded square, not a full circle — every icon-only control in the app
  // (back, close, settings, favorite, standings) went through this one
  // component, so a perfect circle here was the single most-repeated shape
  // in the whole UI. Radius.lg gives it Apple's own "squircle" toolbar-glyph
  // proportions (see Camera/Photos' back/close chrome) rather than the
  // generic full-pill/full-circle look, and reads as a distinct family from
  // both PillButton's full-pill CTA and the app's card-shaped content (which
  // use Radius.pill and Radius.md respectively).
  circle: { width: 48, height: 48, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center' },
  activeFallback: { backgroundColor: Colors.accent },
  disabled: { opacity: 0.35 },
});
