import { Text } from "@/components/AppText";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { memo } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { Fonts } from "@/constants/fonts";
import { Colors, Radius, Spacing } from "@/constants/theme";
import type { Game, GameTeam } from "@/types/huddl";
import { formatKickoffDate, formatKickoffTime } from "@/utils/formatGameTime";
import { teamGradientColor } from "@/utils/teamGradient";

function TeamColumn({
  team,
  showScore,
}: {
  team: GameTeam;
  showScore: boolean;
}) {
  return (
    <View style={styles.teamCol}>
      {team.logo ? (
        <Image
          source={{ uri: team.logo }}
          style={styles.logo}
          contentFit="contain"
        />
      ) : (
        <View style={styles.logo} />
      )}
      <Text style={styles.abbr} numberOfLines={1}>
        {team.abbreviation ?? team.name}
      </Text>
      {team.record ? (
        <Text style={styles.record} numberOfLines={1}>
          {team.record}
        </Text>
      ) : null}
      {showScore ? (
        <Text style={[styles.teamScore, team.winner && styles.teamScoreWinner]}>
          {team.score ?? "-"}
        </Text>
      ) : null}
    </View>
  );
}

function CenterBadge({ state }: { state: Game["state"] }) {
  if (state === "in") {
    return (
      <View style={styles.liveBadge}>
        <Ionicons name="play" size={10} color={Colors.onAccent} />
        <Text style={styles.liveBadgeText}>Live</Text>
      </View>
    );
  }
  if (state === "post") {
    return <Text style={styles.centerMuted}>Final</Text>;
  }
  return <Text style={styles.centerMuted}>vs</Text>;
}

// Memoized, with a stable `onOpen` callback expected from the caller (see
// MatchupsScreen's useCallback) — a game list can run into dozens of these,
// each now carrying a native gradient layer and two 60px logo images, so
// skipping a re-render for cards whose data hasn't actually changed matters.
// Without this, closing the detail modal (which flips `openGame` state in
// the parent) re-rendered every visible card synchronously, competing with
// the modal's own dismiss animation for the JS thread and making it stutter.
export const GameCard = memo(function GameCard({
  game,
  favorite,
  onOpen,
}: {
  game: Game;
  favorite: boolean;
  onOpen: (game: Game) => void;
}) {
  const isLive = game.state === "in";
  const isPre = game.state === "pre";

  const statusText = isPre
    ? `${formatKickoffTime(game.date)} ${formatKickoffDate(game.date)}`
    : isLive
      ? `Live, ${game.detail}`
      : game.detail || "Final";
  const scoreText = isPre
    ? ""
    : `, ${game.away.abbreviation ?? game.away.name} ${game.away.score ?? "-"}, ${game.home.abbreviation ?? game.home.name} ${game.home.score ?? "-"}`;
  const label = `${game.away.name} at ${game.home.name}${favorite ? ", favorite" : ""}, ${statusText}${scoreText}`;

  return (
    <Pressable
      onPress={() => onOpen(game)}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => pressed && styles.pressed}
    >
      {/* Same vertical team-color split as ScoreBug (away → home, left to
          right) — see src/utils/teamGradient.ts for the shared color logic. */}
      <LinearGradient
        colors={[
          teamGradientColor(game.away.color),
          teamGradientColor(game.home.color),
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.card}
      >
        {isPre ? (
          <>
            <Text style={styles.headlineTime}>
              {formatKickoffTime(game.date)}
            </Text>
            <Text style={styles.headlineDate}>
              {formatKickoffDate(game.date)}
            </Text>
          </>
        ) : (
          <Text
            style={[styles.headlineStatus, isLive && styles.headlineStatusLive]}
            numberOfLines={1}
          >
            {isLive ? `Live · ${game.detail}` : ""}
          </Text>
        )}

        <View style={styles.row}>
          <TeamColumn team={game.away} showScore={!isPre} />
          <View style={styles.center}>
            <CenterBadge state={game.state} />
          </View>
          <TeamColumn team={game.home} showScore={!isPre} />
        </View>
      </LinearGradient>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.md,
    paddingVertical: Spacing.s3,
    paddingHorizontal: Spacing.s3,
    alignItems: "center",
  },
  pressed: { opacity: 0.85 },
  headlineTime: {
    color: Colors.text,
    fontSize: 22,
    fontFamily: Fonts.extrabold,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  headlineDate: {
    color: Colors.textMuted,
    fontSize: 12,
    fontFamily: Fonts.semibold,
    fontWeight: "600",
    marginTop: 2,
    marginBottom: Spacing.s2,
  },
  headlineStatus: {
    color: Colors.textMuted,
    fontSize: 13,
    fontFamily: Fonts.bold,
    fontWeight: "700",
    marginBottom: Spacing.s2,
    textAlign: "center",
  },
  headlineStatusLive: { color: Colors.live },
  row: { flexDirection: "row", alignItems: "center", width: "100%" },
  teamCol: { flex: 1, alignItems: "center", gap: 2 },
  logo: { width: 60, height: 60, marginBottom: 4 },
  abbr: {
    color: Colors.text,
    fontSize: 13,
    fontFamily: Fonts.extrabold,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  record: { color: Colors.textMuted, fontSize: 11 },
  teamScore: {
    color: Colors.text,
    fontSize: 20,
    fontFamily: Fonts.extrabold,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
    marginTop: 2,
  },
  teamScoreWinner: { color: Colors.accent },
  center: { width: 72, alignItems: "center", justifyContent: "center" },
  centerMuted: {
    color: Colors.textMuted,
    fontSize: 12,
    fontFamily: Fonts.bold,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.live,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.s2,
    paddingVertical: 4,
  },
  liveBadgeText: {
    color: Colors.onAccent,
    fontSize: 11,
    fontFamily: Fonts.extrabold,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});
