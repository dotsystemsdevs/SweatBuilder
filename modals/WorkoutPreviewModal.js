import React, { useMemo, useRef, useState } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  PanResponder,
  Dimensions,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import theme from "../theme";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

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

// Set circle component - preview version (always empty, not interactive)
const PreviewSetCircle = ({ size = 32 }) => (
  <View
    style={[
      styles.setCircle,
      { width: size, height: size, borderRadius: size / 2 },
    ]}
  />
);

// Exercise row component - preview version (not interactive)
const PreviewExerciseRow = ({ exercise, setsCount, isLast }) => {
  return (
    <View style={[styles.exerciseRow, isLast && styles.exerciseRowLast]}>
      {/* Swap button placeholder (disabled) */}
      <View style={[styles.swapButton, styles.swapButtonDisabled]}>
        <Feather name="refresh-cw" size={14} color={theme.colors.border} />
      </View>

      {/* Main content */}
      <View style={styles.exerciseMainContent}>
        <View style={styles.exerciseContent}>
          <Text style={styles.exerciseName}>{exercise.name}</Text>
          <Text style={styles.exerciseInfo}>{exercise.info}</Text>
        </View>
        <View style={styles.setsRow}>
          {Array(setsCount).fill(null).map((_, index) => (
            <PreviewSetCircle key={index} />
          ))}
        </View>
      </View>
    </View>
  );
};

// Category card component - preview version
const PreviewCategoryCard = ({ category, exercises }) => {
  const config = CATEGORIES[category] || { label: category, icon: "circle" };

  return (
    <View style={styles.categoryCard}>
      <View style={styles.categoryHeader}>
        <View style={styles.categoryHeaderLeft}>
          <View style={styles.categoryIcon}>
            <Feather
              name={config.icon}
              size={14}
              color={theme.colors.textSecondary}
            />
          </View>
          <Text style={styles.categoryLabel}>
            {config.label} · {exercises.length}
          </Text>
        </View>
      </View>

      <View style={styles.categoryExercises}>
        {exercises.map((exercise, index) => (
          <React.Fragment key={exercise.id || index}>
            {index > 0 && <View style={styles.exerciseRowDivider} />}
            <PreviewExerciseRow
              exercise={exercise}
              setsCount={getSetsCount(exercise.info)}
              isLast={index === exercises.length - 1}
            />
          </React.Fragment>
        ))}
      </View>
    </View>
  );
};

export default function WorkoutPreviewModal({ visible, workout, onClose }) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(0)).current;
  const [handlePressed, setHandlePressed] = useState(false);

  // Pan responder for swipe to dismiss - on entire sheet
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only capture swipe down gestures
        return gestureState.dy > 15 && Math.abs(gestureState.dx) < 50;
      },
      onPanResponderGrant: () => {
        setHandlePressed(true);
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        setHandlePressed(false);
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          // Dismiss
          Animated.timing(translateY, {
            toValue: SCREEN_HEIGHT,
            duration: 250,
            useNativeDriver: true,
          }).start(onClose);
        } else {
          // Snap back
          Animated.spring(translateY, {
            toValue: 0,
            tension: 100,
            friction: 12,
            useNativeDriver: true,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        setHandlePressed(false);
      },
    })
  ).current;

  // Reset position when modal opens
  React.useEffect(() => {
    if (visible) {
      translateY.setValue(0);
      setHandlePressed(false);
    }
  }, [visible]);

  // Group exercises by category
  const groupedExercises = useMemo(() => {
    if (!workout?.exercises) return { warmup: [], main: [], cooldown: [] };

    const groups = { warmup: [], main: [], cooldown: [] };
    workout.exercises.forEach((ex) => {
      const cat = ex.category || "main";
      if (groups[cat]) {
        groups[cat].push(ex);
      } else {
        groups.main.push(ex);
      }
    });
    return groups;
  }, [workout?.exercises]);

  // Categories in order
  const categoryOrder = ["warmup", "main", "cooldown"].filter(
    (cat) => groupedExercises[cat].length > 0
  );

  // Calculate total sets for display
  const totalSets = useMemo(() => {
    if (!workout?.exercises) return 0;
    return workout.exercises.reduce((sum, ex) => sum + getSetsCount(ex.info), 0);
  }, [workout?.exercises]);

  if (!workout) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        {/* Backdrop - tap to close */}
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        {/* Sheet - entire area is swipeable */}
        <Animated.View
          style={[
            styles.sheet,
            {
              transform: [{ translateY }],
            },
          ]}
          {...panResponder.panHandlers}
        >
          {/* Handle bar */}
          <View style={styles.handleContainer}>
            <View style={[styles.handle, handlePressed && styles.handlePressed]} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Feather name="x" size={22} color={theme.colors.textSecondary} />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
                {workout.title}
              </Text>
              {/* Preview text under title */}
              <Text style={styles.previewText}>Preview</Text>
            </View>
            {/* Spacer to balance header */}
            <View style={styles.headerSpacer} />
          </View>

          {/* Progress bar (always at 0) */}
          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: "0%" }]} />
            </View>
            <View style={styles.progressTextContainer}>
              <Text style={styles.progressText}>0/{totalSets} sets</Text>
            </View>
          </View>

          {/* Category cards */}
          <ScrollView
            contentContainerStyle={[
              styles.content,
              { paddingBottom: insets.bottom + theme.spacing.xxl },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {categoryOrder.map((category) => (
              <PreviewCategoryCard
                key={category}
                category={category}
                exercises={groupedExercises[category]}
              />
            ))}

            {/* Close button at bottom */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.closeButtonText}>Close Preview</Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "transparent",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  sheet: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: 100,
    overflow: "hidden",
  },
  handleContainer: {
    alignItems: "center",
    paddingVertical: theme.spacing.md,
    paddingTop: theme.spacing.sm,
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: theme.colors.border,
  },
  handlePressed: {
    backgroundColor: theme.colors.textSecondary,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing.screenPadding,
    paddingTop: theme.spacing.xs,
    paddingBottom: theme.spacing.md,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: theme.colors.text,
    letterSpacing: -0.5,
    maxWidth: "80%",
    textAlign: "center",
  },
  previewText: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.yellow,
    marginTop: theme.spacing.xxs,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surfaceHover,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  headerSpacer: {
    width: 40,
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
  content: {
    paddingHorizontal: theme.spacing.screenPadding,
    paddingTop: theme.spacing.sm,
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
  swapButtonDisabled: {
    opacity: 0.4,
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
  exerciseInfo: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  setsRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },

  // Set circle (preview - always empty)
  setCircle: {
    backgroundColor: theme.colors.surfaceHover,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: theme.colors.border,
  },

  // Close button
  closeButton: {
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
  closeButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.textMuted,
  },
});
