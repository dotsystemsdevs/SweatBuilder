import React, { useMemo, useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Modal,
  LayoutAnimation,
  UIManager,
  Animated,
} from "react-native";

// Enable LayoutAnimation on Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import { useNavigation } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import { StatusBar } from "expo-status-bar";
import { Feather } from "@expo/vector-icons";
import theme from "../theme";
import { useWorkoutStore } from "../store/workoutStore";
import { useStatusBar } from "../hooks/useStatusBar";
import DynamicSafeAreaView from "../components/DynamicSafeAreaView";
import SwapExerciseModal from "../modals/SwapExerciseModal";

// Calculate sets count from exercise info
const getSetsCount = (info) => {
  if (!info) return 1;
  const lowerInfo = info.toLowerCase();
  if (lowerInfo.includes("min") || lowerInfo.includes("km") || lowerInfo.includes("sec")) {
    return 1;
  }
  const parsed = parseInt(info.split("x")[0], 10);
  if (isNaN(parsed) || parsed < 1) return 1;
  return Math.min(parsed, 4);
};

// Category config
const CATEGORIES = {
  warmup: { label: "Warm-up", icon: "sun" },
  main: { label: "Workout", icon: "target" },
  cooldown: { label: "Cool-down", icon: "moon" },
};

// Set circle component - just fills with color, no checkmark
const SetCircle = ({ isCompleted, onPress, size = 32, isNext }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.7}
    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
  >
    <View
      style={[
        styles.setCircle,
        { width: size, height: size, borderRadius: size / 2 },
        isCompleted && styles.setCircleCompleted,
        isNext && !isCompleted && styles.setCircleNext,
      ]}
    />
  </TouchableOpacity>
);

