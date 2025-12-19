import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Feather, Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import theme from "../theme";
import { useStatusBar } from "../hooks/useStatusBar";
import DynamicSafeAreaView from "../components/DynamicSafeAreaView";

// Get color based on effort level (1-10)
const getEffortColor = (value) => {
  if (value <= 3) return theme.colors.green;
  if (value <= 5) return theme.colors.yellow;
  if (value <= 7) return theme.colors.orange;
  return theme.colors.red;
};

// Section Component
const Section = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.sectionContent}>{children}</View>
  </View>
);

// Example Tags
const EXAMPLE_TAGS = ["Felt strong", "Tired", "Good form", "Low energy", "New PR"];

// Example Exercises for dropdown
const EXAMPLE_EXERCISES = [
  { id: 1, name: "Bench Press" },
  { id: 2, name: "Squats" },
  { id: 3, name: "Deadlift" },
];

export default function WorkoutUIScreen() {
  useStatusBar(theme.colors.background);
  const navigation = useNavigation();

  // Workout UI state
  const [effort, setEffort] = useState(5);
  const [selectedTags, setSelectedTags] = useState(["Felt strong"]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [completedSets, setCompletedSets] = useState([true, true, false, false]);

  return (
    <DynamicSafeAreaView style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Workout UI</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Effort Slider */}
        <Section title="Effort Slider">
          <View style={styles.effortCard}>
            <View style={styles.effortHeader}>
              <Text style={styles.effortLabel}>EFFORT</Text>
              <Text style={[styles.effortValue, { color: getEffortColor(effort) }]}>{effort}</Text>
            </View>
            <View style={styles.effortDivider} />
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={10}
              step={1}
              value={effort}
              onValueChange={setEffort}
              minimumTrackTintColor={getEffortColor(effort)}
              maximumTrackTintColor={theme.colors.border}
              thumbTintColor={getEffortColor(effort)}
            />
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabel}>Easy</Text>
              <Text style={styles.sliderLabel}>Hard</Text>
            </View>
          </View>
        </Section>

        {/* Tags */}
        <Section title="Tags">
          <View style={styles.tagsContainer}>
            {EXAMPLE_TAGS.map((tag) => {
              const isSelected = selectedTags.includes(tag);
              return (
                <TouchableOpacity
                  key={tag}
                  style={[styles.tag, isSelected && styles.tagSelected]}
                  onPress={() => setSelectedTags((prev) =>
                    prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
                  )}
                >
                  <Text style={[styles.tagText, isSelected && styles.tagTextSelected]}>{tag}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Section>

        {/* Notes Card */}
        <Section title="Notes Card">
          <View style={styles.notesCard}>
            <View style={styles.notesHeader}>
              <Feather name="edit-3" size={14} color={theme.colors.textMuted} />
              <Text style={styles.notesLabel}>NOTES</Text>
              <Text style={styles.notesHint}>@ to tag</Text>
            </View>
            <View style={styles.notesDivider} />
            <TextInput
              style={styles.notesInput}
              placeholder="How did it feel? Any wins or struggles?"
              placeholderTextColor={theme.colors.textMuted}
              multiline
            />
          </View>
        </Section>

        {/* Exercise Dropdown */}
        <Section title="Exercise Dropdown">
          <TouchableOpacity
            style={styles.dropdownTrigger}
            onPress={() => setShowDropdown(!showDropdown)}
          >
            <Text style={styles.dropdownTriggerText}>Toggle @mention dropdown</Text>
            <Feather name={showDropdown ? "chevron-up" : "chevron-down"} size={18} color={theme.colors.textMuted} />
          </TouchableOpacity>
          {showDropdown && (
            <View style={styles.exerciseDropdown}>
              <View style={styles.dropdownHeader}>
                <Feather name="at-sign" size={12} color={theme.colors.textMuted} />
                <Text style={styles.dropdownTitle}>Tag exercise</Text>
              </View>
              <View style={styles.dropdownDivider} />
              {EXAMPLE_EXERCISES.map((exercise, index) => (
                <React.Fragment key={exercise.id}>
                  {index > 0 && <View style={styles.exerciseDivider} />}
                  <TouchableOpacity style={styles.exerciseOption}>
                    <Text style={styles.exerciseOptionText}>{exercise.name}</Text>
                  </TouchableOpacity>
                </React.Fragment>
              ))}
            </View>
          )}
        </Section>

        {/* Set Circles */}
        <Section title="Set Circles">
          <View style={styles.exerciseRow}>
            <View style={styles.exerciseInfo}>
              <Text style={styles.exerciseName}>Bench Press</Text>
              <Text style={styles.exerciseDetails}>4x8 @ 80kg</Text>
            </View>
            <View style={styles.setsRow}>
              {completedSets.map((isCompleted, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => setCompletedSets((prev) => {
                    const newSets = [...prev];
                    newSets[index] = !newSets[index];
                    return newSets;
                  })}
                >
                  <View style={[styles.setCircle, isCompleted && styles.setCircleCompleted]}>
                    {isCompleted && <Feather name="check" size={14} color={theme.colors.black} />}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Section>

        {/* Progress Bar */}
        <Section title="Progress Bar">
          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: "60%" }]} />
            </View>
            <Text style={styles.progressText}>6/10 sets</Text>
          </View>
          <View style={[styles.progressContainer, { marginTop: theme.spacing.md }]}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, styles.progressFillComplete, { width: "100%" }]} />
            </View>
            <Text style={[styles.progressText, { color: theme.colors.green }]}>Complete!</Text>
          </View>
        </Section>

        {/* Action Buttons */}
        <Section title="Workout Buttons">
          <View style={styles.workoutButtons}>
            <TouchableOpacity style={styles.startButton}>
              <Feather name="play" size={18} color={theme.colors.black} />
              <Text style={styles.startButtonText}>Start</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.finishButton}>
              <Feather name="check" size={18} color={theme.colors.black} />
              <Text style={styles.finishButtonText}>Complete</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.skipButton}>
              <Feather name="x" size={18} color={theme.colors.textMuted} />
              <Text style={styles.skipButtonText}>Skip</Text>
            </TouchableOpacity>
          </View>
        </Section>

        {/* Header Buttons */}
        <Section title="Header Buttons">
          <View style={styles.headerButtons}>
            <View style={styles.headerButtonExample}>
              <Feather name="x" size={20} color={theme.colors.textMuted} />
            </View>
            <View style={[styles.headerButtonExample, styles.headerButtonActive]}>
              <Feather name="edit-3" size={18} color={theme.colors.green} />
            </View>
            <View style={styles.headerButtonExample}>
              <Feather name="edit-3" size={18} color={theme.colors.textMuted} />
            </View>
          </View>
          <Text style={styles.headerButtonsNote}>Close / Notes (active) / Notes (inactive)</Text>
        </Section>

        {/* Footer spacing */}
        <View style={{ height: theme.spacing.xxl }} />
      </ScrollView>
    </DynamicSafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.screenPadding,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: theme.colors.text,
  },
  content: {
    paddingBottom: theme.spacing.xxl * 2,
  },
  section: {
    marginHorizontal: theme.spacing.screenPadding,
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: theme.spacing.md,
  },
  sectionContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  // Effort Slider
  effortCard: {
    gap: theme.spacing.sm,
  },
  effortHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  effortLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: theme.colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  effortValue: {
    fontSize: 15,
    fontWeight: "600",
  },
  effortDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginHorizontal: -theme.spacing.lg,
  },
  slider: {
    width: "100%",
    height: 40,
  },
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: -theme.spacing.xs,
  },
  sliderLabel: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },

  // Tags
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
  },
  tag: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  tagSelected: {
    backgroundColor: theme.colors.text,
    borderColor: theme.colors.text,
  },
  tagText: {
    fontSize: 13,
    fontWeight: "500",
    color: theme.colors.textSecondary,
  },
  tagTextSelected: {
    color: theme.colors.black,
  },

  // Notes Card
  notesCard: {
    gap: theme.spacing.sm,
  },
  notesHeader: {
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
    marginLeft: "auto",
  },
  notesDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginHorizontal: -theme.spacing.lg,
  },
  notesInput: {
    fontSize: 15,
    color: theme.colors.text,
    minHeight: 60,
    textAlignVertical: "top",
  },

  // Dropdown
  dropdownTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing.md,
  },
  dropdownTriggerText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  exerciseDropdown: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.md,
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

  // Exercise Row
  exerciseRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 15,
    fontWeight: "500",
    color: theme.colors.text,
  },
  exerciseDetails: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  setsRow: {
    flexDirection: "row",
    gap: 6,
  },
  setCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceHover,
    alignItems: "center",
    justifyContent: "center",
  },
  setCircleCompleted: {
    backgroundColor: theme.colors.text,
  },

  // Progress Bar
  progressContainer: {
    gap: theme.spacing.sm,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.border,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: theme.colors.text,
    borderRadius: 2,
  },
  progressFillComplete: {
    backgroundColor: theme.colors.green,
  },
  progressText: {
    fontSize: 13,
    color: theme.colors.textMuted,
    textAlign: "center",
  },

  // Workout Buttons
  workoutButtons: {
    gap: theme.spacing.md,
  },
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.green,
    borderRadius: theme.radius.full,
    paddingVertical: theme.spacing.md,
  },
  startButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.black,
  },
  finishButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.green,
    borderRadius: theme.radius.full,
    paddingVertical: theme.spacing.md,
  },
  finishButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.black,
  },
  skipButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.full,
    paddingVertical: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  skipButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.text,
  },

  // Header Buttons
  headerButtons: {
    flexDirection: "row",
    gap: theme.spacing.md,
    justifyContent: "center",
    marginBottom: theme.spacing.sm,
  },
  headerButtonExample: {
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
  headerButtonsNote: {
    fontSize: 12,
    color: theme.colors.textMuted,
    textAlign: "center",
  },
});
