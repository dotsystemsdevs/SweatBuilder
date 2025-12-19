import React, { memo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

const NeonUpcomingCard = memo(({ workout, onStart, style }) => {
  const exerciseCount = workout?.exercises?.length || 0;

  return (
    <View style={[styles.card, style]}>
      <View style={styles.neonBorder}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.scanline} />
            <Text style={styles.timestamp}>NOW</Text>
          </View>

          {/* Title */}
          <Text style={styles.title}>{workout?.title || "WORKOUT"}</Text>
          
          {/* Grid display */}
          <View style={styles.grid}>
            <View style={styles.gridRow}>
              <Text style={styles.gridLabel}>TYPE</Text>
              <Text style={styles.gridValue}>{workout?.type || "Strength"}</Text>
            </View>
            <View style={styles.gridRow}>
              <Text style={styles.gridLabel}>SETS</Text>
              <Text style={styles.gridValue}>{exerciseCount}x</Text>
            </View>
            <View style={styles.gridRow}>
              <Text style={styles.gridLabel}>STATUS</Text>
              <Text style={[styles.gridValue, styles.active]}>READY</Text>
            </View>
          </View>

          {/* Exercise bars */}
          <View style={styles.exercises}>
            {workout?.exercises?.slice(0, 4).map((ex, idx) => (
              <View key={idx} style={styles.exerciseRow}>
                <View style={styles.exerciseDot} />
                <Text style={styles.exerciseName}>{ex.name}</Text>
              </View>
            ))}
          </View>

          {/* Start button */}
          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              onStart?.();
            }}
            activeOpacity={0.6}
          >
            <View style={styles.buttonBorder}>
              <Text style={styles.buttonText}>► INITIATE</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
});

NeonUpcomingCard.displayName = "NeonUpcomingCard";

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#000000",
    borderRadius: 4,
    padding: 3,
  },
  neonBorder: {
    borderWidth: 2,
    borderColor: "#FFFFFF",
    borderRadius: 2,
  },
  content: {
    padding: 20,
    backgroundColor: "#0a0a0a",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  scanline: {
    width: 40,
    height: 2,
    backgroundColor: "#FFFFFF",
  },
  timestamp: {
    fontSize: 10,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 2,
    includeFontPadding: false,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 2,
    marginBottom: 20,
    includeFontPadding: false,
    textTransform: "uppercase",
    textShadowColor: "#FFFFFF",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  grid: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#333333",
    paddingVertical: 12,
    marginBottom: 16,
    gap: 8,
  },
  gridRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  gridLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#666666",
    letterSpacing: 1.5,
    includeFontPadding: false,
  },
  gridValue: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 1,
    includeFontPadding: false,
  },
  active: {
    color: "#00FF00",
    textShadowColor: "#00FF00",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  exercises: {
    gap: 10,
    marginBottom: 20,
  },
  exerciseRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  exerciseDot: {
    width: 6,
    height: 6,
    backgroundColor: "#FFFFFF",
  },
  exerciseName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#999999",
    includeFontPadding: false,
  },
  button: {
    marginTop: 8,
  },
  buttonBorder: {
    borderWidth: 2,
    borderColor: "#FFFFFF",
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 2,
    includeFontPadding: false,
  },
});

export default NeonUpcomingCard;






















