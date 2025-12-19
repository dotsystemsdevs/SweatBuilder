import React, { memo, useMemo } from "react";
import { View, Text, TouchableOpacity, Animated, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Swipeable } from "react-native-gesture-handler";
import * as Haptics from "expo-haptics";
import PropTypes from "prop-types";
import theme from "../../theme";
import SetButton from "./SetButton";

const ExerciseItem = memo(({
  exercise,
  exerciseNumber,
  totalExercises,
  completedSets,
  onToggleSet,
  onToggleAllSets,
  onReplace,
  onNote,
  hasNote,
  slideAnim,
}) => {
  const allSetsCompleted = useMemo(() => completedSets.every(Boolean), [completedSets]);
  const completedCount = useMemo(() => completedSets.filter(Boolean).length, [completedSets]);

  const handleToggleAll = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onToggleAllSets();
  };

  const renderLeftActions = () => (
    <View style={styles.swipeActionsLeft}>
      <TouchableOpacity
        style={[styles.swipeButton, styles.swipeReplace]}
        onPress={onReplace}
        activeOpacity={0.7}
      >
        <Feather name="repeat" size={18} color={theme.colors.black} />
        <Text style={styles.swipeText}>Replace</Text>
      </TouchableOpacity>
    </View>
  );

  const renderRightActions = () => (
    <View style={styles.swipeActions}>
      <TouchableOpacity
        style={[styles.swipeButton, styles.swipeNote]}
        onPress={onNote}
        activeOpacity={0.7}
      >
        <Feather name="edit-3" size={18} color={theme.colors.white} />
        <Text style={styles.swipeTextLight}>Note</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Swipeable
      renderLeftActions={renderLeftActions}
      renderRightActions={renderRightActions}
      overshootLeft={false}
      overshootRight={false}
      leftThreshold={50}
      rightThreshold={50}
      friction={1.5}
    >
      <Animated.View
        style={[
          styles.exerciseRow,
          allSetsCompleted && styles.exerciseRowCompleted,
          { transform: [{ translateX: slideAnim }] },
        ]}
      >
        <View style={styles.numberBadge}>
          <Text style={[styles.numberText, allSetsCompleted && styles.numberTextCompleted]}>
            {exerciseNumber}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.exerciseInfo}
          onPress={handleToggleAll}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`Exercise ${exerciseNumber} of ${totalExercises}: ${exercise.name}, ${completedCount} of ${completedSets.length} sets done`}
        >
          <View style={styles.exerciseHeader}>
            <Text style={[styles.exerciseName, allSetsCompleted && styles.exerciseNameCompleted]}>
              {exercise.name}
            </Text>
            {allSetsCompleted && (
              <Feather name="check-circle" size={16} color={theme.colors.green} />
            )}
            {hasNote && !allSetsCompleted && (
              <Feather name="file-text" size={14} color={theme.colors.textMuted} />
            )}
          </View>
          <Text style={styles.exerciseDetails}>{exercise.info}</Text>
        </TouchableOpacity>

        <View style={styles.setsContainer}>
          {completedSets.map((isCompleted, index) => (
            <SetButton
              key={index}
              isCompleted={isCompleted}
              onPress={() => onToggleSet(index)}
            />
          ))}
        </View>
      </Animated.View>
    </Swipeable>
  );
});

ExerciseItem.displayName = "ExerciseItem";

ExerciseItem.propTypes = {
  exercise: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    info: PropTypes.string.isRequired,
  }).isRequired,
  exerciseNumber: PropTypes.number.isRequired,
  totalExercises: PropTypes.number.isRequired,
  completedSets: PropTypes.arrayOf(PropTypes.bool).isRequired,
  onToggleSet: PropTypes.func.isRequired,
  onToggleAllSets: PropTypes.func.isRequired,
  onReplace: PropTypes.func.isRequired,
  onNote: PropTypes.func.isRequired,
  hasNote: PropTypes.bool,
  slideAnim: PropTypes.object.isRequired,
};

ExerciseItem.defaultProps = {
  hasNote: false,
};

const styles = StyleSheet.create({
  exerciseRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.screenPadding,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    minHeight: 80,
    gap: theme.spacing.md,
  },
  exerciseRowCompleted: {
    backgroundColor: theme.colors.background,
  },
  numberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.surfaceHover,
    alignItems: "center",
    justifyContent: "center",
  },
  numberText: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.textMuted,
  },
  numberTextCompleted: {
    color: theme.colors.green,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    marginBottom: 4,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.text,
    letterSpacing: -0.2,
  },
  exerciseNameCompleted: {
    color: theme.colors.textMuted,
    textDecorationLine: "line-through",
  },
  exerciseDetails: {
    fontSize: 14,
    color: theme.colors.textMuted,
  },
  setsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
  },

  // Swipe actions
  swipeActions: {
    flexDirection: "row",
  },
  swipeActionsLeft: {
    flexDirection: "row",
  },
  swipeButton: {
    width: 80,
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
  swipeReplace: {
    backgroundColor: theme.colors.yellow,
  },
  swipeNote: {
    backgroundColor: theme.colors.purple,
  },
  swipeText: {
    color: theme.colors.black,
    fontWeight: "600",
    fontSize: 12,
  },
  swipeTextLight: {
    color: theme.colors.white,
    fontWeight: "600",
    fontSize: 12,
  },
});

export default ExerciseItem;
