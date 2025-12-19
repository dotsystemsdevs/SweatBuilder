import React, { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

const BrokenChainSkippedCard = memo(({ workout, style }) => {
  return (
    <View style={[styles.card, style]}>
      {/* Top chain */}
      <View style={styles.chainContainer}>
        <View style={styles.chainLink} />
        <View style={styles.chainLink} />
        <View style={styles.brokenLink}>
          <View style={styles.brokenLeft} />
          <View style={styles.brokenRight} />
        </View>
        <View style={styles.chainLink} />
        <View style={styles.chainLink} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.header}>
          <Feather name="link-2" size={24} color="#666666" />
          <View style={styles.brokenIcon}>
            <View style={styles.crackLine} />
          </View>
        </View>

        <Text style={styles.label}>STREAK BROKEN</Text>
        <Text style={styles.title}>{workout?.title || "Workout"}</Text>

        {workout?.skipReason && (
          <View style={styles.reasonBox}>
            <View style={styles.reasonHeader}>
              <View style={styles.reasonDot} />
              <Text style={styles.reasonLabel}>Why?</Text>
            </View>
            <Text style={styles.reasonText}>{workout.skipReason}</Text>
          </View>
        )}

        {/* Broken pieces */}
        <View style={styles.piecesContainer}>
          <View style={styles.piece1} />
          <View style={styles.piece2} />
          <View style={styles.piece3} />
        </View>

        {/* Motivational message */}
        <View style={styles.motivationBox}>
          <Text style={styles.motivationText}>
            Every break is a chance to rebuild stronger
          </Text>
        </View>
      </View>
    </View>
  );
});

BrokenChainSkippedCard.displayName = "BrokenChainSkippedCard";

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  chainContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    backgroundColor: "#F5F5F5",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    gap: 8,
  },
  chainLink: {
    width: 40,
    height: 24,
    borderWidth: 3,
    borderColor: "#666666",
    borderRadius: 12,
  },
  brokenLink: {
    width: 40,
    height: 24,
    flexDirection: "row",
    gap: 8,
  },
  brokenLeft: {
    width: 16,
    height: 24,
    borderWidth: 3,
    borderColor: "#666666",
    borderRightWidth: 0,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  brokenRight: {
    width: 16,
    height: 24,
    borderWidth: 3,
    borderColor: "#666666",
    borderLeftWidth: 0,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  content: {
    padding: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    position: "relative",
  },
  brokenIcon: {
    position: "absolute",
  },
  crackLine: {
    width: 30,
    height: 3,
    backgroundColor: "#CC0000",
    transform: [{ rotate: "45deg" }],
  },
  label: {
    fontSize: 11,
    fontWeight: "900",
    color: "#CC0000",
    textAlign: "center",
    letterSpacing: 2,
    marginBottom: 12,
    includeFontPadding: false,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#333333",
    textAlign: "center",
    marginBottom: 24,
    includeFontPadding: false,
  },
  reasonBox: {
    backgroundColor: "#F9F9F9",
    borderLeftWidth: 4,
    borderLeftColor: "#CCCCCC",
    padding: 16,
    marginBottom: 20,
  },
  reasonHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  reasonDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#666666",
  },
  reasonLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#666666",
    includeFontPadding: false,
  },
  reasonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333333",
    includeFontPadding: false,
  },
  piecesContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginBottom: 20,
  },
  piece1: {
    width: 20,
    height: 20,
    backgroundColor: "#E0E0E0",
    transform: [{ rotate: "15deg" }],
  },
  piece2: {
    width: 16,
    height: 16,
    backgroundColor: "#CCCCCC",
    transform: [{ rotate: "-20deg" }],
  },
  piece3: {
    width: 18,
    height: 18,
    backgroundColor: "#D5D5D5",
    transform: [{ rotate: "35deg" }],
  },
  motivationBox: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  motivationText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#999999",
    textAlign: "center",
    fontStyle: "italic",
    includeFontPadding: false,
  },
});

export default BrokenChainSkippedCard;






