// Completed indicator - single circle with checkmark when all sets done (with animation)
const CompletedCircle = ({ size = 32 }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  return (
    <Animated.View
      style={[
        styles.completedCircle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <Feather name="check" size={15} color={theme.colors.black} />
    </Animated.View>
  );
};

// Exercise row component
const ExerciseRow = ({ exercise, completedSets, onToggleSet, onToggleAll, isLast, isNext, onSwap }) => {
  const allDone = completedSets.every(Boolean);
  const completedCount = completedSets.filter(Boolean).length;
  const totalSets = completedSets.length;

  const handleToggleAll = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onToggleAll();
  };

  const handleSwap = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSwap(exercise);
  };

  return (
    <View
      style={[
        styles.exerciseRow,
        isLast && styles.exerciseRowLast,
      ]}
    >
      {/* Swap button */}
      <TouchableOpacity
        style={styles.swapButton}
        onPress={handleSwap}
        activeOpacity={0.6}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Feather name="refresh-cw" size={14} color={theme.colors.textMuted} />
      </TouchableOpacity>

      {/* Main content - toggles all sets */}
      <TouchableOpacity
        style={styles.exerciseMainContent}
        onPress={handleToggleAll}
        activeOpacity={0.7}
      >
        <View style={styles.exerciseContent}>
          <Text style={[styles.exerciseName, isNext && styles.exerciseNameNext, allDone && styles.exerciseNameDone]}>
            {exercise.name}
          </Text>
          <Text style={styles.exerciseInfo}>
            {exercise.info}
          </Text>
          {!allDone && totalSets > 1 && (
            <Text style={styles.exerciseProgress}>
              {completedCount}/{totalSets} sets
            </Text>
          )}
        </View>
        <View style={styles.setsRow}>
          {allDone ? (
            <CompletedCircle />
          ) : (
            completedSets.map((isCompleted, index) => {
              const isNextSet = isNext && index === completedCount;
              return (
                <SetCircle
                  key={index}
                  isCompleted={isCompleted}
                  isNext={isNextSet}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onToggleSet(index);
                  }}
                />
              );
            })
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
};

// Category card component
const CategoryCard = ({
  category,
  exercises,
  progress,
  onToggleSet,
  onToggleAll,
  isCollapsed,
  onToggleCollapse,
  nextExerciseId,
  onSwapExercise,
}) => {
  const config = CATEGORIES[category] || { label: category, icon: "circle" };
  const allExercisesDone = exercises.every((ex) =>
    (progress[ex.id] || []).every(Boolean)
  );
  const completedCount = exercises.filter((ex) =>
    (progress[ex.id] || []).every(Boolean)
  ).length;

  return (
    <View style={styles.categoryCard}>
      <TouchableOpacity
        style={styles.categoryHeader}
        onPress={onToggleCollapse}
        activeOpacity={0.7}
      >
        <View style={styles.categoryHeaderLeft}>
          <View style={styles.categoryIcon}>
            <Feather
              name={config.icon}
              size={14}
              color={theme.colors.textSecondary}
            />
            {allExercisesDone && (
              <View style={styles.categoryCheckBadge}>
                <Feather name="check" size={8} color={theme.colors.surface} />
              </View>
            )}
          </View>
          <Text style={styles.categoryLabel}>
            {config.label} · {completedCount}/{exercises.length}
          </Text>
        </View>
        <Feather
          name={isCollapsed ? "chevron-down" : "chevron-up"}
          size={18}
          color={theme.colors.textMuted}
        />
      </TouchableOpacity>

      {!isCollapsed && (
        <View style={styles.categoryExercises}>
          {exercises.map((exercise, index) => (
            <React.Fragment key={exercise.id}>
              {index > 0 && <View style={styles.exerciseRowDivider} />}
              <ExerciseRow
                exercise={exercise}
                completedSets={progress[exercise.id] || []}
                onToggleSet={(setIndex) => onToggleSet(exercise.id, setIndex)}
                onToggleAll={() => onToggleAll(exercise.id)}
                isLast={index === exercises.length - 1}
                isNext={exercise.id === nextExerciseId}
                onSwap={onSwapExercise}
              />
            </React.Fragment>
          ))}
        </View>
      )}
    </View>
  );
};

export default function WorkoutModeScreen() {
  useStatusBar(theme.colors.background);
  const navigation = useNavigation();
  const { workout, completeWorkout } = useWorkoutStore();

  // Notes state
  const [showNotes, setShowNotes] = useState(false);
  const [workoutNotes, setWorkoutNotes] = useState("");
  const [showExerciseList, setShowExerciseList] = useState(false);
  const [mentionStartIndex, setMentionStartIndex] = useState(null);
  const scrollViewRef = useRef(null);
  const notesInputRef = useRef(null);

  // Swap exercise state
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [exerciseToSwap, setExerciseToSwap] = useState(null);
  const [swappedExercises, setSwappedExercises] = useState({});

  // Apply swapped exercises
  const exercisesWithSwaps = useMemo(() => {
    return workout.exercises.map((ex) => {
      if (swappedExercises[ex.id]) {
        // Return the swapped exercise but keep the original ID for tracking
        return { ...swappedExercises[ex.id], id: ex.id, originalId: ex.id };
      }
      return ex;
    });
  }, [workout.exercises, swappedExercises]);

  // Group exercises by category
  const groupedExercises = useMemo(() => {
    const groups = { warmup: [], main: [], cooldown: [] };
    exercisesWithSwaps.forEach((ex) => {
      const cat = ex.category || "main";
      if (groups[cat]) {
        groups[cat].push(ex);
      } else {
        groups.main.push(ex);
      }
    });
    return groups;
  }, [exercisesWithSwaps]);

  // Categories in order
  const categoryOrder = ["warmup", "main", "cooldown"].filter(
    (cat) => groupedExercises[cat].length > 0
  );

  // Progress state
  const [progress, setProgress] = useState(() =>
    Object.fromEntries(
      workout.exercises.map((ex) => [ex.id, Array(getSetsCount(ex.info)).fill(false)])
    )
  );

  // Collapsed state - warmup expanded, others collapsed
  const [collapsed, setCollapsed] = useState({
    warmup: false,
    main: true,
    cooldown: true,
  });

  // Track which categories user has manually interacted with
  const userInteractedRef = useRef(new Set());

  // Track if we've auto-navigated to prevent multiple navigations
  const hasAutoNavigated = useRef(false);

  // Auto-collapse completed categories and expand next one
  useEffect(() => {
    setCollapsed((prevCollapsed) => {
      const newCollapsed = { ...prevCollapsed };
      let hasChanges = false;

      categoryOrder.forEach((category, index) => {
        // Skip if user has manually interacted with this category
        if (userInteractedRef.current.has(category)) return;

        const exercises = groupedExercises[category];
        const allDone = exercises.every((ex) =>
          (progress[ex.id] || []).every(Boolean)
        );

        // Auto-collapse if complete and currently open
        if (allDone && exercises.length > 0 && !prevCollapsed[category]) {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          newCollapsed[category] = true;
          hasChanges = true;

          // Auto-expand next category if it exists and isn't manually controlled
          const nextCategory = categoryOrder[index + 1];
          if (nextCategory && !userInteractedRef.current.has(nextCategory)) {
            newCollapsed[nextCategory] = false;
          }
        }
      });
      return hasChanges ? newCollapsed : prevCollapsed;
    });
  }, [progress, groupedExercises, categoryOrder]);

  // Progress calculations
  const totalSets = useMemo(
    () => workout.exercises.reduce((sum, ex) => sum + getSetsCount(ex.info), 0),
    [workout.exercises]
  );

  const completedSetsCount = useMemo(
    () =>
      workout.exercises.reduce(
        (sum, ex) => sum + (progress[ex.id] || []).filter(Boolean).length,
        0
      ),
    [progress, workout.exercises]
  );

  const progressPercent = totalSets ? Math.round((completedSetsCount / totalSets) * 100) : 0;
  const allComplete = completedSetsCount === totalSets && totalSets > 0;

  // Show completion celebration state
  const [showCompletion, setShowCompletion] = useState(false);
  const completionSlide = useRef(new Animated.Value(100)).current;

  // Auto-navigate to Reflection when all complete
  useEffect(() => {
    if (allComplete && !hasAutoNavigated.current) {
      hasAutoNavigated.current = true;
      setShowCompletion(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Slide up animation
      Animated.spring(completionSlide, {
        toValue: 0,
        tension: 80,
        friction: 10,
        useNativeDriver: true,
      }).start();

      // Quick transition to Reflection
      setTimeout(() => {
        completeWorkout(progress);
        navigation.navigate("Reflection");
      }, 900);
    }
  }, [allComplete, completeWorkout, navigation, progress, completionSlide]);

  // Find next exercise to do (first incomplete one)
  const nextExerciseId = useMemo(() => {
    for (const category of ["warmup", "main", "cooldown"]) {
      for (const ex of groupedExercises[category]) {
        const sets = progress[ex.id] || [];
        if (!sets.every(Boolean)) {
          return ex.id;
        }
      }
    }
    return null;
  }, [groupedExercises, progress]);

  // Handlers
  const handleToggleSet = useCallback((exerciseId, setIndex) => {
    setProgress((prev) => {
      const newSets = [...prev[exerciseId]];
      newSets[setIndex] = !newSets[setIndex];
      if (newSets.every(Boolean)) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      return { ...prev, [exerciseId]: newSets };
    });
  }, []);

  const handleToggleAll = useCallback((exerciseId) => {
    setProgress((prev) => {
      const currentSets = prev[exerciseId] || [];
      const allDone = currentSets.every(Boolean);
      const newSets = currentSets.map(() => !allDone);
      if (!allDone) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      return { ...prev, [exerciseId]: newSets };
    });
  }, []);

  const handleToggleCollapse = useCallback((category) => {
    // Mark that user has interacted with this category - prevents auto-collapse
    userInteractedRef.current.add(category);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCollapsed((prev) => ({ ...prev, [category]: !prev[category] }));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  // Swap exercise handlers
  const handleOpenSwapModal = useCallback((exercise) => {
    setExerciseToSwap(exercise);
    setShowSwapModal(true);
  }, []);

  const handleCloseSwapModal = useCallback(() => {
    setShowSwapModal(false);
    setExerciseToSwap(null);
  }, []);

  const handleSwapExercise = useCallback((originalExercise, newExercise) => {
    setSwappedExercises((prev) => ({
      ...prev,
      [originalExercise.id]: newExercise,
    }));
    // Reset progress for the swapped exercise
    setProgress((prev) => ({
      ...prev,
      [originalExercise.id]: Array(getSetsCount(newExercise.info)).fill(false),
    }));
    setShowSwapModal(false);
    setExerciseToSwap(null);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const handleFinish = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    completeWorkout(progress);
    navigation.navigate("Reflection");
  }, [completeWorkout, navigation, progress]);

  const handleExit = useCallback(() => {
    if (completedSetsCount > 0) {
      Alert.alert("Exit workout?", "Your progress will be lost.", [
        { text: "Cancel", style: "cancel" },
        { text: "Exit", style: "destructive", onPress: () => navigation.goBack() },
      ]);
    } else {
      navigation.goBack();
    }
  }, [completedSetsCount, navigation]);

  // Notes handlers
  const handleNotesChange = useCallback((text) => {
    setWorkoutNotes(text);

    // Check for @ trigger
    const lastAtIndex = text.lastIndexOf("@");
    if (lastAtIndex !== -1) {
      const textAfterAt = text.slice(lastAtIndex + 1);
      if (!textAfterAt.includes(" ") && !textAfterAt.includes("\n")) {
        setShowExerciseList(true);
        setMentionStartIndex(lastAtIndex);
      } else {
        setShowExerciseList(false);
        setMentionStartIndex(null);
      }
    } else {
      setShowExerciseList(false);
      setMentionStartIndex(null);
    }
  }, []);

  const handleExerciseSelect = useCallback((exerciseName) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (mentionStartIndex !== null) {
      const beforeMention = workoutNotes.slice(0, mentionStartIndex);
      // Remove spaces from exercise name (e.g., "Hantel Press" -> "HantelPress")
      const formattedName = exerciseName.replace(/\s+/g, '');
      const newNotes = `${beforeMention}@${formattedName} `;
      setWorkoutNotes(newNotes);
    }
    setShowExerciseList(false);
    setMentionStartIndex(null);
    // Keep keyboard open so user can continue typing
    setTimeout(() => {
      if (notesInputRef.current) {
        notesInputRef.current.focus();
      }
    }, 50);
  }, [workoutNotes, mentionStartIndex]);

  const handleToggleNotes = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowNotes((prev) => !prev);
  }, []);

  // Filter exercises for @ mentions
  const filteredExercises = useMemo(() => {
    if (mentionStartIndex === null) return workout.exercises;
    const searchText = workoutNotes.slice(mentionStartIndex + 1).toLowerCase();
    if (!searchText) return workout.exercises;
    return workout.exercises.filter((ex) =>
      ex.name.toLowerCase().includes(searchText)
    );
  }, [workout.exercises, workoutNotes, mentionStartIndex]);

  return (
    <>
      <StatusBar style="light" backgroundColor="transparent" translucent animated />
      <DynamicSafeAreaView
        style={styles.screen}
        backgroundColor={theme.colors.background}
        edges={["top", "bottom"]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.backButton} onPress={handleExit} activeOpacity={0.7}>
              <Feather name="chevron-left" size={22} color={theme.colors.textSecondary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
              {workout.title}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleToggleNotes}
            activeOpacity={0.7}
          >
            <Feather
              name="edit-3"
              size={18}
              color={theme.colors.textMuted}
            />
          </TouchableOpacity>
        </View>

        {/* Progress bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${progressPercent}%` },
                allComplete && styles.progressFillComplete,
              ]}
            />
          </View>
          <View style={styles.progressTextContainer}>
            <Text style={styles.progressText}>
              {completedSetsCount}/{totalSets} sets
            </Text>
            {allComplete && (
              <Text style={styles.progressCompleteText}>Complete!</Text>
            )}
          </View>
        </View>

        {/* Category cards */}
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {categoryOrder.map((category) => (
            <CategoryCard
              key={category}
              category={category}
              exercises={groupedExercises[category]}
              progress={progress}
              onToggleSet={handleToggleSet}
              onToggleAll={handleToggleAll}
              isCollapsed={collapsed[category] || false}
              onToggleCollapse={() => handleToggleCollapse(category)}
              nextExerciseId={nextExerciseId}
              onSwapExercise={handleOpenSwapModal}
            />
          ))}

          {/* Finish button - hidden when auto-completing */}
          {!showCompletion && (
            <TouchableOpacity
              style={[
                styles.finishButton,
                completedSetsCount === 0 && styles.finishButtonDisabled,
              ]}
              onPress={handleFinish}
              activeOpacity={0.8}
              disabled={completedSetsCount === 0}
            >
              <Text
                style={[
                  styles.finishButtonText,
                  completedSetsCount === 0 && styles.finishButtonTextDisabled,
                ]}
              >
                {completedSetsCount > 0 ? "Finish Early" : "Complete a set"}
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        {/* Notes Modal */}
        <Modal
          visible={showNotes}
          transparent
          animationType="fade"
          onRequestClose={handleToggleNotes}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.notesModalContainer}
          >
            <TouchableWithoutFeedback onPress={handleToggleNotes}>
              <View style={styles.notesOverlay}>
                <TouchableWithoutFeedback>
                  <View style={styles.notesCard}>
                    {/* Header */}
                    <View style={styles.notesHeader}>
                      <View style={styles.notesHeaderLeft}>
                        <Feather name="edit-3" size={14} color={theme.colors.textMuted} />
                        <Text style={styles.notesLabel}>Notes</Text>
                        <Text style={styles.notesHint}>@ to tag</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.notesCloseButton}
                        onPress={handleToggleNotes}
                        activeOpacity={0.7}
                      >
                        {workoutNotes.trim() ? (
                          <Feather name="save" size={18} color={theme.colors.green} />
                        ) : (
                          <Feather name="x" size={18} color={theme.colors.textMuted} />
                        )}
                      </TouchableOpacity>
                    </View>
                    <View style={styles.notesDivider} />

                    {/* Simple text input */}
                    <View style={styles.notesInputContainer}>
                      <TextInput
                        ref={notesInputRef}
                        style={styles.notesInput}
                        value={workoutNotes}
                        onChangeText={handleNotesChange}
                        placeholder="Add notes... use @ to tag exercises"
                        placeholderTextColor={theme.colors.textMuted}
                        multiline
                        textAlignVertical="top"
                        autoFocus
                        maxLength={200}
                      />
                      {/* Exercise mention dropdown - floats above */}
                      {showExerciseList && filteredExercises.length > 0 && (
                        <View style={styles.notesDropdown}>
                          <View style={styles.notesDropdownHeader}>
                            <Feather name="at-sign" size={12} color={theme.colors.textMuted} />
                            <Text style={styles.notesDropdownTitle}>Tag exercise</Text>
                          </View>
                          <View style={styles.notesDropdownDivider} />
                          <ScrollView style={styles.notesDropdownList} nestedScrollEnabled>
                            {filteredExercises.map((exercise, index) => (
                              <React.Fragment key={exercise.id}>
                                {index > 0 && <View style={styles.notesExerciseDivider} />}
                                <TouchableOpacity
                                  style={styles.notesExerciseOption}
                                  onPress={() => handleExerciseSelect(exercise.name)}
                                  activeOpacity={0.7}
                                >
                                  <Text style={styles.notesExerciseText}>{exercise.name}</Text>
                                </TouchableOpacity>
                              </React.Fragment>
                            ))}
                          </ScrollView>
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </Modal>

        {/* Swap Exercise Modal */}
        <SwapExerciseModal
          visible={showSwapModal}
          exercise={exerciseToSwap}
          onSwap={handleSwapExercise}
          onCancel={handleCloseSwapModal}
        />

        {/* Completion Toast */}
        {showCompletion && (
          <Animated.View
            style={[
              styles.completionToast,
              { transform: [{ translateY: completionSlide }] }
            ]}
          >
            <View style={styles.completionCheckCircle}>
              <Feather name="check" size={18} color={theme.colors.black} />
            </View>
            <Text style={styles.completionTitle}>Done!</Text>
          </Animated.View>
        )}
      </DynamicSafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: theme.colors.text,
    letterSpacing: -0.5,
    flex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  progressContainer: {
    paddingHorizontal: theme.spacing.screenPadding,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.lg,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.border,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: theme.colors.yellow,
    borderRadius: 3,
  },
  progressFillComplete: {
    backgroundColor: theme.colors.green,
  },
  progressTextContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: theme.spacing.xs,
  },
  progressText: {
    fontSize: 13,
    fontWeight: "500",
    color: theme.colors.textMuted,
  },
  progressCompleteText: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.green,
  },
  content: {
    paddingHorizontal: theme.spacing.screenPadding,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.xxl,
  },

  // Category card
  categoryCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: "hidden",
    marginBottom: theme.spacing.md,
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  categoryHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  categoryIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.background,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  categoryCheckBadge: {
    position: "absolute",
    bottom: -3,
    right: -3,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: theme.colors.green,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.text,
  },
  categoryExercises: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingVertical: theme.spacing.xs,
  },

  // Exercise row
  exerciseRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: theme.spacing.md,
    paddingRight: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.sm,
  },
  exerciseRowLast: {
    marginBottom: 0,
  },
  exerciseRowDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.xs,
  },
  swapButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  exerciseMainContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  exerciseContent: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  exerciseName: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.text,
    letterSpacing: -0.2,
  },
  exerciseNameNext: {
    color: theme.colors.yellow,
  },
  exerciseNameDone: {
    color: theme.colors.textMuted,
  },
  exerciseInfo: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  exerciseProgress: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
    fontWeight: "500",
  },
  setsRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },

  // Set circle
  setCircle: {
    backgroundColor: theme.colors.surfaceHover,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  setCircleCompleted: {
    backgroundColor: theme.colors.green,
    borderColor: theme.colors.green,
  },
  setCircleNext: {
    borderColor: theme.colors.yellow,
    borderWidth: 2,
  },
  completedCircle: {
    backgroundColor: theme.colors.green,
    alignItems: "center",
    justifyContent: "center",
  },

  // Finish button
  finishButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.full,
    paddingVertical: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minHeight: 56,
    marginTop: theme.spacing.md,
  },
  finishButtonDisabled: {
    opacity: 0.5,
  },
  finishButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.text,
  },
  finishButtonTextDisabled: {
    color: theme.colors.textMuted,
  },

  // Completion Toast
  completionToast: {
    position: "absolute",
    bottom: theme.spacing.xxl,
    left: theme.spacing.screenPadding,
    right: theme.spacing.screenPadding,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.full,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.green,
  },
  completionCheckCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.green,
    alignItems: "center",
    justifyContent: "center",
  },
  completionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.text,
  },

  // Notes Modal - matches Reflection notes style
  notesModalContainer: {
    flex: 1,
  },
  notesOverlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: theme.spacing.screenPadding,
  },
  notesCard: {
    width: "100%",
    maxHeight: "80%",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  notesHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  notesHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  notesLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: theme.colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  notesHint: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginLeft: theme.spacing.sm,
    opacity: 0.7,
  },
  notesCloseButton: {
    padding: theme.spacing.xs,
  },
  notesDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginHorizontal: -theme.spacing.md,
  },
  notesInputContainer: {
    paddingTop: theme.spacing.sm,
    minHeight: 120,
  },
  notesInput: {
    fontSize: 15,
    color: theme.colors.text,
    minHeight: 120,
    textAlignVertical: "top",
    lineHeight: 22,
  },
  notesDropdown: {
    position: "absolute",
    bottom: "100%",
    left: 0,
    right: 0,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.xs,
    zIndex: 100,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: "hidden",
  },
  notesDropdownList: {
    maxHeight: 150,
  },
  notesDropdownHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  notesDropdownTitle: {
    fontSize: 11,
    fontWeight: "500",
    color: theme.colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  notesDropdownDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
  },
  notesExerciseDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
  },
  notesExerciseOption: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  notesExerciseText: {
    fontSize: 15,
    fontWeight: "500",
    color: theme.colors.text,
  },
});
