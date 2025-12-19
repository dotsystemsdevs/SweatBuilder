import { Modal, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";
import PropTypes from "prop-types";
import theme from "../theme";

export default function SwapWorkoutModal({
  visible,
  options,
  selectedOption,
  onSelect,
  onCancel,
  onConfirm,
}) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onCancel}>
      <TouchableWithoutFeedback onPress={onCancel} importantForAccessibility="no-hide-descendants">
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.card}>
              <Text style={styles.title}>Swap workout</Text>
              <View style={styles.list}>
                {options.map((option) => {
                  const selected = selectedOption?.id === option.id;
                  return (
                    <TouchableOpacity
                      key={option.id}
                      style={[styles.option, selected && styles.optionSelected]}
                      onPress={() => onSelect(option)}
                      accessibilityRole="button"
                      accessibilityLabel={`Swap to ${option.title}`}
                      accessibilityState={{ selected }}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      testID={`today.swap-modal.option.${option.id}`}
                    >
                      <View>
                        <Text style={styles.optionTitle}>{option.title}</Text>
                        <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
                      </View>
                      <Text style={styles.optionDuration}>{option.duration}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <View style={styles.buttons}>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={onCancel}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel swap"
                >
                  <Text style={styles.secondaryText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.primaryButton, !selectedOption && styles.primaryButtonDisabled]}
                  onPress={onConfirm}
                  disabled={!selectedOption}
                  accessibilityRole="button"
                  accessibilityLabel="Confirm swap"
                  accessibilityState={{ disabled: !selectedOption }}
                  testID="today.swap-modal.confirm"
                >
                  <Text style={styles.primaryText}>Update</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

SwapWorkoutModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      subtitle: PropTypes.string.isRequired,
      duration: PropTypes.string.isRequired,
    }),
  ).isRequired,
  selectedOption: PropTypes.shape({
    id: PropTypes.string,
  }),
  onSelect: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
};

SwapWorkoutModal.defaultProps = {
  selectedOption: null,
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: theme.spacing.xl,
  },
  card: {
    width: "100%",
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: theme.colors.textTitle,
  },
  list: {
    gap: theme.spacing.sm,
  },
  option: {
    borderWidth: 1,
    borderColor: theme.colors.outline,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  optionSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.sectionBackground,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.textTitle,
  },
  optionSubtitle: {
    ...theme.typography.muted,
  },
  optionDuration: {
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  buttons: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    borderRadius: theme.radius.md,
    alignItems: "center",
    paddingVertical: theme.spacing.md,
  },
  secondaryText: {
    color: theme.colors.textBody,
    fontWeight: "600",
  },
  primaryButton: {
    flex: 1,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    paddingVertical: theme.spacing.md,
  },
  primaryButtonDisabled: {
    opacity: 0.4,
  },
  primaryText: {
    color: theme.colors.white,
    fontWeight: "600",
  },
});
