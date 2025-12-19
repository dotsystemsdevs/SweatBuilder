import React, { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const VoidSkippedCard = memo(({ workout, style }) => {
  return (
    <View style={[styles.card, style]}>
      <LinearGradient
        colors={['#000000', '#0a0a0a', '#000000']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Glitch effect text */}
        <View style={styles.glitchContainer}>
          <Text style={[styles.glitchText, styles.glitch1]}>SKIPPED</Text>
          <Text style={[styles.glitchText, styles.glitch2]}>SKIPPED</Text>
          <Text style={styles.mainText}>SKIPPED</Text>
        </View>

        {/* Void circle */}
        <View style={styles.voidCircle}>
          <View style={styles.voidInner}>
            <Feather name="x" size={32} color="rgba(255,255,255,0.3)" />
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.title}>{workout?.title || "Workout"}</Text>
          
          {workout?.skipReason && (
            <View style={styles.reasonBox}>
              <View style={styles.reasonLine} />
              <Text style={styles.reason}>{workout.skipReason}</Text>
              <View style={styles.reasonLine} />
            </View>
          )}
        </View>

        {/* Distortion lines */}
        <View style={styles.distortionLines}>
          {[...Array(6)].map((_, i) => (
            <View
              key={i}
              style={[
                styles.distortionLine,
                { width: `${Math.random() * 60 + 20}%`, opacity: Math.random() * 0.3 + 0.1 }
              ]}
            />
          ))}
        </View>
      </LinearGradient>
    </View>
  );
});

VoidSkippedCard.displayName = "VoidSkippedCard";

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.9,
    shadowRadius: 20,
    elevation: 12,
  },
  gradient: {
    padding: 24,
    minHeight: 280,
  },
  glitchContainer: {
    position: "relative",
    marginBottom: 30,
  },
  glitchText: {
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 8,
    includeFontPadding: false,
  },
  glitch1: {
    position: "absolute",
    color: "rgba(255,0,0,0.3)",
    left: -2,
  },
  glitch2: {
    position: "absolute",
    color: "rgba(0,255,255,0.3)",
    left: 2,
  },
  mainText: {
    fontSize: 14,
    fontWeight: "900",
    color: "rgba(255,255,255,0.5)",
    letterSpacing: 8,
    includeFontPadding: false,
  },
  voidCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.1)",
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30,
  },
  voidInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
    marginBottom: 20,
    includeFontPadding: false,
  },
  reasonBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  reasonLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  reason: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.4)",
    includeFontPadding: false,
  },
  distortionLines: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    gap: 4,
    padding: 20,
  },
  distortionLine: {
    height: 2,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
});

export default VoidSkippedCard;






















