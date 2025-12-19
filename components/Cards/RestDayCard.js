import React, { memo } from "react";
import { Text, View, StyleSheet } from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import theme from "../../theme";

/**
 * RestDayCard - Card for rest days
 * Consistent design: Header → Divider → Content
 */
const RestDayCard = memo(({
  date,
  purpose,
  style,
}) => {
  const formatDate = (dateStr) => {
    if (!dateStr) return "Today";
    const d = new Date(dateStr);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return "Today";
    return d.toLocaleDateString("sv-SE", { weekday: "short", day: "numeric", month: "short" });
  };

  const dateLabel = formatDate(date);

  return (
    <View style={[styles.card, style]}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <Ionicons name="moon" size={18} color={theme.colors.blue} />
        <Text style={styles.cardTitle}>Rest Day</Text>
        <Text style={styles.cardDateRight}>{dateLabel}</Text>
      </View>

      {/* Divider */}
      <View style={styles.cardDivider} />

      {/* Content */}
      <View style={styles.cardRow}>
        <View style={styles.content}>
          <Text style={styles.purposeText}>
            {purpose || "Recovery time - take it easy!"}
          </Text>
          <Text style={styles.planText}>This is part of the plan</Text>
        </View>
        <Feather name="coffee" size={18} color={theme.colors.blue} />
      </View>
    </View>
  );
});

RestDayCard.displayName = "RestDayCard";

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
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  content: {
    flex: 1,
  },
  purposeText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  planText: {
    fontSize: 12,
    color: theme.colors.blue,
    marginTop: 4,
  },
});

export default RestDayCard;
