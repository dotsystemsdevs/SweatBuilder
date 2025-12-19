import { Modal, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";
import PropTypes from "prop-types";
import theme from "../theme";

export default function SkipWorkoutModal({
  visible,
  reasons,
  selectedReason,
  onSelectReason,
  onCancel,
  onConfirm,
}) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onCancel}>
      <TouchableWithoutFeedback onPress={onCancel} importantForAccessibility="no-hide-descendants">
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.card}>
              <Text style={styles.title}>Skip workout</Text>
              <View style={styles.reasonList}>
                {reasons.map((reason) => {
                  const selected = selectedReason === reason;
                  return (
                    <TouchableOpacity
                      key={reason}
                      style={[styles.reasonChip, selected && styles.reasonChipSelected]}
                      onPress={() => onSelectReason(reason)}
                      accessibilityRole="button"
                      accessibilityLabel={`Reason ${reason}`}
                      accessibilityState={{ selected }}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Text style={[styles.reasonText, selected && styles.reasonTextSelected]}>{reason}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <View style={styles.buttons}>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={onCancel}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel skip"
                >
                  <Text style={styles.secondaryText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.primaryButton, !selectedReason && styles.primaryButtonDisabled]}
                  onPress={onConfirm}
                  disabled={!selectedReason}
                  accessibilityRole="button"
                  accessibilityLabel="Confirm skip workout"
                  accessibilityState={{ disabled: !selectedReason }}
                  testID="today.skip-modal.confirm"
                >
                  <Text style={styles.primaryText}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

SkipWorkoutModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  reasons: PropTypes.arrayOf(PropTypes.string).isRequired,
  selectedReason: PropTypes.string,
  onSelectReason: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
};

SkipWorkoutModal.defaultProps = {
  selectedReason: "",
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
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
  reasonList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  reasonChip: {
    borderWidth: 1,
    borderColor: theme.colors.outline,
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
  },
  reasonChipSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.sectionBackground,
  },
  reasonText: {
    color: theme.colors.textBody,
  },
  reasonTextSelected: {
    color: theme.colors.primary,
    fontWeight: "600",
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
