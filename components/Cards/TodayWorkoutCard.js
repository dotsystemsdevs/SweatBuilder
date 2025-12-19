import React, { memo } from "react";
import { Text, View, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import theme from "../../theme";

/**
 * TodayWorkoutCard - Main card for today's workout
 * Consistent design: Header → Divider → Content → Action
 */
const TodayWorkoutCard = memo(({
  workout,
  status = "pending",
  effort,
  onStart,
  onPress,
  style,
}) => {
  const title = workout?.title || "Workout";
  const duration = workout?.duration || "";
  const purpose = workout?.purpose || "";

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (onPress) {
      onPress(workout);
    } else if (onStart) {
      onStart(workout);
    }
  };

  // Get status color and icon
  const getStatusConfig = () => {
    switch (status) {
      case "active":
        return { icon: "radio-button-on", color: theme.colors.yellow, label: "In Progress" };
      case "completed":
        return { icon: "checkmark-circle", color: theme.colors.green, label: "Done" };
      case "skipped":
        return { icon: "close-circle", color: theme.colors.textMuted, label: "Skipped" };
      case "rest":
        return { icon: "moon", color: theme.colors.blue, label: "Rest Day" };
      case "empty":
        return { icon: "calendar-outline", color: theme.colors.textMuted, label: "No workout" };
      default:
        return { icon: "barbell-outline", color: theme.colors.yellow, label: "Today" };
    }
  };

  const config = getStatusConfig();

  // Empty state
  if (status === "empty") {
    return (
      <View style={[styles.card, style]}>
        <View style={styles.cardHeader}>
          <Ionicons name={config.icon} size={18} color={config.color} />
          <Text style={styles.cardTitleMuted}>No workout today</Text>
        </View>
      </View>
    );
  }

  // Rest day
  if (status === "rest") {
    return (
      <View style={[styles.card, style]}>
        <View style={styles.cardHeader}>
          <Ionicons name="moon" size={18} color={theme.colors.blue} />
          <Text style={styles.cardTitle}>Rest Day</Text>
          <Text style={styles.cardDateRight}>Today</Text>
        </View>
        <View style={styles.cardDivider} />
        <View style={styles.cardRow}>
          <Text style={styles.purposeText}>Recovery time - take it easy!</Text>
          <Feather name="coffee" size={18} color={theme.colors.blue} />
        </View>
      </View>
    );
  }

  // Skipped
  if (status === "skipped") {
    return (
      <TouchableOpacity
        style={[styles.card, style]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <Ionicons name="close-circle" size={18} color={theme.colors.textMuted} />
          <Text style={styles.cardTitleMuted}>{title}</Text>
          <Text style={styles.cardDateRight}>Today</Text>
        </View>
        <View style={styles.cardDivider} />
        {purpose && <Text style={styles.purposeTextMuted}>{purpose}</Text>}
        <View style={styles.badgeRow}>
          <Feather name="x" size={12} color={theme.colors.red} />
          <Text style={styles.skippedText}>Skipped</Text>
        </View>
      </TouchableOpacity>
    );
  }

  // Completed
  if (status === "completed") {
    const effortColor = effort ? theme.getEffortColorFromValue(effort) : theme.colors.green;

    return (
      <TouchableOpacity
        style={[styles.card, style]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <Ionicons name="checkmark-circle" size={18} color={theme.colors.green} />
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardDateRight}>Today</Text>
        </View>
        <View style={styles.cardDivider} />
        {purpose && <Text style={styles.purposeText}>{purpose}</Text>}
        {effort && (
          <View style={styles.effortRow}>
            <Feather name="zap" size={12} color={effortColor} />
            <Text style={[styles.effortLabel, { color: effortColor }]}>
              Effort: {effort}/10
            </Text>
          </View>
        )}
        <View style={styles.badgeRow}>
          <Feather name="check" size={12} color={theme.colors.green} />
          <Text style={styles.completedText}>Completed</Text>
        </View>
      </TouchableOpacity>
    );
  }

  // Active (in progress)
  if (status === "active") {
    return (
      <TouchableOpacity
        style={[styles.card, styles.cardActive, style]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.pulseWrap}>
            <View style={styles.pulse} />
          </View>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardDateRight}>Today</Text>
        </View>
        <View style={styles.cardDivider} />
        {purpose && <Text style={styles.purposeText}>{purpose}</Text>}
        <View style={styles.detailsLink}>
          <Text style={styles.detailsLinkText}>Continue workout</Text>
          <Feather name="chevron-right" size={14} color={theme.colors.yellow} />
        </View>
      </TouchableOpacity>
    );
  }

  // Pending (default) - show start button
  return (
    <TouchableOpacity
      style={[styles.card, style]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <Ionicons name="barbell-outline" size={18} color={theme.colors.yellow} />
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardDateRight}>Today</Text>
      </View>
      <View style={styles.cardDivider} />
      <View style={styles.cardContent}>
        {purpose && <Text style={styles.purposeText}>{purpose}</Text>}
        {duration && (
          <View style={styles.durationRow}>
            <Feather name="clock" size={12} color={theme.colors.textMuted} />
            <Text style={styles.durationText}>{duration}</Text>
          </View>
        )}
      </View>
      <View style={styles.detailsLink}>
        <Text style={styles.detailsLinkText}>View details</Text>
        <Feather name="chevron-right" size={14} color={theme.colors.textMuted} />
      </View>
    </TouchableOpacity>
  );
});

TodayWorkoutCard.displayName = "TodayWorkoutCard";

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardActive: {
    // Yellow border handled by parent wrapper in multi-workout mode
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
  cardTitleMuted: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.textMuted,
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
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardContent: {
    gap: theme.spacing.xs,
  },
  purposeText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  purposeTextMuted: {
    fontSize: 14,
    color: theme.colors.textMuted,
    lineHeight: 20,
  },
  durationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  durationText: {
    fontSize: 13,
    color: theme.colors.textMuted,
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
  skippedText: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.red,
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
  pulseWrap: {
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  pulse: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.yellow,
  },
});

export default TodayWorkoutCard;
