import React, { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import theme from "../../theme";

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];

const StreakCard = memo(({
  currentStreak = 0,
  weekProgress = [],
  style,
}) => {
  const todayIndex = new Date().getDay();
  const adjustedToday = todayIndex === 0 ? 6 : todayIndex - 1;

  return (
    <View style={[styles.card, style]}>
      <View style={styles.header}>
        <Text style={styles.number}>{currentStreak}</Text>
        <Text style={styles.label}>day streak</Text>
      </View>
      <View style={styles.week}>
        {DAYS.map((day, i) => (
          <View key={i} style={styles.day}>
            <Text style={[styles.dayLabel, i === adjustedToday && styles.dayToday]}>{day}</Text>
            <View style={[
              styles.dot,
              weekProgress[i] && styles.dotDone,
              i === adjustedToday && !weekProgress[i] && styles.dotCurrent,
            ]} />
          </View>
        ))}
      </View>
    </View>
  );
});

StreakCard.displayName = "StreakCard";

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  header: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
    marginBottom: theme.spacing.lg,
  },
  number: {
    fontSize: 28,
    fontWeight: "700",
    color: theme.colors.textTitle,
  },
  label: {
    fontSize: 14,
    color: theme.colors.textMuted,
  },
  week: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  day: {
    alignItems: "center",
    gap: 6,
  },
  dayLabel: {
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  dayToday: {
    color: theme.colors.textTitle,
    fontWeight: "600",
  },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceMuted,
  },
  dotDone: {
    backgroundColor: theme.colors.accentYellow,
  },
  dotCurrent: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: theme.colors.accentYellow,
  },
});

export default StreakCard;
