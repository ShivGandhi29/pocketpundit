import { useState } from 'react';

import { LeaguePicker } from '@/components/LeaguePicker';
import { TeamPicker } from '@/components/TeamPicker';
import type { AppState, FavoriteTeam, League } from '@/types/pocketpundit';

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
  const [selectedLeagueIds, setSelectedLeagueIds] = useState<string[]>(initialState.selectedLeagueIds);

  if (step === 'leagues') {
    return (
      <LeaguePicker
        leagues={leagues}
        preselected={selectedLeagueIds}
        onContinue={(ids) => {
          setSelectedLeagueIds(ids);
          setStep('teams');
        }}
      />
    );
  }

  return (
    <TeamPicker
      leagues={leagues.filter((l) => selectedLeagueIds.includes(l.id))}
      initialFavorites={initialState.favoriteTeams}
      onBack={() => setStep('leagues')}
      onFinish={(favoriteTeams: Record<string, FavoriteTeam>) => {
        onComplete({ onboarded: true, selectedLeagueIds, favoriteTeams });
      }}
    />
  );
}
