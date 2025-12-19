/**
 * Reusable Weekday Labels Component
 */

import React, { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { DAYS_OF_WEEK } from "../../constants/appConstants";
import theme from "../../theme";

const WeekdayLabels = memo(({ 
  activeIndex = null,
  styles: customStyles,
  cellWidth,
}) => {
  return (
    <View style={[styles.container, customStyles?.container]}>
      {DAYS_OF_WEEK.map((day, index) => {
        const isActive = activeIndex === index;
        return (
          <View
            key={day}
            style={[
              styles.chip,
              isActive && styles.chipActive,
              cellWidth && { width: cellWidth },
              customStyles?.chip,
            ]}
          >
            <Text style={[
              styles.label,
              isActive && styles.labelActive,
              customStyles?.label,
            ]}>
              {day}
            </Text>
          </View>
        );
      })}
    </View>
  );
});

WeekdayLabels.displayName = "WeekdayLabels";

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 3,
    justifyContent: "center",
    marginBottom: theme.spacing.sm,
  },
  chip: {
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.sm,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0,
  },
  chipActive: {
    backgroundColor: theme.colors.backgroundSecondary,
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
    color: theme.colors.textMuted,
    letterSpacing: 0.2,
    textTransform: "uppercase",
    includeFontPadding: false,
  },
  labelActive: {
    color: theme.colors.textTitle,
  },
});

export default WeekdayLabels;























