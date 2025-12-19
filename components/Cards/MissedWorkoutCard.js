import React, { memo } from "react";
import { Text, View, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import theme from "../../theme";

/**
 * MissedWorkoutCard - Card for missed workouts (no reflection recorded)
 * Consistent design: Header → Divider → Content → Badge
 */
const MissedWorkoutCard = memo(({
  workout,
  date,
  onPress,
  style,
}) => {
  const title = workout?.title || "Workout";
  const purpose = workout?.purpose || "";

  const formatDate = (dateStr) => {
    if (!dateStr) return "Today";
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString("sv-SE", { day: "numeric", month: "short" });
  };

  const dateLabel = formatDate(date);
  const CardWrapper = onPress ? TouchableOpacity : View;

  return (
    <CardWrapper
      style={[styles.card, style]}
      {...(onPress && { onPress, activeOpacity: 0.7 })}
    >
      {/* Header */}
      <View style={styles.cardHeader}>
        <Ionicons name="alert-circle" size={18} color={theme.colors.orange} />
        <Text style={styles.cardTitle} numberOfLines={1}>{title}</Text>
        <Text style={styles.cardDateRight}>{dateLabel}</Text>
      </View>

      {/* Divider */}
      <View style={styles.cardDivider} />

      {/* Content */}
      {purpose && <Text style={styles.purposeText}>{purpose}</Text>}
      <Text style={styles.missedText}>No reflection recorded</Text>

      {/* Missed badge */}
      <View style={styles.badgeRow}>
        <Feather name="alert-circle" size={12} color={theme.colors.orange} />
        <Text style={styles.badgeText}>Missed</Text>
      </View>
    </CardWrapper>
  );
});

MissedWorkoutCard.displayName = "MissedWorkoutCard";

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
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.text,
  },
  cardDateRight: {
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  cardDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginHorizontal: -theme.spacing.md,
    marginVertical: theme.spacing.sm,
  },
  purposeText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: theme.spacing.xs,
  },
  missedText: {
    fontSize: 13,
    color: theme.colors.textMuted,
    fontStyle: "italic",
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: theme.spacing.xs,
    marginTop: theme.spacing.sm,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.orange,
  },
});

export default MissedWorkoutCard;
