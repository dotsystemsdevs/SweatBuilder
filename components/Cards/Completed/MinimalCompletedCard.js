import React, { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

// Design System A - Apple Minimal Clean (White & Light)
const MinimalCompletedCard = memo(({ workout, style }) => {
  return (
    <View style={[styles.card, style]}>
      {/* Status pill */}
      <View style={styles.statusPill}>
        <Feather name="check-circle" size={14} color="#1D1D1F" />
        <Text style={styles.statusText}>Done</Text>
      </View>

      {/* Title section */}
      <View style={styles.titleSection}>
        <Text style={styles.title}>{workout?.title || "Workout"}</Text>
        {workout?.subtitle && (
          <Text style={styles.subtitle}>{workout.subtitle}</Text>
        )}
      </View>

      {/* Mood section */}
      {workout?.mood && (
        <View style={styles.moodSection}>
          <Text style={styles.moodLabel}>Mood</Text>
          <View style={styles.moodPill}>
            <Text style={styles.moodText}>{workout.mood}</Text>
          </View>
        </View>
      )}

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Feather name="check" size={16} color="#86868B" />
          <Text style={styles.statText}>{workout?.exercises?.length || 0} exercises</Text>
        </View>
        <View style={styles.stat}>
          <Feather name="clock" size={16} color="#86868B" />
          <Text style={styles.statText}>~45 min</Text>
        </View>
      </View>
    </View>
  );
});

MinimalCompletedCard.displayName = "MinimalCompletedCard";

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
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#F5F5F7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
    marginBottom: 16,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1D1D1F",
    includeFontPadding: false,
  },
  titleSection: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1D1D1F",
    letterSpacing: -0.5,
    marginBottom: 4,
    includeFontPadding: false,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: "400",
    color: "#86868B",
    letterSpacing: -0.2,
    includeFontPadding: false,
  },
  moodSection: {
    marginBottom: 16,
  },
  moodLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: "#86868B",
    marginBottom: 8,
    includeFontPadding: false,
  },
  moodPill: {
    alignSelf: "flex-start",
    backgroundColor: "#F5F5F7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  moodText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1D1D1F",
    includeFontPadding: false,
  },
  statsRow: {
    flexDirection: "row",
    gap: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F5F5F7",
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#86868B",
    includeFontPadding: false,
  },
});

export default MinimalCompletedCard;




