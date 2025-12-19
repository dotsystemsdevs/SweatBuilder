import React, { memo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

const StackedUpcomingCard = memo(({ workout, onStart, style }) => {
  const exerciseCount = workout?.exercises?.length || 0;

  return (
    <View style={[styles.cardStack, style]}>
      {/* Shadow cards */}
      <View style={[styles.shadowCard, styles.shadowCard3]} />
      <View style={[styles.shadowCard, styles.shadowCard2]} />
      
      {/* Main card */}
      <TouchableOpacity
        style={styles.mainCard}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onStart?.();
        }}
        activeOpacity={0.95}
      >
        {/* Corner accent */}
        <View style={styles.cornerAccent} />
        
        {/* Content */}
        <View style={styles.content}>
          <View style={styles.topRow}>
            <View style={styles.numberBadge}>
              <Text style={styles.numberBadgeText}>{exerciseCount}</Text>
            </View>
            <Feather name="chevron-right" size={20} color="#666666" />
          </View>

          <View style={styles.mainContent}>
            <Text style={styles.label}>UP NEXT</Text>
            <Text style={styles.title}>{workout?.title || "Workout"}</Text>
            
            {workout?.subtitle && (
              <View style={styles.subtitleRow}>
                <View style={styles.subtitleBar} />
                <Text style={styles.subtitle}>{workout.subtitle}</Text>
              </View>
            )}
          </View>

          {/* Exercise preview */}
          <View style={styles.exercises}>
            {workout?.exercises?.slice(0, 3).map((ex, idx) => (
              <View key={idx} style={styles.exerciseChip}>
                <Text style={styles.exerciseChipText}>{ex.name}</Text>
              </View>
            ))}
          </View>

          {/* Bottom bar */}
          <View style={styles.bottomBar}>
            <Text style={styles.bottomBarText}>TAP TO START</Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
});

StackedUpcomingCard.displayName = "StackedUpcomingCard";

const styles = StyleSheet.create({
  cardStack: {
    position: "relative",
    paddingTop: 8,
  },
  shadowCard: {
    position: "absolute",
    left: 0,
    right: 0,
    height: "100%",
    backgroundColor: "#1a1a1a",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  shadowCard2: {
    transform: [{ scale: 0.97 }, { translateY: -4 }],
    opacity: 0.6,
  },
  shadowCard3: {
    transform: [{ scale: 0.94 }, { translateY: -8 }],
    opacity: 0.3,
  },
  mainCard: {
    backgroundColor: "#000000",
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    overflow: "hidden",
    position: "relative",
    zIndex: 3,
  },
  cornerAccent: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 60,
    height: 60,
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 60,
  },
  content: {
    padding: 24,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  numberBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  numberBadgeText: {
    fontSize: 20,
    fontWeight: "900",
    color: "#000000",
    includeFontPadding: false,
  },
  mainContent: {
    marginBottom: 20,
  },
  label: {
    fontSize: 10,
    fontWeight: "900",
    color: "#666666",
    letterSpacing: 2,
    marginBottom: 8,
    includeFontPadding: false,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -1,
    marginBottom: 12,
    includeFontPadding: false,
  },
  subtitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  subtitleBar: {
    width: 4,
    height: 16,
    backgroundColor: "#FFFFFF",
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#999999",
    includeFontPadding: false,
  },
  exercises: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  exerciseChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#1a1a1a",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#333333",
  },
  exerciseChipText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#FFFFFF",
    includeFontPadding: false,
  },
  bottomBar: {
    alignItems: "center",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#333333",
  },
  bottomBarText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#666666",
    letterSpacing: 2,
    includeFontPadding: false,
  },
});

export default StackedUpcomingCard;






















