import React, { useState, useCallback, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Dimensions,
} from "react-native";
import Slider from "@react-native-community/slider";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { StatusBar } from "expo-status-bar";
import { useWorkoutStore } from "../store/workoutStore";
import theme from "../theme";
import { useStatusBar } from "../hooks/useStatusBar";
import DynamicSafeAreaView from "../components/DynamicSafeAreaView";

// Workout reflection tags
const WORKOUT_TAGS = [
  "Felt strong",
  "Tired",
  "New PR",
  "Good form",
  "Low energy",
  "Focused",
  "Sore",
  "Hit goals",
];

// Skip reason tags
const SKIP_TAGS = [
  "Sick",
  "Injured",
  "Too tired",
  "No time",
  "Travel",
  "Not feeling it",
  "Need rest",
  "Other plans",
];

// Get tag color based on meaning
const getTagColor = (tag, isSkipMode) => {
  if (isSkipMode) {
    // Skip tags are all neutral/muted
    return theme.colors.textSecondary;
  }
  const greenTags = ["Felt strong", "Good form", "Focused", "New PR", "Hit goals"];
  const redTags = ["Tired", "Low energy", "Sore", "Rushed", "Need improvement"];

  if (greenTags.includes(tag)) return theme.colors.green;
  if (redTags.includes(tag)) return theme.colors.red;
  return theme.colors.blue; // neutral
};

// Use centralized effort color function from theme
const getEffortColor = theme.getEffortColorFromValue;

