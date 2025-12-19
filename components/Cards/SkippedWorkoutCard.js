import React, { memo } from "react";
import { Text, View, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import theme from "../../theme";

/**
 * SkippedWorkoutCard - Card for skipped workouts
 * Consistent design: Header → Divider → Content → Badge
 */
const SkippedWorkoutCard = memo(({
  workout,
  date,
  onPress,
  style,
}) => {
  const title = workout?.title || "Workout";
  const reason = workout?.skipReason || "";
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

  // Get supportive message based on skip reason
  const getSupportiveMessage = (reason) => {
    if (reason === "sick" || reason === "injury") return "Recovery is progress too";
    if (reason === "tired" || reason === "mental_health") return "Rest is part of the plan";
    if (reason === "busy" || reason === "travel") return "Life happens, you'll adjust";
    return purpose || "Take a breath, adjust the plan";
  };

  const dateLabel = formatDate(date);
  const supportiveMessage = getSupportiveMessage(reason);
  const CardWrapper = onPress ? TouchableOpacity : View;

  return (
    <CardWrapper
      style={[styles.card, style]}
      {...(onPress && { onPress, activeOpacity: 0.7 })}
    >
      {/* Header */}
      <View style={styles.cardHeader}>
        <Ionicons name="close-circle" size={18} color={theme.colors.textMuted} />
        <Text style={styles.cardTitleMuted} numberOfLines={1}>{title}</Text>
        <Text style={styles.cardDateRight}>{dateLabel}</Text>
      </View>

      {/* Divider */}
      <View style={styles.cardDivider} />

      {/* Content */}
      <Text style={styles.messageText}>{supportiveMessage}</Text>

      {/* Skipped badge */}
      <View style={styles.badgeRow}>
        <Feather name="x" size={12} color={theme.colors.red} />
        <Text style={styles.skippedText}>Skipped</Text>
      </View>
    </CardWrapper>
  );
});

SkippedWorkoutCard.displayName = "SkippedWorkoutCard";

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
  cardTitleMuted: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.textMuted,
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
  messageText: {
    fontSize: 14,
    color: theme.colors.textMuted,
    lineHeight: 20,
    fontStyle: "italic",
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: theme.spacing.xs,
    marginTop: theme.spacing.sm,
  },
  skippedText: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.red,
  },
});

export default SkippedWorkoutCard;
