import { useLocalSearchParams } from 'expo-router';

import { TeamScheduleScreen } from '@/screens/TeamScheduleScreen';

export default function TeamRoute() {
  const { teamId, leagueId, teamName, teamLogo } = useLocalSearchParams<{
    teamId: string;
    leagueId: string;
    teamName: string;
    teamLogo?: string;
  }>();

  return (
    <TeamScheduleScreen
      teamId={teamId}
      leagueId={leagueId}
      teamName={teamName}
      teamLogo={teamLogo ?? null}
    />
  );
}
