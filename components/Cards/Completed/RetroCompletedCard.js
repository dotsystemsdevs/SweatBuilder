import React, { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

const RetroCompletedCard = memo(({ workout, style }) => {
  return (
    <View style={[styles.card, style]}>
      {/* Outer border */}
      <View style={styles.outerBorder}>
        {/* Inner content */}
        <View style={styles.innerContent}>
          {/* Corner decorations */}
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerBar} />
            <Text style={styles.status}>✓ DONE</Text>
            <View style={styles.headerBar} />
          </View>

          {/* Title */}
          <Text style={styles.title}>{workout?.title || "WORKOUT"}</Text>

          {/* Mood indicator */}
          {workout?.mood && (
            <View style={styles.moodSection}>
              <View style={styles.moodBoxes}>
                {[1, 2, 3, 4, 5].map((level) => (
                  <View
                    key={level}
                    style={[
                      styles.moodBox,
                      level <= 4 && styles.moodBoxFilled,
                    ]}
                  />
                ))}
              </View>
              <Text style={styles.moodLabel}>ENERGY LEVEL</Text>
            </View>
          )}

          {/* Notes */}
          {workout?.notes && (
            <View style={styles.notesBox}>
              <Text style={styles.notesLabel}>NOTES:</Text>
              <Text style={styles.notesText} numberOfLines={2}>
                {workout.notes}
              </Text>
            </View>
          )}

          {/* Footer stamp */}
          <View style={styles.stamp}>
            <Text style={styles.stampText}>COMPLETED</Text>
          </View>
        </View>
      </View>
    </View>
  );
});

RetroCompletedCard.displayName = "RetroCompletedCard";

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#F5F5F5",
    padding: 4,
  },
  outerBorder: {
    borderWidth: 3,
    borderColor: "#000000",
    backgroundColor: "#FFFFFF",
  },
  innerContent: {
    borderWidth: 1,
    borderColor: "#000000",
    padding: 20,
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 12,
    height: 12,
    borderColor: "#000000",
  },
  cornerTL: {
    top: -1,
    left: -1,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  cornerTR: {
    top: -1,
    right: -1,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  cornerBL: {
    bottom: -1,
    left: -1,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  cornerBR: {
    bottom: -1,
    right: -1,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  headerBar: {
    flex: 1,
    height: 2,
    backgroundColor: "#000000",
  },
  status: {
    fontSize: 11,
    fontWeight: "900",
    color: "#000000",
    letterSpacing: 2,
    includeFontPadding: false,
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: "#000000",
    letterSpacing: 1,
    textAlign: "center",
    marginBottom: 20,
    includeFontPadding: false,
    textTransform: "uppercase",
  },
  moodSection: {
    alignItems: "center",
    marginBottom: 16,
  },
  moodBoxes: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 8,
  },
  moodBox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: "#000000",
    backgroundColor: "#FFFFFF",
  },
  moodBoxFilled: {
    backgroundColor: "#000000",
  },
  moodLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "#666666",
    letterSpacing: 1,
    includeFontPadding: false,
  },
  notesBox: {
    borderWidth: 2,
    borderColor: "#CCCCCC",
    padding: 12,
    marginBottom: 16,
  },
  notesLabel: {
    fontSize: 9,
    fontWeight: "900",
    color: "#000000",
    letterSpacing: 1,
    marginBottom: 6,
    includeFontPadding: false,
  },
  notesText: {
    fontSize: 11,
    fontWeight: "500",
    color: "#666666",
    lineHeight: 16,
    includeFontPadding: false,
  },
  stamp: {
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderWidth: 3,
    borderColor: "#000000",
    transform: [{ rotate: "-5deg" }],
  },
  stampText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#000000",
    letterSpacing: 3,
    includeFontPadding: false,
  },
});

export default RetroCompletedCard;






















