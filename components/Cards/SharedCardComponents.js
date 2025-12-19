import React, { useState, useEffect, useRef, useMemo, memo, useCallback } from "react";
import {
  Text,
  TouchableOpacity,
  View,
  Animated,
  Easing,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import {
  styles,
  getMoodConfig,
  configureLayoutAnimation,
  NOTES_EXPANSION_THRESHOLD,
  ANIMATION_DURATION,
} from "./workoutCardStyles";

// MoodDisplay Component
export const MoodDisplay = memo(({ mood }) => {
  if (!mood) return null;

  const moodConfig = useMemo(() => getMoodConfig(mood), [mood]);
  const capitalizedMood = useMemo(() =>
    mood.charAt(0).toUpperCase() + mood.slice(1),
    [mood]
  );

  return (
    <View style={styles.cardMoodSection} >
      <Text style={styles.cardMoodTitle} accessibilityLabel="Reflection">Reflection</Text>
      <View
        style={[styles.moodBadge, { backgroundColor: moodConfig.bgColor }]}
        accessibilityLabel={`Mood: ${capitalizedMood}`}
      >
        <Text style={styles.moodEmoji} accessibilityRole="none">{moodConfig.emoji}</Text>
        <Text style={[styles.cardValue, { color: moodConfig.color }]}>
          {capitalizedMood}
        </Text>
      </View>
    </View>
  );
});

MoodDisplay.displayName = "MoodDisplay";

// ExerciseList Component
export const ExerciseList = memo(({ exercises }) => {
  if (!exercises || exercises.length === 0) return null;

  return (
    <View style={styles.exercisesList} accessible={false}>
      {exercises.map((exercise, index) => {
        if (!exercise) return null;
        return (
          <View
            key={exercise.id || `exercise-${index}`}
            style={[styles.exerciseItem, index === 0 && styles.exerciseItemFirst]}
            accessible={true} accessibilityLabel={`Exercise: ${exercise.name || "Exercise"}${exercise.info || exercise.details ? `. ${exercise.info || exercise.details}` : ""}`}
          >
            <Text style={styles.exerciseName} numberOfLines={1}>
              {exercise.name || "Exercise"}
            </Text>
            {(exercise.info || exercise.details) && (
              <Text style={styles.exerciseDetails}>
                {exercise.info || exercise.details}
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
});

ExerciseList.displayName = "ExerciseList";

// ExerciseToggle Component - Self-contained with internal state fallback
export const ExerciseToggle = memo(({ exercises, expanded: externalExpanded, onToggle, type = "list" }) => {
  // Use internal state as fallback if external control not fully provided
  const [internalExpanded, setInternalExpanded] = useState(false);
  const isControlled = externalExpanded !== undefined && onToggle !== undefined;
  const expanded = isControlled ? externalExpanded : internalExpanded;

  const chevronRotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(chevronRotation, {
      toValue: expanded ? 1 : 0,
      duration: ANIMATION_DURATION,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [expanded, chevronRotation]);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    configureLayoutAnimation();
    if (isControlled && onToggle) {
      onToggle();
    } else {
      setInternalExpanded(prev => !prev);
    }
  }, [isControlled, onToggle]);

  if (type === "rest") {
    return (
      <View style={styles.exercisesContainer}>
        <View style={styles.exercisesToggleRest}>
          <View style={styles.exercisesToggleLeft}>
            <Feather name="moon" size={16} color="rgba(255, 255, 255, 0.5)" />
            <Text style={styles.exercisesToggleTextRest}>No exercises today</Text>
          </View>
        </View>
      </View>
    );
  }

  const exerciseCount = exercises?.length || 0;

  if (exerciseCount === 0) {
    return null;
  }

  return (
    <View style={styles.exercisesContainer}>
      <TouchableOpacity
        style={styles.exercisesToggle}
        onPress={handlePress}
        activeOpacity={0.6}
        accessibilityRole="button"
        accessibilityLabel={`${exerciseCount} exercises. ${expanded ? 'Tap to collapse' : 'Tap to expand'}`}
      >
        <View style={styles.exercisesToggleLeft} pointerEvents="none">
          <Feather name="list" size={16} color="#F4F6FB" />
          <Text style={styles.exercisesToggleText}>
            {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}
          </Text>
        </View>
        <Animated.View
          pointerEvents="none"
          style={{
            transform: [{
              rotate: chevronRotation.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '180deg'],
              })
            }],
          }}
        >
          <Feather
            name="chevron-down"
            size={20}
            color="rgba(255,255,255,0.8)"
          />
        </Animated.View>
      </TouchableOpacity>
      {expanded && exercises && exercises.length > 0 && (
        <ExerciseList exercises={exercises} />
      )}
    </View>
  );
});

ExerciseToggle.displayName = "ExerciseToggle";

// ExpandableNotes Component
export const ExpandableNotes = memo(({ notes }) => {
  const [expanded, setExpanded] = useState(false);

  const handleToggle = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    configureLayoutAnimation();
    setExpanded(prev => !prev);
  }, []);

  const needsExpansion = useMemo(() => {
    return notes && notes.length > NOTES_EXPANSION_THRESHOLD;
  }, [notes]);

  if (!notes) return null;

  return (
    <View style={styles.cardNotes}>
      <Text style={styles.cardNotesText} numberOfLines={expanded ? undefined : 2}>
        {notes}
      </Text>
      {needsExpansion && (
        <TouchableOpacity
          onPress={handleToggle}
          activeOpacity={0.6}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={`${expanded ? 'Collapse' : 'Expand'} notes`}
          style={styles.cardNotesToggleButton}
        >
          <Text style={styles.cardNotesToggle}>
            {expanded ? 'Show less' : 'Show more'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
});

ExpandableNotes.displayName = "ExpandableNotes";