export default function ReflectionScreen() {
  useStatusBar(theme.colors.background);
  const navigation = useNavigation();
  const route = useRoute();
  const { setReflection, skipWorkout, workout: storeWorkout } = useWorkoutStore();

  // Check if skip mode from route params
  const isSkipMode = route.params?.mode === "skip";
  const workout = route.params?.workout || storeWorkout;

  const [effort, setEffort] = useState(5);
  const [selectedTags, setSelectedTags] = useState([]);
  const [notes, setNotes] = useState("");
  const [showExerciseList, setShowExerciseList] = useState(false);
  const [mentionStartIndex, setMentionStartIndex] = useState(null);

  const scrollViewRef = useRef(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const successScale = useRef(new Animated.Value(0)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;
  const slideDown = useRef(new Animated.Value(0)).current;

  // Use appropriate tags based on mode
  const TAGS = isSkipMode ? SKIP_TAGS : WORKOUT_TAGS;

  const exercises = useMemo(() => workout?.exercises || [], [workout]);

  const handleTagToggle = useCallback((tag) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTags((prev) => {
      if (prev.includes(tag)) {
        return prev.filter((t) => t !== tag);
      } else {
        // Limit to max 3 tags
        if (prev.length >= 3) {
          return prev;
        }
        return [...prev, tag];
      }
    });
  }, []);

  const handleEffortChange = useCallback((value) => {
    setEffort(Math.round(value));
  }, []);

  const handleNotesChange = useCallback((text) => {
    setNotes(text);

    // Skip @mention functionality in skip mode
    if (isSkipMode) return;

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
  }, [isSkipMode]);


  const handleExerciseSelect = useCallback((exerciseName) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (mentionStartIndex !== null) {
      // Replace @... with @ExerciseName
      const beforeMention = notes.slice(0, mentionStartIndex);
      const newNotes = `${beforeMention}@${exerciseName} `;
      setNotes(newNotes);
    }

    setShowExerciseList(false);
    setMentionStartIndex(null);
  }, [notes, mentionStartIndex]);

  const handleSave = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (isSkipMode) {
      // Save skip data (no effort in skip mode)
      if (skipWorkout) {
        skipWorkout({
          tags: selectedTags,
          notes: notes.trim() || null,
          timestamp: new Date().toISOString(),
        });
      }
    } else {
      // Save the reflection data
      setReflection({
        effort,
        tags: selectedTags,
        notes: notes.trim() || null,
        timestamp: new Date().toISOString(),
      });
    }

    // Show success overlay with animation
    setShowSuccess(true);
    Animated.parallel([
      Animated.spring(successScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(successOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // After icon appears, slide everything down (home slides up effect)
      setTimeout(() => {
        Animated.timing(slideDown, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          navigation.navigate("Tabs", { screen: "Home" });
        });
      }, 300);
    });
  }, [isSkipMode, effort, selectedTags, notes, setReflection, skipWorkout, navigation, successScale, successOpacity, slideDown]);

  const handleSkip = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("Tabs", { screen: "Home" });
  }, [navigation]);

  // Filter exercises based on what's typed after @
  const filteredExercises = useMemo(() => {
    if (mentionStartIndex === null) return exercises;
    const searchText = notes.slice(mentionStartIndex + 1).toLowerCase();
    if (!searchText) return exercises;
    return exercises.filter((ex) =>
      ex.name.toLowerCase().includes(searchText)
    );
  }, [exercises, notes, mentionStartIndex]);

  return (
    <>
      <StatusBar style="light" backgroundColor="transparent" translucent animated />
      <DynamicSafeAreaView
        style={styles.screen}
        backgroundColor={theme.colors.background}
        edges={["top", "bottom"]}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.container}
          keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <TouchableOpacity style={styles.backButton} onPress={handleSkip} activeOpacity={0.7}>
                <Feather name="chevron-left" size={22} color={theme.colors.textSecondary} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>{isSkipMode ? "Skip" : "Reflection"}</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Hint */}
            <Text style={styles.hint}>
              {isSkipMode
                ? "Let us know why you're skipping"
                : "Track how you feel to find patterns over time"}
            </Text>

            {/* Effort Card - only show in workout mode */}
            {!isSkipMode && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardLabel}>Effort (RPE)</Text>
                  <View style={styles.effortBadge}>
                    <View style={styles.effortPill}>
                      <Text style={[styles.effortNumber, { color: getEffortColor(effort) }]}>{effort}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.cardDivider} />
                <View style={styles.sliderContainer}>
                  <Slider
                    style={styles.slider}
                    minimumValue={1}
                    maximumValue={10}
                    step={1}
                    value={effort}
                    onValueChange={handleEffortChange}
                    minimumTrackTintColor={getEffortColor(effort)}
                    maximumTrackTintColor={theme.colors.border}
                    thumbTintColor={getEffortColor(effort)}
                  />
                  <View style={styles.sliderLabels}>
                    <Text style={styles.sliderLabel}>Easy</Text>
                    <Text style={[styles.sliderLabel, styles.sliderLabelCenter]}>Moderate</Text>
                    <Text style={styles.sliderLabel}>Max</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Tags Card */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardLabel}>{isSkipMode ? "Reason" : "Tags"}</Text>
                {selectedTags.length > 0 && (
                  <Text style={[styles.tagsCount, isSkipMode && { color: theme.colors.textSecondary }]}>
                    {selectedTags.length}/3
                  </Text>
                )}
              </View>
              <View style={styles.cardDivider} />
              <View style={styles.tagsRow}>
                {TAGS.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  const isDisabled = !isSelected && selectedTags.length >= 3;
                  const tagColor = getTagColor(tag, isSkipMode);
                  return (
                    <TouchableOpacity
                      key={tag}
                      style={[
                        styles.tag,
                        isSelected && {
                          backgroundColor: tagColor,
                          borderColor: tagColor,
                        },
                        isDisabled && styles.tagDisabled,
                      ]}
                      onPress={() => handleTagToggle(tag)}
                      activeOpacity={0.7}
                      disabled={isDisabled}
                    >
                      <Text
                        style={[
                          styles.tagText,
                          isSelected && {
                            color: isSkipMode ? theme.colors.text : theme.colors.black,
                            fontWeight: "600",
                          },
                          isDisabled && styles.tagTextDisabled,
                        ]}
                      >
                        {tag}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Notes Card */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.notesHeaderLeft}>
                  <Feather name="edit-3" size={14} color={theme.colors.textMuted} />
                  <Text style={styles.cardLabel}>Notes</Text>
                  {!isSkipMode && <Text style={styles.notesHint}>@ to tag</Text>}
                </View>
                {notes.trim() && (
                  <Feather name="save" size={16} color={isSkipMode ? theme.colors.textSecondary : theme.colors.green} />
                )}
              </View>
              <View style={styles.cardDivider} />
              <View style={styles.notesInputContainer}>
                <TextInput
                  style={styles.notesInput}
                  placeholder={isSkipMode ? "Add a note (optional)" : "Add notes... use @ to tag exercises"}
                  placeholderTextColor={theme.colors.textMuted}
                  value={notes}
                  onChangeText={handleNotesChange}
                  multiline
                  textAlignVertical="top"
                  maxLength={200}
                />

                {/* Exercise mention dropdown - only in workout mode */}
                {!isSkipMode && showExerciseList && filteredExercises.length > 0 && (
                  <View style={styles.exerciseDropdown}>
                    <View style={styles.dropdownHeader}>
                      <Feather name="at-sign" size={12} color={theme.colors.textMuted} />
                      <Text style={styles.dropdownTitle}>Tag exercise</Text>
                    </View>
                    <View style={styles.dropdownDivider} />
                    <ScrollView style={styles.dropdownList} nestedScrollEnabled>
                      {filteredExercises.map((exercise, index) => (
                        <React.Fragment key={exercise.id}>
                          {index > 0 && <View style={styles.exerciseDivider} />}
                          <TouchableOpacity
                            style={styles.exerciseOption}
                            onPress={() => handleExerciseSelect(exercise.name)}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.exerciseOptionText}>{exercise.name}</Text>
                          </TouchableOpacity>
                        </React.Fragment>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.saveButton, isSkipMode && styles.skipButton]}
              onPress={handleSave}
              activeOpacity={0.8}
            >
              <Feather name={isSkipMode ? "skip-forward" : "check"} size={18} color={isSkipMode ? theme.colors.text : theme.colors.black} />
              <Text style={[styles.saveButtonText, isSkipMode && styles.skipButtonText]}>
                {isSkipMode ? "Skip workout" : "Save"}
              </Text>
            </TouchableOpacity>
          </View>

        </KeyboardAvoidingView>

        {/* Success Overlay */}
        {showSuccess && (
          <Animated.View
            style={[
              styles.successOverlay,
              {
                opacity: successOpacity,
                transform: [{
                  translateY: slideDown.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, Dimensions.get("window").height],
                  }),
                }],
              }
            ]}
          >
            <Animated.View
              style={[
                styles.successCircle,
                isSkipMode && styles.skipCircle,
                { transform: [{ scale: successScale }] }
              ]}
            >
              <Feather
                name={isSkipMode ? "skip-forward" : "check"}
                size={48}
                color={isSkipMode ? theme.colors.text : theme.colors.black}
              />
            </Animated.View>
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
  container: {
    flex: 1,
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
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: theme.colors.text,
    letterSpacing: -0.5,
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
  headerButtonActive: {
    borderColor: theme.colors.green,
  },
  content: {
    paddingHorizontal: theme.spacing.screenPadding,
    paddingBottom: 120,
    gap: theme.spacing.md,
  },
  hint: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.xs,
    textAlign: "center",
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: theme.colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginHorizontal: -theme.spacing.md,
  },
  effortBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    marginLeft: "auto",
  },
  effortPill: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  effortNumber: {
    fontSize: 16,
    fontWeight: "700",
  },
  effortHint: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: -theme.spacing.xs,
  },
  sliderContainer: {
    marginTop: theme.spacing.xs,
  },
  slider: {
    width: "100%",
    height: 40,
  },
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: theme.spacing.xs,
    paddingHorizontal: 0,
  },
  sliderLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: theme.colors.textSecondary,
  },
  sliderLabelCenter: {
    // Removed absolute positioning
  },
  tagsCount: {
    fontSize: 12,
    fontWeight: "500",
    color: theme.colors.green,
    marginLeft: "auto",
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
  },
  tag: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs + 2,
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  tagDisabled: {
    opacity: 0.4,
  },
  tagText: {
    fontSize: 14,
    fontWeight: "500",
    color: theme.colors.textSecondary,
  },
  tagTextDisabled: {
    color: theme.colors.textMuted,
  },
  notesHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  notesHint: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginLeft: theme.spacing.sm,
    opacity: 0.7,
  },
  notesInputContainer: {
    position: "relative",
    paddingTop: theme.spacing.sm,
  },
  notesInput: {
    fontSize: 15,
    color: theme.colors.text,
    minHeight: 120,
    textAlignVertical: "top",
    lineHeight: 22,
  },
  exerciseDropdown: {
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
  dropdownHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  dropdownTitle: {
    fontSize: 11,
    fontWeight: "500",
    color: theme.colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
  },
  dropdownList: {
    maxHeight: 150,
  },
  exerciseDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
  },
  exerciseOption: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  exerciseOptionText: {
    fontSize: 15,
    fontWeight: "500",
    color: theme.colors.text,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.screenPadding,
    alignItems: "center",
    backgroundColor: theme.colors.background,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.green,
    borderRadius: theme.radius.full,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.black,
  },
  skipButton: {
    backgroundColor: theme.colors.surfaceHover,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  skipButtonText: {
    color: theme.colors.text,
  },
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.background,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
  successCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.green,
    justifyContent: "center",
    alignItems: "center",
  },
  skipCircle: {
    backgroundColor: theme.colors.surfaceHover,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
});
