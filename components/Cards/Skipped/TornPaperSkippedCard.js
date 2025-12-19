import React, { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

const TornPaperSkippedCard = memo(({ workout, style }) => {
  return (
    <View style={[styles.card, style]}>
      {/* Torn top edge */}
      <View style={styles.tornTop}>
        {[...Array(15)].map((_, i) => (
          <View
            key={i}
            style={[
              styles.tornPiece,
              { height: Math.random() * 8 + 4 }
            ]}
          />
        ))}
      </View>

      <View style={styles.content}>
        {/* Crossed out text */}
        <View style={styles.crossedOut}>
          <Text style={styles.crossedText}>{workout?.title || "WORKOUT"}</Text>
          <View style={styles.strikethrough} />
        </View>

        {/* Stamp */}
        <View style={styles.stamp}>
          <View style={styles.stampBorder}>
            <Feather name="x" size={40} color="#666666" />
            <Text style={styles.stampText}>SKIPPED</Text>
          </View>
        </View>

        {/* Handwritten reason */}
        {workout?.skipReason && (
          <View style={styles.reasonSection}>
            <Text style={styles.reasonLabel}>Reason:</Text>
            <Text style={styles.reasonText}>{workout.skipReason}</Text>
            <View style={styles.underline} />
          </View>
        )}

        {/* Crumpled corner indicator */}
        <View style={styles.crumpledCorner} />
      </View>
    </View>
  );
});

TornPaperSkippedCard.displayName = "TornPaperSkippedCard";

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#F5F5F5",
    overflow: "hidden",
  },
  tornTop: {
    flexDirection: "row",
    backgroundColor: "#E0E0E0",
  },
  tornPiece: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    backgroundColor: "#FFFFFF",
    padding: 24,
    minHeight: 240,
  },
  crossedOut: {
    position: "relative",
    alignItems: "center",
    marginBottom: 30,
  },
  crossedText: {
    fontSize: 28,
    fontWeight: "700",
    color: "#CCCCCC",
    letterSpacing: -0.5,
    includeFontPadding: false,
  },
  strikethrough: {
    position: "absolute",
    width: "100%",
    height: 3,
    backgroundColor: "#666666",
    top: "50%",
    transform: [{ rotate: "-5deg" }],
  },
  stamp: {
    alignSelf: "center",
    marginBottom: 30,
    transform: [{ rotate: "8deg" }],
  },
  stampBorder: {
    borderWidth: 4,
    borderColor: "#666666",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    opacity: 0.6,
  },
  stampText: {
    fontSize: 18,
    fontWeight: "900",
    color: "#666666",
    letterSpacing: 3,
    marginTop: 8,
    includeFontPadding: false,
  },
  reasonSection: {
    marginTop: 20,
  },
  reasonLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#999999",
    marginBottom: 8,
    includeFontPadding: false,
  },
  reasonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#666666",
    fontStyle: "italic",
    includeFontPadding: false,
  },
  underline: {
    height: 1,
    backgroundColor: "#CCCCCC",
    marginTop: 8,
    width: "80%",
  },
  crumpledCorner: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    backgroundColor: "#E0E0E0",
    borderTopLeftRadius: 40,
  },
});

export default TornPaperSkippedCard;






















