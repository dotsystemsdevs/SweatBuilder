import React, { memo } from "react";
import { Text, View, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import theme from "../../theme";

/**
 * UpcomingWorkoutCard - Card for upcoming/scheduled workouts
 * Consistent design: Header → Divider → Content → Action
 */
const UpcomingWorkoutCard = memo(({
  workout,
  date,
  onStart,
  onPress,
  style,
}) => {
  const title = workout?.title || "Workout";
  const duration = workout?.duration || "45 min";
  const purpose = workout?.purpose || "";

  const formatDate = (dateStr) => {
    if (!dateStr) return "Upcoming";
    const d = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === tomorrow.toDateString()) return "Tomorrow";
    return d.toLocaleDateString("sv-SE", { weekday: "short", day: "numeric", month: "short" });
  };

  const dateLabel = formatDate(date);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (onPress) {
      onPress(workout);
    } else if (onStart) {
      onStart(workout);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.card, style]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Header */}
      <View style={styles.cardHeader}>
        <Ionicons name="barbell-outline" size={18} color={theme.colors.yellow} />
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardDateRight}>{dateLabel}</Text>
      </View>

      {/* Divider */}
      <View style={styles.cardDivider} />

      {/* Content */}
      <View style={styles.cardContent}>
        {purpose && <Text style={styles.purposeText}>{purpose}</Text>}
        <View style={styles.durationRow}>
          <Feather name="clock" size={12} color={theme.colors.textMuted} />
          <Text style={styles.durationText}>{duration}</Text>
        </View>
      </View>

      {/* Details link */}
      <View style={styles.detailsLink}>
        <Text style={styles.detailsLinkText}>View details</Text>
        <Feather name="chevron-right" size={14} color={theme.colors.textMuted} />
      </View>
    </TouchableOpacity>
  );
});

UpcomingWorkoutCard.displayName = "UpcomingWorkoutCard";

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.text,
  },
  cardDateRight: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginLeft: "auto",
  },
  cardDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginHorizontal: -theme.spacing.md,
    marginVertical: theme.spacing.sm,
  },
  cardContent: {
    gap: theme.spacing.xs,
  },
  purposeText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  durationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  durationText: {
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  detailsLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: theme.spacing.sm,
    gap: 2,
  },
  detailsLinkText: {
    fontSize: 13,
    color: theme.colors.textMuted,
  },
});

export default UpcomingWorkoutCard;
