import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Radius, Spacing } from '@/constants/theme';
import type { League } from '@/types/pocketpundit';

export function LeaguePicker({
  leagues,
  preselected,
  onContinue,
}: {
  leagues: League[];
  preselected: string[];
  onContinue: (selectedIds: string[]) => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(preselected));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Text style={styles.title}>Pick your leagues</Text>
      <Text style={styles.subtitle}>Only matchups from these leagues will show up in your feed.</Text>
      <View style={styles.list}>
        {leagues.map((league) => {
          const checked = selected.has(league.id);
          return (
            <Pressable
              key={league.id}
              onPress={() => toggle(league.id)}
              style={({ pressed }) => [styles.row, checked && styles.rowChecked, pressed && styles.pressed]}
            >
              <View style={[styles.checkbox, checked && styles.checkboxChecked]} />
              <Text style={styles.rowLabel}>{league.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <Pressable
        disabled={selected.size === 0}
        onPress={() => onContinue(Array.from(selected))}
        style={({ pressed }) => [
          styles.continueBtn,
          selected.size === 0 && styles.continueBtnDisabled,
          pressed && selected.size > 0 && styles.pressed,
        ]}
      >
        <Text style={styles.continueBtnText}>Continue</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: Spacing.s4 },
  title: { color: Colors.text, fontSize: 26, fontWeight: '700', letterSpacing: -0.4, marginBottom: Spacing.s1 },
  subtitle: { color: Colors.textMuted, fontSize: 15, marginBottom: Spacing.s4 },
  list: { gap: Spacing.s2 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s3,
    minHeight: 56,
    paddingHorizontal: Spacing.s3,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
  },
  rowChecked: { borderColor: Colors.accent, backgroundColor: Colors.surfaceRaised },
  rowLabel: { color: Colors.text, fontSize: 16, fontWeight: '600' },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: Colors.border },
  checkboxChecked: { borderColor: Colors.accent, backgroundColor: Colors.accent },
  continueBtn: {
    marginTop: Spacing.s4,
    minHeight: 48,
    borderRadius: Radius.sm,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueBtnDisabled: { opacity: 0.4 },
  continueBtnText: { color: Colors.onAccent, fontWeight: '700', fontSize: 15 },
  pressed: { opacity: 0.85 },
});
