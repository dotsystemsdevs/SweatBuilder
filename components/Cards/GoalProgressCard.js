import React, { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

// Apple Minimal Clean Design System
const MilestoneItem = ({ icon, label, status }) => {
  const getStatusColor = () => {
    if (status === "completed") return "#1D1D1F";
    if (status === "in-progress") return "#86868B";
    return "#C7C7CC";
  };

  return (
    <View style={styles.milestone}>
      <View style={[styles.milestoneIcon, { backgroundColor: "#F5F5F7" }]}>
        <Feather name={icon} size={14} color={getStatusColor()} />
      </View>
      <Text style={styles.milestoneLabel}>{label}</Text>
      {status === "completed" && (
        <View style={styles.checkBadge}>
          <Feather name="check" size={10} color="#FFFFFF" />
        </View>
      )}
    </View>
  );
};

const GoalProgressCard = memo(({
  goalTitle = "Strength Goal 2025",
  progress = 67,
  currentValue = 67,
  targetValue = 100,
  unit = "kg",
  daysLeft = 28,
  milestones = [],
  style,
}) => {
  return (
    <View style={[styles.card, style]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{goalTitle}</Text>
        <View style={styles.daysChip}>
          <Text style={styles.daysText}>{daysLeft}d left</Text>
        </View>
      </View>

      {/* Progress section */}
      <View style={styles.progressSection}>
        <View style={styles.progressValues}>
          <View>
            <Text style={styles.currentValue}>{currentValue}</Text>
            <Text style={styles.valueLabel}>Current</Text>
          </View>
          <Feather name="arrow-right" size={20} color="#86868B" />
          <View>
            <Text style={styles.targetValue}>{targetValue}</Text>
            <Text style={styles.valueLabel}>Target</Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>{progress}%</Text>
        </View>
      </View>

      {/* Milestones */}
      {milestones.length > 0 && (
        <View style={styles.milestonesSection}>
          <Text style={styles.sectionLabel}>Milestones</Text>
          <View style={styles.milestonesList}>
            {milestones.map((milestone, index) => (
              <MilestoneItem
                key={index}
                icon={milestone.icon}
                label={milestone.label}
                status={milestone.status}
              />
            ))}
          </View>
        </View>
      )}
    </View>
  );
});

GoalProgressCard.displayName = "GoalProgressCard";

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1D1D1F",
    flex: 1,
    includeFontPadding: false,
  },
  daysChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "#F5F5F7",
    borderRadius: 8,
  },
  daysText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#86868B",
    includeFontPadding: false,
  },
  progressSection: {
    marginBottom: 20,
  },
  progressValues: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    marginBottom: 20,
  },
  currentValue: {
    fontSize: 32,
    fontWeight: "700",
    color: "#1D1D1F",
    textAlign: "center",
    letterSpacing: -1,
    includeFontPadding: false,
  },
  targetValue: {
    fontSize: 32,
    fontWeight: "700",
    color: "#86868B",
    textAlign: "center",
    letterSpacing: -1,
    includeFontPadding: false,
  },
  valueLabel: {
    fontSize: 11,
    fontWeight: "500",
    color: "#86868B",
    textAlign: "center",
    marginTop: 4,
    includeFontPadding: false,
  },
  progressBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  progressBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: "#F5F5F7",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#1D1D1F",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1D1D1F",
    minWidth: 40,
    textAlign: "right",
    includeFontPadding: false,
  },
  milestonesSection: {
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#F5F5F7",
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#86868B",
    marginBottom: 12,
    includeFontPadding: false,
  },
  milestonesList: {
    gap: 8,
  },
  milestone: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  milestoneIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  milestoneLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: "#1D1D1F",
    includeFontPadding: false,
  },
  checkBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#1D1D1F",
    alignItems: "center",
    justifyContent: "center",
  },
});

export default GoalProgressCard;
