import React from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  ScrollView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import theme from "../theme";

// Alternative exercises by category
const EXERCISE_ALTERNATIVES = {
  warmup: [
    { id: "alt-warmup-1", name: "Jumping Jacks", info: "2 min", category: "warmup" },
    { id: "alt-warmup-2", name: "High Knees", info: "1 min", category: "warmup" },
    { id: "alt-warmup-3", name: "Arm Circles", info: "1 min", category: "warmup" },
    { id: "alt-warmup-4", name: "Leg Swings", info: "1 min each leg", category: "warmup" },
    { id: "alt-warmup-5", name: "Hip Circles", info: "1 min", category: "warmup" },
  ],
  main: [
    { id: "alt-main-1", name: "Push-ups", info: "3 × 12", category: "main" },
    { id: "alt-main-2", name: "Dumbbell Rows", info: "3 × 10", category: "main" },
    { id: "alt-main-3", name: "Goblet Squats", info: "3 × 12", category: "main" },
    { id: "alt-main-4", name: "Lunges", info: "3 × 10 each", category: "main" },
    { id: "alt-main-5", name: "Plank", info: "3 × 30 sec", category: "main" },
    { id: "alt-main-6", name: "Dumbbell Press", info: "3 × 10", category: "main" },
    { id: "alt-main-7", name: "Lat Pulldown", info: "3 × 12", category: "main" },
    { id: "alt-main-8", name: "Leg Press", info: "3 × 12", category: "main" },
  ],
  cooldown: [
    { id: "alt-cool-1", name: "Static Stretches", info: "5 min", category: "cooldown" },
    { id: "alt-cool-2", name: "Foam Rolling", info: "5 min", category: "cooldown" },
    { id: "alt-cool-3", name: "Deep Breathing", info: "2 min", category: "cooldown" },
    { id: "alt-cool-4", name: "Light Walking", info: "3 min", category: "cooldown" },
  ],
};

export default function SwapExerciseModal({
  visible,
  exercise,
  onSwap,
  onCancel,
}) {
  const [selectedAlternative, setSelectedAlternative] = React.useState(null);

  // Get alternatives for the exercise's category
  const category = exercise?.category || "main";
  const alternatives = EXERCISE_ALTERNATIVES[category] || EXERCISE_ALTERNATIVES.main;

  // Filter out the current exercise
  const filteredAlternatives = alternatives.filter(alt => alt.id !== exercise?.id);

  const handleConfirm = () => {
    if (selectedAlternative) {
      onSwap(exercise, selectedAlternative);
      setSelectedAlternative(null);
    }
  };

  const handleCancel = () => {
    setSelectedAlternative(null);
    onCancel();
  };

  if (!exercise) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <TouchableWithoutFeedback onPress={handleCancel}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.card}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title}>Swap Exercise</Text>
                <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
                  <Feather name="x" size={20} color={theme.colors.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Current exercise */}
              <View style={styles.currentExercise}>
                <Text style={styles.currentLabel}>Current</Text>
                <Text style={styles.currentName}>{exercise.name}</Text>
                <Text style={styles.currentInfo}>{exercise.info}</Text>
              </View>

              <View style={styles.divider} />

              {/* Alternatives */}
              <Text style={styles.alternativesLabel}>Choose alternative</Text>
              <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
                {filteredAlternatives.map((alt) => {
                  const isSelected = selectedAlternative?.id === alt.id;
                  return (
                    <TouchableOpacity
                      key={alt.id}
                      style={[styles.option, isSelected && styles.optionSelected]}
                      onPress={() => setSelectedAlternative(alt)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.optionContent}>
                        <Text style={[styles.optionName, isSelected && styles.optionNameSelected]}>
                          {alt.name}
                        </Text>
                        <Text style={styles.optionInfo}>{alt.info}</Text>
                      </View>
                      {isSelected && (
                        <Feather name="check" size={18} color={theme.colors.green} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Buttons */}
              <View style={styles.buttons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleCancel}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.confirmButton,
                    !selectedAlternative && styles.confirmButtonDisabled,
                  ]}
                  onPress={handleConfirm}
                  disabled={!selectedAlternative}
                  activeOpacity={0.7}
                >
                  <Feather name="refresh-cw" size={16} color={theme.colors.black} />
                  <Text style={styles.confirmText}>Swap</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: theme.spacing.screenPadding,
  },
  card: {
    width: "100%",
    maxHeight: "80%",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.colors.text,
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
  currentExercise: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  currentLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: theme.colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: theme.spacing.xs,
  },
  currentName: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.text,
  },
  currentInfo: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.md,
  },
  alternativesLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.sm,
  },
  list: {
    maxHeight: 250,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  optionSelected: {
    borderColor: theme.colors.green,
    backgroundColor: theme.colors.greenSoft,
  },
  optionContent: {
    flex: 1,
  },
  optionName: {
    fontSize: 15,
    fontWeight: "500",
    color: theme.colors.text,
  },
  optionNameSelected: {
    color: theme.colors.green,
  },
  optionInfo: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  buttons: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
  },
  cancelButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.text,
  },
  confirmButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.green,
  },
  confirmButtonDisabled: {
    opacity: 0.4,
  },
  confirmText: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.black,
  },
});
