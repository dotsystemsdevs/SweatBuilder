import React, { memo } from "react";
import { View, Text, Animated, StyleSheet } from "react-native";
import PropTypes from "prop-types";
import theme from "../../theme";

const ProgressHeader = memo(({
  completedSetsCount,
  totalSets,
  progressPercent,
  progressBarWidth,
}) => {
  const isComplete = progressPercent === 100;

  return (
    <View style={styles.container}>
      <View style={styles.statsRow}>
        <Text style={styles.statsText}>
          <Text style={styles.statsValue}>{completedSetsCount}</Text>
          <Text style={styles.statsLabel}> of {totalSets} sets</Text>
        </Text>
        <Text style={[styles.percentText, isComplete && styles.percentComplete]}>
          {progressPercent}%
        </Text>
      </View>
      <View style={styles.progressTrack}>
        <Animated.View
          style={[
            styles.progressFill,
            isComplete && styles.progressFillComplete,
            {
              width: progressBarWidth.interpolate({
                inputRange: [0, 100],
                outputRange: ["0%", "100%"],
                extrapolate: "clamp",
              }),
            },
          ]}
        />
      </View>
    </View>
  );
});

ProgressHeader.displayName = "ProgressHeader";

ProgressHeader.propTypes = {
  completedSetsCount: PropTypes.number.isRequired,
  totalSets: PropTypes.number.isRequired,
  progressPercent: PropTypes.number.isRequired,
  progressBarWidth: PropTypes.object.isRequired,
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: theme.spacing.screenPadding,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing.sm,
  },
  statsText: {
    fontSize: 14,
  },
  statsValue: {
    fontWeight: "700",
    color: theme.colors.text,
  },
  statsLabel: {
    fontWeight: "500",
    color: theme.colors.textMuted,
  },
  percentText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.textMuted,
  },
  percentComplete: {
    color: theme.colors.green,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.border,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
    backgroundColor: theme.colors.text,
  },
  progressFillComplete: {
    backgroundColor: theme.colors.green,
  },
});

export default ProgressHeader;
