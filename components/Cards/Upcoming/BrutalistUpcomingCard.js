import React, { memo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

// Design System C - Apple Gradient (Vibrant & Modern)
const BrutalistUpcomingCard = memo(({ workout, onStart, style }) => {
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
      <View style={styles.gradient}>
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
            <Feather name="list" size={16} color="rgba(255,255,255,0.8)" />
            <Text style={styles.statText}>{exerciseCount} exercises</Text>
          </View>
          <View style={styles.stat}>
            <Feather name="clock" size={16} color="rgba(255,255,255,0.8)" />
            <Text style={styles.statText}>~45 min</Text>
          </View>
        </View>

        {/* Action button */}
        <View style={styles.buttonContainer}>
          <View style={styles.button}>
            <Text style={styles.buttonText}>Start Workout</Text>
            <Feather name="arrow-right" size={18} color="#FFFFFF" />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
});

BrutalistUpcomingCard.displayName = "BrutalistUpcomingCard";

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  gradient: {
    padding: 20,
    backgroundColor: "#1D1D1F",
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(255, 255, 255, 0.25)",
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
    backgroundColor: "#FFFFFF",
  },
  statusText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
    includeFontPadding: false,
  },
  titleSection: {
    marginBottom: 20,
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
    color: "rgba(255, 255, 255, 0.8)",
    letterSpacing: -0.2,
    includeFontPadding: false,
  },
  statsRow: {
    flexDirection: "row",
    gap: 20,
    marginBottom: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.25)",
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statText: {
    fontSize: 14,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.8)",
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
    color: "#FFFFFF",
    includeFontPadding: false,
  },
});

export default BrutalistUpcomingCard;




