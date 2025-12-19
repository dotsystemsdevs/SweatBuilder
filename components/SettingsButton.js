import { memo } from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import PropTypes from "prop-types";
import theme from "../theme";

const SettingsButton = memo(function SettingsButton({ style }) {
  const navigation = useNavigation();

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={() => navigation.navigate("Settings")}
      accessibilityRole="button"
      accessibilityLabel="Open Settings"
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      testID="header.settings-button"
    >
      <Feather name="settings" size={18} color={theme.colors.textTitle} />
    </TouchableOpacity>
  );
});

SettingsButton.propTypes = {
  style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
};

export default SettingsButton;

const styles = StyleSheet.create({
  button: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.cardBackground,
  },
});
