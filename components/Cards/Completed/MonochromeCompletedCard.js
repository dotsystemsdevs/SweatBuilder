import React, { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

// Design System B - Apple Dark Mode (Dark & Elevated)
const MonochromeCompletedCard = memo(({ workout, style }) => {
  return (
    <View style={[styles.card, style]}>
      {/* Status pill */}
      <View style={styles.statusPill}>
        <Feather name="check-circle" size={14} color="#FFFFFF" />
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
          <Feather name="check" size={16} color="#98989D" />
          <Text style={styles.statText}>{workout?.exercises?.length || 0} exercises</Text>
        </View>
        <View style={styles.stat}>
          <Feather name="clock" size={16} color="#98989D" />
          <Text style={styles.statText}>~45 min</Text>
        </View>
      </View>
    </View>
  );
});

MonochromeCompletedCard.displayName = "MonochromeCompletedCard";

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1C1C1E",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#2C2C2E",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
    marginBottom: 16,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
    includeFontPadding: false,
  },
  titleSection: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.5,
    marginBottom: 4,
    includeFontPadding: false,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: "400",
    color: "#98989D",
    letterSpacing: -0.2,
    includeFontPadding: false,
  },
  moodSection: {
    marginBottom: 16,
  },
  moodLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: "#98989D",
    marginBottom: 8,
    includeFontPadding: false,
  },
  moodPill: {
    alignSelf: "flex-start",
    backgroundColor: "#2C2C2E",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  moodText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    includeFontPadding: false,
  },
  statsRow: {
    flexDirection: "row",
    gap: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#2C2C2E",
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#98989D",
    includeFontPadding: false,
  },
});

export default MonochromeCompletedCard;




