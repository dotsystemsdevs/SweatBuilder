import React, { memo } from "react";
import { Text, View, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import theme from "../../theme";

/**
 * CompletedWorkoutCard - Card for completed workouts
 * Consistent design: Header → Divider → Content → Badge
 */
const CompletedWorkoutCard = memo(({
  workout,
  date,
  effortValue,
  reflectionData,
  onPress,
  style,
}) => {
  const title = workout?.title || "Workout";
  const purpose = workout?.purpose || "";
  const tag = reflectionData?.tags?.[0];

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
  const effortColor = effortValue ? theme.getEffortColorFromValue(effortValue) : theme.colors.green;
  const CardWrapper = onPress ? TouchableOpacity : View;

  return (
    <CardWrapper
      style={[styles.card, style]}
      {...(onPress && { onPress, activeOpacity: 0.7 })}
    >
      {/* Header */}
      <View style={styles.cardHeader}>
        <Ionicons name="checkmark-circle" size={18} color={theme.colors.green} />
        <Text style={styles.cardTitle} numberOfLines={1}>{title}</Text>
        <Text style={styles.cardDateRight}>{dateLabel}</Text>
      </View>

      {/* Divider */}
      <View style={styles.cardDivider} />

      {/* Content */}
      {purpose && <Text style={styles.purposeText}>{purpose}</Text>}

      {/* Reflection tag */}
      {tag && (
        <View style={styles.tagsRow}>
          <View style={styles.tagPill}>
            <Text style={styles.tagPillText}>{tag}</Text>
          </View>
        </View>
      )}

      {/* Effort indicator */}
      {effortValue && (
        <View style={styles.effortRow}>
          <Feather name="zap" size={12} color={effortColor} />
          <Text style={[styles.effortLabel, { color: effortColor }]}>
            Effort: {effortValue}/10
          </Text>
        </View>
      )}

      {/* Completed badge */}
      <View style={styles.badgeRow}>
        <Feather name="check" size={12} color={theme.colors.green} />
        <Text style={styles.completedText}>Completed</Text>
      </View>
    </CardWrapper>
  );
});

CompletedWorkoutCard.displayName = "CompletedWorkoutCard";

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
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  tagPill: {
    backgroundColor: theme.colors.surfaceHover,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.full,
  },
  tagPillText: {
    fontSize: 13,
    fontWeight: "500",
    color: theme.colors.textSecondary,
  },
  effortRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  effortLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: theme.spacing.xs,
    marginTop: theme.spacing.sm,
  },
  completedText: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.green,
  },
});

export default CompletedWorkoutCard;
