import { useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  FadeInRight,
  FadeOutLeft,
  FadeInLeft,
  FadeOutRight,
  useReducedMotion,
} from 'react-native-reanimated';

import { LeaguePicker } from '@/components/LeaguePicker';
import { ProgressDots } from '@/components/onboarding/ProgressDots';
import { WelcomeScreen } from '@/components/onboarding/WelcomeScreen';
import { TeamPicker } from '@/components/TeamPicker';
import type { AppState, FavoriteTeam, League } from '@/types/pocketpundit';

export function OnboardingFlow({
  leagues,
  initialState,
  onComplete,
  startAtWelcome = true,
}: {
  leagues: League[];
  initialState: AppState;
  onComplete: (next: AppState) => void;
  /** First-run onboarding shows the welcome hero; re-editing leagues/teams
   * from Settings jumps straight to the leagues picker. */
  startAtWelcome?: boolean;
}) {
  const [step, setStep] = useState<'welcome' | 'leagues' | 'teams'>(startAtWelcome ? 'welcome' : 'leagues');
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const [selectedLeagueIds, setSelectedLeagueIds] = useState<string[]>(initialState.selectedLeagueIds);
  // Reduce Motion swaps the directional slide+fade for a plain cross-fade —
  // Design Guideline (Accessibility > Cognitive): "replace transitions in
  // x-, y-, and z-axes with fades to avoid motion" when the setting is on.
  const reducedMotion = useReducedMotion();

  // Favoriting a team makes no sense for motorsport (drivers, not teams), so
  // the second step only exists when at least one selected league has teams
  // to show. Selecting only F1/IndyCar/NASCAR finishes onboarding right away.
  const teamLeagues = leagues.filter((l) => selectedLeagueIds.includes(l.id) && l.kind === 'team');
  const totalSteps = teamLeagues.length > 0 ? 2 : 1;

  if (step === 'welcome') {
    return (
      <Animated.View key="welcome" style={styles.flex} exiting={reducedMotion ? FadeOut.duration(120) : FadeOutLeft.duration(160)}>
        <WelcomeScreen
          leagues={leagues}
          onGetStarted={() => {
            setDirection('forward');
            setStep('leagues');
          }}
        />
      </Animated.View>
    );
  }

  if (step === 'leagues') {
    return (
      <Animated.View
        key="leagues"
        style={styles.flex}
        entering={
          direction === 'back' ? (reducedMotion ? FadeIn.duration(160) : FadeInLeft.duration(220)) : undefined
        }
        exiting={reducedMotion ? FadeOut.duration(120) : FadeOutLeft.duration(160)}
      >
        <ProgressDots total={totalSteps} current={0} />
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
      entering={reducedMotion ? FadeIn.duration(160) : FadeInRight.duration(220)}
      exiting={reducedMotion ? FadeOut.duration(120) : FadeOutRight.duration(160)}
    >
      <ProgressDots total={totalSteps} current={1} />
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
});
