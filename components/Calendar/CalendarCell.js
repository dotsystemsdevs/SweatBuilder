/**
 * Reusable Calendar Cell Component
 * Extracted from WeekScreen for better code organization
 */

import React, { memo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import theme from "../../theme";

const CalendarCell = memo(({
  date,
  isSelected,
  isToday,
  isCompleted,
  isSkipped,
  isRest,
  hasWorkout,
  onPress,
  styles: customStyles,
}) => {
  return (
    <TouchableOpacity
      style={[styles.cell, customStyles?.cell]}
      activeOpacity={1}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
    >
      <View
        style={[
          styles.dayInner,
          isToday && !isSelected && styles.dayToday,
          isSelected && styles.daySelected,
          customStyles?.dayInner,
        ]}
      >
        {/* Status indicators at the top */}
        <View style={styles.dayTopSection}>
          {isCompleted && (
            <View style={[
              styles.dayIconContainer,
              styles.dayIconContainerCompleted,
              isSelected && styles.dayIconContainerSelected,
            ]}>
              <Feather
                name="check"
                size={12}
                color={isSelected ? theme.colors.black : theme.colors.white}
              />
            </View>
          )}
          {isSkipped && (
            <View style={[
              styles.dayIconContainer,
              styles.dayIconContainerSkipped,
              isSelected && styles.dayIconContainerSelected,
            ]}>
              <Feather
                name="x"
                size={12}
                color={isSelected ? theme.colors.black : theme.colors.white}
              />
            </View>
          )}
          {!isCompleted && !isSkipped && !isRest && hasWorkout && (
            <View style={[
              styles.dayDot,
              isSelected && styles.dayDotSelected,
            ]} />
          )}
        </View>
        {/* Date number at the bottom */}
        <Text style={[
          styles.dayNumber,
          isSelected && styles.dayNumberSelected,
        ]}>
          {date}
        </Text>
      </View>
    </TouchableOpacity>
  );
});

CalendarCell.displayName = "CalendarCell";

const styles = StyleSheet.create({
  cell: {
    // Base cell styles - can be overridden
  },
  dayInner: {
    width: "100%",
    minHeight: 56,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
    paddingHorizontal: 4,
    backgroundColor: theme.colors.surface,
    position: "relative",
    borderWidth: 1,
    borderColor: theme.colors.border,
    flexDirection: "column",
  },
  dayToday: {
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.yellow,
  },
  daySelected: {
    backgroundColor: theme.colors.yellow,
    borderWidth: 0,
  },
  dayTopSection: {
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 4,
    height: 24,
    width: "100%",
  },
  dayIconContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0,
  },
  dayIconContainerCompleted: {
    backgroundColor: theme.colors.green,
  },
  dayIconContainerSkipped: {
    backgroundColor: theme.colors.textMuted,
  },
  dayIconContainerSelected: {
    backgroundColor: theme.colors.black,
  },
  dayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.yellow,
  },
  dayDotSelected: {
    backgroundColor: theme.colors.black,
  },
  dayNumber: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.text,
    letterSpacing: -0.2,
    includeFontPadding: false,
    lineHeight: 18,
    opacity: 1,
    paddingBottom: 2,
  },
  dayNumberSelected: {
    color: theme.colors.black,
    fontWeight: "700",
    opacity: 1,
  },
});

export default CalendarCell;














