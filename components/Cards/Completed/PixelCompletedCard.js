import React, { memo } from "react";
import { View, Text, StyleSheet } from "react-native";

const PixelCompletedCard = memo(({ workout, style }) => {
  return (
    <View style={[styles.card, style]}>
      {/* Pixel border */}
      <View style={styles.pixelBorder}>
        {/* Header with pixel art check */}
        <View style={styles.header}>
          <View style={styles.pixelCheck}>
            <View style={styles.checkRow1} />
            <View style={styles.checkRow2} />
            <View style={styles.checkRow3} />
          </View>
          <Text style={styles.headerText}>MISSION COMPLETE</Text>
        </View>

        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{workout?.title || "WORKOUT"}</Text>
        </View>

        {/* Stats in pixel boxes */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>MOOD</Text>
            <Text style={styles.statValue}>
              {workout?.mood?.toUpperCase() || "GOOD"}
            </Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>XP</Text>
            <Text style={styles.statValue}>+250</Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.progressContainer}>
          <Text style={styles.progressLabel}>STRENGTH</Text>
          <View style={styles.progressBar}>
            <View style={styles.progressFill} />
          </View>
        </View>

        {/* Pixel art decoration */}
        <View style={styles.pixelDecor}>
          {[...Array(5)].map((_, i) => (
            <View key={i} style={styles.pixelDot} />
          ))}
        </View>
      </View>
    </View>
  );
});

PixelCompletedCard.displayName = "PixelCompletedCard";

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1a1a1a",
    padding: 6,
  },
  pixelBorder: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderWidth: 4,
    borderColor: "#000000",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  pixelCheck: {
    width: 24,
    height: 24,
    justifyContent: "center",
  },
  checkRow1: {
    width: 8,
    height: 4,
    backgroundColor: "#000000",
    position: "absolute",
    right: 0,
    top: 8,
  },
  checkRow2: {
    width: 12,
    height: 4,
    backgroundColor: "#000000",
    position: "absolute",
    right: 4,
    top: 12,
  },
  checkRow3: {
    width: 16,
    height: 4,
    backgroundColor: "#000000",
    position: "absolute",
    left: 0,
    top: 16,
  },
  headerText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#000000",
    letterSpacing: 1.5,
    includeFontPadding: false,
  },
  titleContainer: {
    backgroundColor: "#000000",
    padding: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 2,
    textAlign: "center",
    includeFontPadding: false,
    textTransform: "uppercase",
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    borderWidth: 3,
    borderColor: "#000000",
    padding: 12,
    alignItems: "center",
  },
  statLabel: {
    fontSize: 9,
    fontWeight: "900",
    color: "#666666",
    letterSpacing: 1,
    marginBottom: 4,
    includeFontPadding: false,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "900",
    color: "#000000",
    includeFontPadding: false,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressLabel: {
    fontSize: 9,
    fontWeight: "900",
    color: "#000000",
    letterSpacing: 1,
    marginBottom: 8,
    includeFontPadding: false,
  },
  progressBar: {
    height: 16,
    backgroundColor: "#E0E0E0",
    borderWidth: 3,
    borderColor: "#000000",
    overflow: "hidden",
  },
  progressFill: {
    width: "80%",
    height: "100%",
    backgroundColor: "#000000",
  },
  pixelDecor: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  pixelDot: {
    width: 8,
    height: 8,
    backgroundColor: "#000000",
  },
});

export default PixelCompletedCard;






















