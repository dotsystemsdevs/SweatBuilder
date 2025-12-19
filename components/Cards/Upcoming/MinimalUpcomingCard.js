import React, { memo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

// Design System A - Apple Minimal Clean (White & Light)
const MinimalUpcomingCard = memo(({ workout, onStart, style }) => {
  const exerciseCount = workout?.exercises?.length || 0;

  return (
    <TouchableOpacity
      style={[styles.card, style]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onStart?.();
      }}
      activeOpacity={0.9}
    >
      <View style={styles.content}>
        {/* Status pill */}
        <View style={styles.statusPill}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>Scheduled</Text>
        </View>

        {/* Title section */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>{workout?.title || "Workout"}</Text>
          {workout?.subtitle && (
            <Text style={styles.subtitle}>{workout.subtitle}</Text>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Feather name="list" size={16} color="#1D1D1F" />
            <Text style={styles.statText}>{exerciseCount} exercises</Text>
          </View>
          <View style={styles.stat}>
            <Feather name="clock" size={16} color="#1D1D1F" />
            <Text style={styles.statText}>~45 min</Text>
          </View>
        </View>

        {/* Action button */}
        <View style={styles.buttonContainer}>
          <View style={styles.button}>
            <Text style={styles.buttonText}>Start Workout</Text>
            <Feather name="arrow-right" size={18} color="#1D1D1F" />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
});

MinimalUpcomingCard.displayName = "MinimalUpcomingCard";

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  content: {
    padding: 20,
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
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#1D1D1F",
  },
  statusText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1D1D1F",
    includeFontPadding: false,
  },
  titleSection: {
    marginBottom: 20,
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
  statsRow: {
    flexDirection: "row",
    gap: 20,
    marginBottom: 20,
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
  buttonContainer: {
    marginTop: 4,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#007AFF",
    includeFontPadding: false,
  },
});

export default MinimalUpcomingCard;




