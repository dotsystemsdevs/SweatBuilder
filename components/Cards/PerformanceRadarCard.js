import React, { memo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import theme from "../../theme";

const PerformanceBar = ({ label, value, color }) => {
  return (
    <View style={styles.barContainer}>
      <View style={styles.barHeader}>
        <Text style={styles.barLabel}>{label}</Text>
        <Text style={styles.barValue}>{value}</Text>
      </View>
      <View style={styles.barTrack}>
        <View
          style={[
            styles.barFill,
            {
              width: `${value}%`,
              backgroundColor: color,
            },
          ]}
        />
      </View>
    </View>
  );
};

const PerformanceRadarCard = memo(({ 
  data = [
    { label: "Strength", value: 85 },
    { label: "Endurance", value: 72 },
    { label: "Flexibility", value: 65 },
    { label: "Power", value: 78 },
    { label: "Balance", value: 70 },
  ],
  overallScore = 74,
  style 
}) => {
  const getScoreColor = (score) => {
    if (score >= 80) return theme.colors.success;
    if (score >= 60) return theme.colors.warning;
    return theme.colors.danger;
  };

  return (
    <View style={[styles.card, style]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Performance Profile</Text>
          <Text style={styles.subtitle}>5 key metrics</Text>
        </View>
        <TouchableOpacity
          style={styles.infoButton}
          onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
        >
          <Feather name="info" size={16} color={theme.colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Overall Score */}
      <View style={styles.scoreContainer}>
        <View style={styles.scoreCircle}>
          <Text style={[styles.scoreValue, { color: getScoreColor(overallScore) }]}>
            {overallScore}
          </Text>
          <Text style={styles.scoreLabel}>Overall Score</Text>
        </View>
      </View>

      {/* Performance bars */}
      <View style={styles.barsContainer}>
        {data.map((item, index) => (
          <PerformanceBar
            key={index}
            label={item.label}
            value={item.value}
            color={getScoreColor(item.value)}
          />
        ))}
      </View>

      {/* Action button */}
      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
        activeOpacity={0.7}
      >
        <Text style={styles.actionButtonText}>View Detailed Analysis</Text>
        <Feather name="arrow-right" size={16} color={theme.colors.textTitle} />
      </TouchableOpacity>
    </View>
  );
});

PerformanceRadarCard.displayName = "PerformanceRadarCard";

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.textTitle,
    letterSpacing: -0.4,
    marginBottom: 4,
    includeFontPadding: false,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: "500",
    color: theme.colors.textMuted,
    includeFontPadding: false,
  },
  infoButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.sectionBackground,
    alignItems: "center",
    justifyContent: "center",
  },
  scoreContainer: {
    alignItems: "center",
    marginBottom: theme.spacing.xl,
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.sectionBackground,
    borderWidth: 8,
    borderColor: theme.colors.success + "30",
    alignItems: "center",
    justifyContent: "center",
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: "800",
    letterSpacing: -1,
    includeFontPadding: false,
  },
  scoreLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: theme.colors.textMuted,
    marginTop: 4,
    includeFontPadding: false,
  },
  barsContainer: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  barContainer: {
    gap: theme.spacing.xs,
  },
  barHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  barLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.textBody,
    includeFontPadding: false,
  },
  barValue: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.textTitle,
    includeFontPadding: false,
  },
  barTrack: {
    height: 8,
    backgroundColor: theme.colors.sectionBackground,
    borderRadius: 4,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 4,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.sectionBackground,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.textTitle,
    letterSpacing: -0.2,
    includeFontPadding: false,
  },
});

export default PerformanceRadarCard;
