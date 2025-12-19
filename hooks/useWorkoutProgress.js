import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Animated } from "react-native";
import * as Haptics from "expo-haptics";
import { getSetsCount } from "../utils/workoutHelpers";

/**
 * Custom hook for managing workout exercise progress
 * Handles set completion, progress calculation, and animations
 */
export function useWorkoutProgress(exercises) {
  // Initialize progress state from exercises
  const [progress, setProgress] = useState(() =>
    Object.fromEntries(
      exercises.map((exercise) => {
        const setsCount = getSetsCount(exercise.info);
        return [exercise.id, Array(setsCount).fill(false)];
      })
    )
  );

  // Animation refs for progress bar
  const progressBarWidth = useRef(new Animated.Value(0)).current;
  const progressBarScale = useRef(new Animated.Value(1)).current;

  // Computed values
  const totalSets = useMemo(() => {
    return exercises.reduce((sum, exercise) => {
      const setsCount = getSetsCount(exercise.info);
      return sum + setsCount;
    }, 0);
  }, [exercises]);

  const completedSetsCount = useMemo(() => {
    return exercises.reduce((sum, exercise) => {
      const sets = progress[exercise.id] || [];
      return sum + sets.filter(Boolean).length;
    }, 0);
  }, [progress, exercises]);

  const progressPercent = totalSets
    ? Math.round((completedSetsCount / totalSets) * 100)
    : 0;

  const completedExercisesCount = useMemo(() => {
    return exercises.filter(
      (exercise) => (progress[exercise.id] || []).every(Boolean)
    ).length;
  }, [progress, exercises]);

  const isComplete = completedExercisesCount === exercises.length;

  // Animate progress bar when progress changes
  useEffect(() => {
    Animated.spring(progressBarWidth, {
      toValue: progressPercent,
      useNativeDriver: false,
      tension: 50,
      friction: 8,
    }).start();

    if (progressPercent > 0) {
      Animated.sequence([
        Animated.spring(progressBarScale, {
          toValue: 1.05,
          useNativeDriver: true,
          tension: 100,
          friction: 5,
        }),
        Animated.spring(progressBarScale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 5,
        }),
      ]).start();
    }
  }, [progressPercent, progressBarWidth, progressBarScale]);

  // Toggle a single set
  const toggleSet = useCallback((exerciseId, setIndex) => {
    setProgress((currentProgress) => {
      const newSets = [...currentProgress[exerciseId]];
      newSets[setIndex] = !newSets[setIndex];

      // Haptic feedback based on completion
      if (newSets.every(Boolean)) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTimeout(() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }, 100);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      return { ...currentProgress, [exerciseId]: newSets };
    });
  }, []);

  // Toggle all sets for an exercise
  const toggleAllSets = useCallback((exerciseId) => {
    setProgress((currentProgress) => {
      const currentSets = currentProgress[exerciseId];
      const allCompleted = currentSets.every(Boolean);
      const newSets = Array(currentSets.length).fill(!allCompleted);

      // Haptic feedback
      if (!allCompleted) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      return { ...currentProgress, [exerciseId]: newSets };
    });
  }, []);

  // Add a new exercise to progress tracking
  const addExercise = useCallback((exercise) => {
    setProgress((currentProgress) => {
      const setsCount = getSetsCount(exercise.info);
      return {
        ...currentProgress,
        [exercise.id]: Array(setsCount).fill(false),
      };
    });
  }, []);

  // Remove an exercise from progress tracking
  const removeExercise = useCallback((exerciseId) => {
    setProgress((currentProgress) => {
      const newProgress = { ...currentProgress };
      delete newProgress[exerciseId];
      return newProgress;
    });
  }, []);

  // Reset all progress
  const resetProgress = useCallback(() => {
    setProgress(
      Object.fromEntries(
        exercises.map((exercise) => {
          const setsCount = getSetsCount(exercise.info);
          return [exercise.id, Array(setsCount).fill(false)];
        })
      )
    );
  }, [exercises]);

  // Get completed sets for a specific exercise
  const getExerciseProgress = useCallback(
    (exerciseId) => progress[exerciseId] || [],
    [progress]
  );

  // Check if an exercise is complete
  const isExerciseComplete = useCallback(
    (exerciseId) => {
      const sets = progress[exerciseId] || [];
      return sets.length > 0 && sets.every(Boolean);
    },
    [progress]
  );

  return {
    progress,
    totalSets,
    completedSetsCount,
    progressPercent,
    completedExercisesCount,
    isComplete,
    progressBarWidth,
    progressBarScale,
    toggleSet,
    toggleAllSets,
    addExercise,
    removeExercise,
    resetProgress,
    getExerciseProgress,
    isExerciseComplete,
  };
}

export default useWorkoutProgress;
