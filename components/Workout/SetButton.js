import React, { memo } from "react";
import { TouchableOpacity, View, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import PropTypes from "prop-types";
import theme from "../../theme";

const SetButton = memo(({ isCompleted, onPress }) => {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      accessibilityRole="checkbox"
      accessibilityLabel={`Set ${isCompleted ? "completed" : "not completed"}`}
      accessibilityState={{ checked: isCompleted }}
    >
      <View style={[styles.setCircle, isCompleted && styles.setCircleCompleted]}>
        {isCompleted && <Feather name="check" size={16} color={theme.colors.black} />}
      </View>
    </TouchableOpacity>
  );
});

SetButton.displayName = "SetButton";

SetButton.propTypes = {
  isCompleted: PropTypes.bool.isRequired,
  onPress: PropTypes.func.isRequired,
};

const styles = StyleSheet.create({
  setCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.surfaceHover,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  setCircleCompleted: {
    backgroundColor: theme.colors.green,
    borderColor: theme.colors.green,
  },
});

export default SetButton;
