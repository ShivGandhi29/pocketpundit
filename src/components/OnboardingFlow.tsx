import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInRight, FadeOutLeft, FadeInLeft, FadeOutRight } from 'react-native-reanimated';

import { LeaguePicker } from '@/components/LeaguePicker';
import { TeamPicker } from '@/components/TeamPicker';
import { Colors, Spacing } from '@/constants/theme';
import type { AppState, FavoriteTeam, League } from '@/types/pocketpundit';

function StepDots({ total, current }: { total: number; current: number }) {
  if (total < 2) return null;
  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} style={[styles.dot, i === current && styles.dotActive]} />
      ))}
      <Text style={styles.dotsLabel}>
        Step {current + 1} of {total}
      </Text>
    </View>
  );
}

export function OnboardingFlow({
  leagues,
  initialState,
  onComplete,
}: {
  leagues: League[];
  initialState: AppState;
  onComplete: (next: AppState) => void;
}) {
  const [step, setStep] = useState<'leagues' | 'teams'>('leagues');
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const [selectedLeagueIds, setSelectedLeagueIds] = useState<string[]>(initialState.selectedLeagueIds);

  // Favoriting a team makes no sense for motorsport (drivers, not teams), so
  // the second step only exists when at least one selected league has teams
  // to show. Selecting only F1/IndyCar/NASCAR finishes onboarding right away.
  const teamLeagues = leagues.filter((l) => selectedLeagueIds.includes(l.id) && l.kind === 'team');
  const totalSteps = teamLeagues.length > 0 ? 2 : 1;

  if (step === 'leagues') {
    return (
      <Animated.View
        key="leagues"
        style={styles.flex}
        entering={direction === 'back' ? FadeInLeft.duration(220) : undefined}
        exiting={FadeOutLeft.duration(160)}
      >
        <StepDots total={totalSteps} current={0} />
        <LeaguePicker
          leagues={leagues}
          preselected={selectedLeagueIds}
          onContinue={(ids) => {
            setSelectedLeagueIds(ids);
            const nextTeamLeagues = leagues.filter((l) => ids.includes(l.id) && l.kind === 'team');
            if (nextTeamLeagues.length === 0) {
              onComplete({ onboarded: true, selectedLeagueIds: ids, favoriteTeams: initialState.favoriteTeams });
              return;
            }
            setDirection('forward');
            setStep('teams');
          }}
        />
      </Animated.View>
    );
  }

  return (
    <Animated.View
      key="teams"
      style={styles.flex}
      entering={FadeInRight.duration(220)}
      exiting={FadeOutRight.duration(160)}
    >
      <StepDots total={totalSteps} current={1} />
      <TeamPicker
        leagues={teamLeagues}
        initialFavorites={initialState.favoriteTeams}
        onBack={() => {
          setDirection('back');
          setStep('leagues');
        }}
        onFinish={(favoriteTeams: Record<string, FavoriteTeam>) => {
          onComplete({ onboarded: true, selectedLeagueIds, favoriteTeams });
        }}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: Spacing.s3,
    paddingHorizontal: Spacing.s4,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.border },
  dotActive: { backgroundColor: Colors.accent, width: 18 },
  dotsLabel: { marginLeft: Spacing.s2, color: Colors.textMuted, fontSize: 12, fontWeight: '600' },
});
