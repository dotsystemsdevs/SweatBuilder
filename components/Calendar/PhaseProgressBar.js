/**
 * Reusable Phase Progress Bar Component
 * Shows training phase progress with dividers and labels
 */

import React, { memo, useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { getPhaseInfo } from "../../utils/phaseHelpers";
import { PHASE_CONFIG } from "../../utils/phaseHelpers";
import theme from "../../theme";

const PhaseProgressBar = memo(({ date, styles: customStyles }) => {
  const phaseInfo = useMemo(() => getPhaseInfo(date), [date]);
  const { progress, weekNum } = phaseInfo;

  // Calculate divider positions (0%, 25%, 50%, 75%, 100%)
  const dividerPositions = useMemo(() => {
    return PHASE_CONFIG.boundaries.map((boundary) => ({
      position: `${boundary}%`,
      left: `${boundary}%`,
    }));
  }, []);

  return (
    <View style={[styles.container, customStyles?.container]}>
      <View style={[styles.track, customStyles?.track]}>
        <View
          style={[
            styles.fill,
            { width: `${progress}%` },
            customStyles?.fill,
          ]}
        />
        {dividerPositions.map((divider, index) => (
          <View
            key={index}
            style={[
              styles.divider,
              { left: divider.left },
              customStyles?.divider,
            ]}
          />
        ))}
      </View>
      <View style={[styles.labelsRow, customStyles?.labelsRow]}>
        {PHASE_CONFIG.phases.map((phase, index) => {
          const isCurrentPhase = phaseInfo.phase === phase;
          return (
            <View
              key={phase}
              style={[styles.labelContainer, customStyles?.labelContainer]}
            >
              <Text
                style={[
                  styles.label,
                  isCurrentPhase && styles.labelActive,
                  customStyles?.label,
                ]}
              >
                {phase.replace(" Phase", "")}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
});

PhaseProgressBar.displayName = "PhaseProgressBar";

const styles = StyleSheet.create({
  container: {
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.screenPadding,
  },
  track: {
    width: "100%",
    height: 3,
    borderRadius: 1.5,
    backgroundColor: theme.colors.outline,
    overflow: "visible",
    position: "relative",
    marginBottom: theme.spacing.xs,
  },
  fill: {
    height: "100%",
    backgroundColor: theme.colors.textTitle,
    borderRadius: 1.5,
  },
  divider: {
    position: "absolute",
    top: -1.5,
    width: 1,
    height: 6,
    backgroundColor: theme.colors.textTitle,
    opacity: 0.4,
  },
  labelsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  labelContainer: {
    alignItems: "center",
  },
  label: {
    fontSize: 10,
    fontWeight: "500",
    color: theme.colors.textMuted,
    textAlign: "center",
    letterSpacing: 0,
    includeFontPadding: false,
    opacity: 0.7,
  },
  labelActive: {
    opacity: 1,
    fontWeight: "600",
  },
});

export default PhaseProgressBar;

