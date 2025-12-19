import React, { useMemo, useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Animated,
  Platform,
  UIManager,
  Modal,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import { StatusBar } from "expo-status-bar";
import theme from "../theme";
import { useWorkoutStore } from "../store/workoutStore";
import { useStatusBar } from "../hooks/useStatusBar";
import DynamicSafeAreaView from "../components/DynamicSafeAreaView";
import { generateId } from "../utils/idGenerator";
import { getSetsCount } from "../utils/workoutHelpers";
import { Feather } from "@expo/vector-icons";
import {
  ExerciseItem,
  ProgressHeader,
  ExerciseNoteModal,
} from "../components/Workout";
import { getStorageItem, setStorageItem, STORAGE_KEYS } from "../utils/storage";

// Enable LayoutAnimation on Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function WorkoutModeScreen() {
  useStatusBar(theme.colors.screenBackground);
  const navigation = useNavigation();
  const {
    workout,
    completeWorkout,
    notes,
    setNotes,
    setExerciseNotes,
  } = useWorkoutStore();

  // Initial haptic feedback
  useEffect(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }, []);

  // State
  const [exercises, setExercises] = useState(workout.exercises);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const [replaceExercise, setReplaceExercise] = useState(null);
  const [showExitModal, setShowExitModal] = useState(false);
  const [replaceAlternatives, setReplaceAlternatives] = useState([]);
  const [isFinishing, setIsFinishing] = useState(false);
  const finishCheckmarkOpacity = useRef(new Animated.Value(0)).current;
  const finishTextOpacity = useRef(new Animated.Value(1)).current;
  const scrollViewRef = useRef(null);
  const openSwipeableRef = useRef(null);
  const exerciseRefs = useRef({});
  const scrollOffset = useRef(0);
  const scrollViewHeight = useRef(0);

  // Progress state - lifted from exercises
  const [progress, setProgress] = useState(() =>
    Object.fromEntries(
      exercises.map((exercise) => {
        const setsCount = getSetsCount(exercise.info);
        return [exercise.id, Array(setsCount).fill(false)];
      })
    )
  );

  // Animation refs
  const slideAnimations = useRef(
    exercises.reduce((acc, exercise) => {
      acc[exercise.id] = new Animated.Value(0);
      return acc;
    }, {})
  ).current;

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


  const allExercisesComplete = completedExercisesCount === exercises.length && exercises.length > 0;
  const hasAutoFinished = useRef(false);

  const buttonScale = useRef(new Animated.Value(1)).current;

  // Animate progress bar width with 0.2s ease
  useEffect(() => {
    Animated.timing(progressBarWidth, {
      toValue: progressPercent,
      duration: 200,
      easing: (t) => t * (2 - t), // ease-out
      useNativeDriver: false,
    }).start();
  }, [progressPercent, progressBarWidth]);

  // Celebration when all exercises complete + auto-open Reflection
  useEffect(() => {
    if (allExercisesComplete && !hasAutoFinished.current) {
      hasAutoFinished.current = true;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Pulse the finish button
      Animated.sequence([
        Animated.spring(buttonScale, {
          toValue: 1.05,
          useNativeDriver: true,
          tension: 200,
          friction: 5,
        }),
        Animated.spring(buttonScale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 200,
          friction: 5,
        }),
      ]).start();

      // Auto-open Reflection after a short delay
      setTimeout(() => {
        if (!isFinishing) {
          handleFinish();
        }
      }, 800);
    } else if (!allExercisesComplete) {
      // Reset flag if workout is incomplete again
      hasAutoFinished.current = false;
    }
  }, [allExercisesComplete, buttonScale, isFinishing, handleFinish]);

  // Helper function to scroll to exercise
  const scrollToExercise = useCallback((exerciseId, delay = 300) => {
    setTimeout(() => {
      if (scrollViewRef.current && exerciseRefs.current[exerciseId]) {
        exerciseRefs.current[exerciseId].measureLayout(
          scrollViewRef.current,
          (_x, y) => {
            // Only scroll if exercise is not visible
            const isVisible = y >= scrollOffset.current &&
              y < scrollOffset.current + scrollViewHeight.current - 100;

            if (!isVisible) {
              scrollViewRef.current.scrollTo({ y: Math.max(0, y - 80), animated: true });
            }
          },
          () => {
            // Fallback to approximate position
            const exerciseIndex = exercises.findIndex(e => e.id === exerciseId);
            const approximateY = exerciseIndex * 72 + 100;
            scrollViewRef.current.scrollTo({ y: approximateY, animated: true });
          }
        );
      }
    }, delay);
  }, [exercises]);

  // Handlers
  const handleToggleSet = useCallback((exerciseId, setIndex) => {
    setProgress((currentProgress) => {
      const newSets = [...currentProgress[exerciseId]];
      newSets[setIndex] = !newSets[setIndex];
      const wasCompleted = currentProgress[exerciseId]?.[setIndex];
      const isNowCompleted = newSets[setIndex];

      // Auto-scroll when a set is completed (not just when exercise is done)
      if (isNowCompleted && !wasCompleted) {
        // Scroll to current exercise to show the completed set
        scrollToExercise(exerciseId, 200);
      }

      if (newSets.every(Boolean)) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTimeout(() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }, 100);

        // Auto-scroll to next incomplete exercise using newProgress
        const newProgress = { ...currentProgress, [exerciseId]: newSets };
        setTimeout(() => {
          const currentIndex = exercises.findIndex(e => e.id === exerciseId);
          const nextIncomplete = exercises.slice(currentIndex + 1).find(e =>
            !(newProgress[e.id] || []).every(Boolean)
          );

          if (nextIncomplete) {
            scrollToExercise(nextIncomplete.id, 400);
          }
        }, 600);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      return { ...currentProgress, [exerciseId]: newSets };
    });
  }, [exercises, scrollToExercise]);

  const handleToggleAllSets = useCallback((exerciseId) => {
    setProgress((currentProgress) => {
      const currentSets = currentProgress[exerciseId];
      const allCompleted = currentSets.every(Boolean);
      const newSets = Array(currentSets.length).fill(!allCompleted);
      return { ...currentProgress, [exerciseId]: newSets };
    });
  }, []);

  const handleReplaceExercise = useCallback(
    (exerciseToReplace) => {
      // Generate 2 alternatives
      const alternativeNames = {
        // Push exercises
        "Bench Press": ["Dumbbell Press", "Push-ups"],
        "Dumbbell Press": ["Bench Press", "Push-ups"],
        "Push-ups": ["Incline Press", "Chest Fly"],
        "Incline Press": ["Bench Press", "Chest Fly"],
        // Pull exercises
        "Pull-ups": ["Lat Pulldown", "Rows"],
        "Lat Pulldown": ["Pull-ups", "Cable Rows"],
        "Rows": ["Cable Rows", "Barbell Rows"],
        "Barbell Rows": ["Dumbbell Rows", "Cable Rows"],
        // Other
        "Light Cardio": ["Jump Rope", "Rowing"],
        "Dynamic Stretches": ["Arm Circles", "Leg Swings"],
        "Static Stretches": ["Foam Rolling", "Yoga Poses"],
      };

      const alternatives = alternativeNames[exerciseToReplace.name] ||
        [`Alternative ${exerciseToReplace.name} 1`, `Alternative ${exerciseToReplace.name} 2`];

      setReplaceExercise(exerciseToReplace);
      setReplaceAlternatives(alternatives);
      setShowReplaceModal(true);
    },
    []
  );

  const handleCloseReplaceModal = useCallback(() => {
    setShowReplaceModal(false);
    setReplaceExercise(null);
    setReplaceAlternatives([]);
  }, []);

  const handleSelectReplacement = useCallback((alternativeName) => {
    if (replaceExercise) {
      replaceWithExercise(replaceExercise, alternativeName);
    }
    handleCloseReplaceModal();
  }, [replaceExercise, handleCloseReplaceModal]);

  const replaceWithExercise = useCallback((exerciseToReplace, newName) => {
    const exerciseId = exerciseToReplace.id;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Animated.timing(slideAnimations[exerciseId], {
      toValue: 400,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      const newExercise = {
        id: generateId(),
        name: newName,
        info: exerciseToReplace.info || "3x12",
        type: exerciseToReplace.type || "gym",
        category: exerciseToReplace.category,
      };

      slideAnimations[newExercise.id] = new Animated.Value(-400);

      setExercises((currentExercises) => {
        const index = currentExercises.findIndex((e) => e.id === exerciseId);
        const updatedExercises = [...currentExercises];
        updatedExercises[index] = newExercise;
        return updatedExercises;
      });

      setProgress((currentProgress) => {
        const newProgress = { ...currentProgress };
        delete newProgress[exerciseId];
        const setsCount = getSetsCount(newExercise.info);
        newProgress[newExercise.id] = Array(setsCount).fill(false);
        return newProgress;
      });

      setTimeout(() => {
        Animated.spring(slideAnimations[newExercise.id], {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 7,
        }).start();
      }, 30);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    });
  }, [slideAnimations]);

  const handleFinish = useCallback(() => {
    if (isFinishing) return;

    setIsFinishing(true);

    // Fade out text, then show checkmark (like SaveButton)
    Animated.timing(finishTextOpacity, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      // Show checkmark after text fades
      Animated.timing(finishCheckmarkOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    });

    // Parse notes text to extract @-mentions and create exerciseNotes object
    if (notes && notes.trim()) {
      const exerciseNotesObj = {};
      // Match @ExerciseName followed by text until next @ or end
      const mentionRegex = /@(\w+)\s+([^@]*)/g;
      let match;

      while ((match = mentionRegex.exec(notes)) !== null) {
        const mentionName = match[1].toLowerCase();
        const noteText = match[2].trim();

        // Find matching exercise by name (case-insensitive, no spaces)
        const matchingExercise = exercises.find(
          (ex) => ex.name.replace(/\s+/g, '').toLowerCase() === mentionName
        );

        if (matchingExercise && noteText) {
          exerciseNotesObj[matchingExercise.id] = noteText;
        }
      }

      // Set exercise notes in store before completing
      if (Object.keys(exerciseNotesObj).length > 0) {
        setExerciseNotes(exerciseNotesObj);
      }
    }

    // Delay navigation to show completion state
    setTimeout(() => {
      // Pass exercise progress (set completion status) to completeWorkout
      completeWorkout(progress);
      navigation.navigate("Reflection");
    }, 500);
  }, [completeWorkout, navigation, notes, exercises, setExerciseNotes, progress, isFinishing, finishTextOpacity, finishCheckmarkOpacity]);

  const handleExit = useCallback(() => {
    if (completedSetsCount > 0) {
      setShowExitModal(true);
    } else {
      navigation.goBack();
    }
  }, [completedSetsCount]);

  const handleConfirmExit = useCallback(() => {
    setShowExitModal(false);
    navigation.goBack();
  }, [navigation]);

  const handleCancelExit = useCallback(() => {
    setShowExitModal(false);
  }, []);

  const handleOpenNote = useCallback(() => {
    setShowNoteInput(true);
  }, []);

  const handleCloseNote = useCallback(() => {
    setShowNoteInput(false);
  }, []);

  const handleNoteChange = useCallback((text) => {
    setNotes(text);
  }, [setNotes]);

  const handleSwipeOpen = useCallback((swipeableRef) => {
    if (openSwipeableRef.current && openSwipeableRef.current !== swipeableRef) {
      openSwipeableRef.current.current?.close();
    }
    openSwipeableRef.current = swipeableRef;
  }, []);

  const anyModalOpen = showNoteInput || showReplaceModal;

  return (
    <View style={styles.rootContainer}>
      <StatusBar
        style={anyModalOpen ? "light" : "dark"}
        backgroundColor={anyModalOpen ? "rgba(0, 0, 0, 0.5)" : "transparent"}
        translucent
        animated
      />
      <DynamicSafeAreaView
        style={styles.screen}
        backgroundColor={theme.colors.screenBackground}
        bottomBackgroundColor={theme.colors.cardBackground}
        modalBackgroundColor="rgba(0, 0, 0, 0.5)"
        isModalOpen={anyModalOpen}
        edges={["top", "bottom"]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>{workout.title}</Text>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.helpButton}
              onPress={handleOpenNote}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Add notes"
            >
              <Feather name="edit-3" size={20} color={notes ? theme.colors.primary : theme.colors.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.helpButton}
              onPress={() => setShowGuide(true)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Show help"
            >
              <Feather name="help-circle" size={20} color={theme.colors.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.exitButton}
              onPress={handleExit}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Exit workout"
            >
              <Feather name="x" size={24} color={theme.colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Exercise List */}
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          stickyHeaderIndices={[0]}
          showsVerticalScrollIndicator
          onScroll={(e) => {
            scrollOffset.current = e.nativeEvent.contentOffset.y;
          }}
          onLayout={(e) => {
            scrollViewHeight.current = e.nativeEvent.layout.height;
          }}
          scrollEventThrottle={16}
        >
          <ProgressHeader
            completedSetsCount={completedSetsCount}
            totalSets={totalSets}
            progressPercent={progressPercent}
            progressBarWidth={progressBarWidth}
            progressBarScale={progressBarScale}
          />

          {/* Microcopy */}
          <View style={styles.microcopyContainer}>
            <Text style={styles.microcopyText}>Tap a set to mark it complete</Text>
          </View>

          {/* Warm-up */}
          {exercises.some(e => e.category === 'warmup') && (
            <View style={[styles.categoryHeader, styles.categoryHeaderAlt]}>
              <View style={styles.categoryLine} />
              <Text style={styles.categoryTitle}>Warm-up</Text>
              <View style={styles.categoryLine} />
            </View>
          )}
          {exercises.filter(e => e.category === 'warmup').map((exercise) => (
            <View
              key={exercise.id}
              ref={(ref) => { exerciseRefs.current[exercise.id] = ref; }}
              collapsable={false}
            >
              <ExerciseItem
                exercise={exercise}
                completedSets={progress[exercise.id] || []}
                onToggleSet={(setIndex) => handleToggleSet(exercise.id, setIndex)}
                onToggleAllSets={() => handleToggleAllSets(exercise.id)}
                onReplace={() => handleReplaceExercise(exercise)}
                slideAnim={slideAnimations[exercise.id] || new Animated.Value(0)}
                showSwipeHint={false}
                onSwipeOpen={handleSwipeOpen}
              />
            </View>
          ))}

          {/* Main */}
          {exercises.some(e => e.category === 'main') && (
            <View style={[styles.categoryHeader, styles.categoryHeaderAlt]}>
              <View style={styles.categoryLine} />
              <Text style={styles.categoryTitle}>Main</Text>
              <View style={styles.categoryLine} />
            </View>
          )}
          {exercises.filter(e => e.category === 'main').map((exercise) => (
            <View
              key={exercise.id}
              ref={(ref) => { exerciseRefs.current[exercise.id] = ref; }}
              collapsable={false}
            >
              <ExerciseItem
                exercise={exercise}
                completedSets={progress[exercise.id] || []}
                onToggleSet={(setIndex) => handleToggleSet(exercise.id, setIndex)}
                onToggleAllSets={() => handleToggleAllSets(exercise.id)}
                onReplace={() => handleReplaceExercise(exercise)}
                slideAnim={slideAnimations[exercise.id] || new Animated.Value(0)}
                showSwipeHint={false}
                onSwipeOpen={handleSwipeOpen}
              />
            </View>
          ))}

          {/* Cool-down */}
          {exercises.some(e => e.category === 'cooldown') && (
            <View style={[styles.categoryHeader, styles.categoryHeaderAlt]}>
              <View style={styles.categoryLine} />
              <Text style={styles.categoryTitle}>Cool-down</Text>
              <View style={styles.categoryLine} />
            </View>
          )}
          {exercises.filter(e => e.category === 'cooldown').map((exercise) => (
            <View
              key={exercise.id}
              ref={(ref) => { exerciseRefs.current[exercise.id] = ref; }}
              collapsable={false}
            >
              <ExerciseItem
                exercise={exercise}
                completedSets={progress[exercise.id] || []}
                onToggleSet={(setIndex) => handleToggleSet(exercise.id, setIndex)}
                onToggleAllSets={() => handleToggleAllSets(exercise.id)}
                onReplace={() => handleReplaceExercise(exercise)}
                slideAnim={slideAnimations[exercise.id] || new Animated.Value(0)}
                showSwipeHint={false}
                onSwipeOpen={handleSwipeOpen}
              />
            </View>
          ))}

        </ScrollView>

        {/* Help Guide Overlay */}
        {showGuide && (
          <TouchableOpacity
            style={styles.guideOverlay}
            activeOpacity={1}
            onPress={() => setShowGuide(false)}
          >
            <View style={styles.guideCard}>
              <Feather name="info" size={32} color={theme.colors.primary} />
              <Text style={styles.guideTitle}>How to use</Text>
              
              <View style={styles.guideItem}>
                <Feather name="arrow-left" size={18} color={theme.colors.textMuted} />
                <Text style={styles.guideItemText}>
                  Swipe right on exercise to replace it
                </Text>
              </View>

              <View style={styles.guideItem}>
                <Feather name="edit-3" size={18} color={theme.colors.textMuted} />
                <Text style={styles.guideItemText}>
                  Tap the pencil icon to add notes
                </Text>
              </View>

              <View style={styles.guideItem}>
                <Feather name="check-circle" size={18} color={theme.colors.textMuted} />
                <Text style={styles.guideItemText}>
                  Tap set circles to mark them complete
                </Text>
              </View>

              <View style={styles.guideItem}>
                <Feather name="zap" size={18} color={theme.colors.textMuted} />
                <Text style={styles.guideItemText}>
                  Tap exercise name to toggle all sets at once
                </Text>
              </View>
              
              <TouchableOpacity
                style={styles.guideButton}
                onPress={() => setShowGuide(false)}
              >
                <Text style={styles.guideButtonText}>Got it</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <TouchableOpacity
              style={[
                styles.primaryButton,
                completedExercisesCount === 0 && styles.primaryButtonDisabled,
                allExercisesComplete && styles.primaryButtonComplete,
                isFinishing && styles.primaryButtonFinishing,
              ]}
              onPress={handleFinish}
              activeOpacity={0.8}
              disabled={completedExercisesCount === 0 || isFinishing}
              accessibilityRole="button"
              accessibilityLabel="Finish workout"
              accessibilityState={{ disabled: completedExercisesCount === 0 }}
            >
              <View style={styles.finishingContent}>
                {/* Text with fade out animation */}
                <Animated.Text
                  style={[
                    styles.primaryButtonText,
                    completedExercisesCount === 0 && styles.primaryButtonTextDisabled,
                    { opacity: finishTextOpacity },
                  ]}
                >
                  {allExercisesComplete
                    ? "Finish workout"
                    : completedExercisesCount > 0
                    ? "Finish"
                    : "Complete all sets to finish"}
                </Animated.Text>
                {/* Checkmark with fade in animation - positioned absolute */}
                <Animated.View style={[styles.finishCheckmark, { opacity: finishCheckmarkOpacity }]}>
                  <Feather name="check" size={22} color={theme.colors.white} />
                </Animated.View>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </DynamicSafeAreaView>

      {/* Note Modal - using native Modal to cover entire screen including safe areas */}
      <ExerciseNoteModal
        visible={showNoteInput}
        noteValue={notes}
        onChangeNote={handleNoteChange}
        onClose={handleCloseNote}
        exercises={exercises}
      />

      {/* Replace Modal */}
      <Modal
        visible={showReplaceModal && !!replaceExercise}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={handleCloseReplaceModal}
      >
        <TouchableOpacity
          style={styles.replaceModalOverlay}
          activeOpacity={1}
          onPress={handleCloseReplaceModal}
        >
          <View style={styles.replaceModalCard}>
            <View style={styles.replaceModalHeader}>
              <Feather name="repeat" size={24} color={theme.colors.primary} />
              <Text style={styles.replaceModalTitle}>Replace exercise</Text>
            </View>
            <Text style={styles.replaceModalSubtitle}>Suggested alternatives</Text>
            <View style={styles.replaceModalOptions}>
              {replaceAlternatives.map((alt, index) => (
                <Pressable
                  key={index}
                  style={({ pressed }) => [
                    styles.replaceModalOption,
                    pressed && styles.replaceModalOptionPressed,
                  ]}
                  onPress={() => handleSelectReplacement(alt)}
                >
                  {({ pressed }) => (
                    <Text style={[
                      styles.replaceModalOptionText,
                      pressed && styles.replaceModalOptionTextPressed,
                    ]}>{alt}</Text>
                  )}
                </Pressable>
              ))}
            </View>
            <TouchableOpacity
              style={styles.replaceModalCancel}
              onPress={handleCloseReplaceModal}
              activeOpacity={0.7}
            >
              <Text style={styles.replaceModalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Exit Warning Modal */}
      <Modal
        visible={showExitModal}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={handleCancelExit}
      >
        <TouchableOpacity
          style={styles.exitModalOverlay}
          activeOpacity={1}
          onPress={handleCancelExit}
        >
          <View style={styles.exitModalCard}>
            <View style={styles.exitModalHeader}>
              <Feather name="alert-circle" size={24} color={theme.colors.textTitle} />
              <Text style={styles.exitModalTitle}>Exit workout?</Text>
            </View>
            <Text style={styles.exitModalMessage}>
              Your progress will not be saved.
            </Text>
            <View style={styles.exitModalButtons}>
              <TouchableOpacity
                style={[styles.exitModalButton, styles.exitModalButtonCancel]}
                onPress={handleCancelExit}
                activeOpacity={0.7}
              >
                <Text style={styles.exitModalButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.exitModalButton, styles.exitModalButtonConfirm]}
                onPress={handleConfirmExit}
                activeOpacity={0.7}
              >
                <Text style={styles.exitModalButtonConfirmText}>Exit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
  },
  screen: {
    flex: 1,
    backgroundColor: theme.colors.screenBackground,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing.screenPadding,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  headerLeft: {
    flex: 1,
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  helpButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.sectionBackground,
    alignItems: "center",
    justifyContent: "center",
  },
  exitButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.sectionBackground,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "600",
    color: theme.colors.textTitle,
    letterSpacing: -0.5,
    lineHeight: 34,
    includeFontPadding: false,
  },
  content: {
    paddingHorizontal: 0,
    backgroundColor: theme.colors.screenBackground,
    borderTopWidth: 1,
    borderColor: theme.colors.outline,
    paddingBottom: theme.spacing.xxl,
  },
  microcopyContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  microcopyText: {
    fontSize: 13,
    fontWeight: "500",
    color: theme.colors.textMuted,
    letterSpacing: -0.1,
    textAlign: "center",
    includeFontPadding: false,
  },
  footer: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    minHeight: 48,
    paddingVertical: theme.spacing.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  primaryButtonDisabled: {
    backgroundColor: theme.colors.sectionBackground,
    opacity: 0.6,
  },
  primaryButtonComplete: {
    backgroundColor: theme.colors.primary,
  },
  primaryButtonText: {
    color: theme.colors.white,
    fontWeight: "600",
    fontSize: 17,
    letterSpacing: -0.2,
    lineHeight: 20,
    includeFontPadding: false,
  },
  primaryButtonTextDisabled: {
    color: theme.colors.textMuted,
  },
  primaryButtonFinishing: {
    backgroundColor: theme.colors.primary,
  },
  finishingContent: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    minHeight: 22,
  },
  finishCheckmark: {
    position: 'absolute',
  },
  guideOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  guideCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: 8,
    padding: theme.spacing.xl,
    marginHorizontal: theme.spacing.lg,
    maxWidth: 320,
    alignItems: "center",
    gap: theme.spacing.md,
  },
  guideTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.textTitle,
    letterSpacing: -0.4,
    textAlign: "center",
  },
  guideText: {
    fontSize: 15,
    color: theme.colors.textBody,
    letterSpacing: -0.2,
    lineHeight: 22,
    textAlign: "center",
  },
  guideItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    width: "100%",
    paddingVertical: theme.spacing.xs,
  },
  guideItemText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.textBody,
    letterSpacing: -0.2,
    lineHeight: 20,
  },
  guideButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    marginTop: theme.spacing.sm,
    minWidth: 120,
  },
  guideButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.white,
    letterSpacing: -0.2,
    textAlign: "center",
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.cardBackground,
    gap: theme.spacing.sm,
  },
  categoryLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.outline,
    opacity: 0.3,
  },
  categoryTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.textMuted,
    letterSpacing: 0.3,
  },
  categoryHeaderAlt: {
    backgroundColor: theme.colors.sectionBackground,
  },
  replaceModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  replaceModalCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: 8,
    padding: theme.spacing.xl,
    marginHorizontal: theme.spacing.lg,
    width: "85%",
    maxWidth: 340,
  },
  replaceModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  replaceModalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.textTitle,
    letterSpacing: -0.4,
  },
  replaceModalSubtitle: {
    fontSize: 15,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.lg,
    letterSpacing: -0.2,
  },
  replaceModalOptions: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  replaceModalOption: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.sectionBackground,
    borderRadius: 6,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  replaceModalOptionPressed: {
    backgroundColor: theme.colors.primary,
  },
  replaceModalOptionText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.textTitle,
    letterSpacing: -0.2,
  },
  replaceModalOptionTextPressed: {
    color: theme.colors.white,
  },
  replaceModalCancel: {
    alignItems: "center",
    paddingVertical: theme.spacing.sm,
  },
  replaceModalCancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.textMuted,
    letterSpacing: -0.2,
  },
  replaceModalSubtitle: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.lg,
    letterSpacing: -0.1,
    fontWeight: '500',
  },
  exitModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  exitModalCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: 8,
    padding: theme.spacing.xl,
    marginHorizontal: theme.spacing.lg,
    width: "85%",
    maxWidth: 340,
  },
  exitModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  exitModalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.textTitle,
    letterSpacing: -0.4,
  },
  exitModalMessage: {
    fontSize: 15,
    color: theme.colors.textBody,
    marginBottom: theme.spacing.xl,
    lineHeight: 22,
    letterSpacing: -0.1,
  },
  exitModalButtons: {
    flexDirection: "row",
    gap: theme.spacing.md,
  },
  exitModalButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: 6,
    alignItems: "center",
  },
  exitModalButtonCancel: {
    backgroundColor: theme.colors.sectionBackground,
  },
  exitModalButtonConfirm: {
    backgroundColor: theme.colors.primary,
  },
  exitModalButtonCancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.textTitle,
    letterSpacing: -0.2,
  },
  exitModalButtonConfirmText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.white,
    letterSpacing: -0.2,
  },
});
